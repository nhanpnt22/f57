use crate::b57::{decode, encode, is_canonical, is_valid};
use crate::errors::B57Error;
use crate::h57::H57Length;
use crate::id57::{id57_bits_by_length, mask_excess_bits, ID57Length};
use aes_gcm::aead::{Aead, Payload};
use aes_gcm::{Aes256Gcm, KeyInit, Nonce};
use rand::rngs::OsRng;
use rand::RngCore;

pub const S57_VERSION: u8 = 0x01;

#[derive(Debug, Clone)]
pub struct S57Config {
    pub server_secret_key: Vec<u8>,
    pub environment_salt: Vec<u8>,
    pub key_id: u8,
}

#[derive(Debug, Clone)]
pub struct S57Keys {
    pub b57_aes_256_key: [u8; 32],
    pub h57_key: [u8; 32],
    pub id57_key: [u8; 32],
    pub key_id: u8,
}

#[derive(Debug, Clone)]
pub struct S57 {
    server_secret: Vec<u8>,
    env_salt: Vec<u8>,
    pub keys: S57Keys,
}

impl S57 {
    pub fn new(mut config: S57Config) -> Result<Self, B57Error> {
        if config.server_secret_key.len() < 32 || config.environment_salt.is_empty() {
            return Err(B57Error::key_invalid());
        }
        if config.key_id == 0 {
            config.key_id = 1;
        }

        let mut s = Self {
            server_secret: config.server_secret_key,
            env_salt: config.environment_salt,
            keys: S57Keys {
                b57_aes_256_key: [0u8; 32],
                h57_key: [0u8; 32],
                id57_key: [0u8; 32],
                key_id: config.key_id,
            },
        };
        s.keys = s.resolve_keys(config.key_id)?;
        Ok(s)
    }

    pub fn resolve_keys(&self, key_id: u8) -> Result<S57Keys, B57Error> {
        let mut seed = Vec::with_capacity(self.server_secret.len() + self.env_salt.len());
        seed.extend_from_slice(&self.server_secret);
        seed.extend_from_slice(&self.env_salt);
        if seed.len() < 32 {
            return Err(B57Error::key_invalid());
        }

        let b57_aes_256_key = blake3::derive_key("S57/B57_AES_256/v1", &seed);
        let h57_key = blake3::derive_key("S57/H57_KEY/v1", &seed);
        let id57_key = blake3::derive_key("S57/ID57_KEY/v1", &seed);

        Ok(S57Keys {
            b57_aes_256_key,
            h57_key,
            id57_key,
            key_id,
        })
    }

    pub fn hash(&self, data: &[u8], length: H57Length) -> Result<String, B57Error> {
        let bits = resolve_s57_h57_bits(length)?;
        let requested = bits.div_ceil(8);
        let mut out = vec![0u8; requested];
        let mut hasher = blake3::Hasher::new_keyed(&self.keys.h57_key);
        hasher.update(data);
        hasher.finalize_xof().fill(&mut out);
        mask_excess_bits(&mut out, bits);
        Ok(encode(&out))
    }

    pub fn id(&self, data: &[u8], length: ID57Length) -> Result<String, B57Error> {
        let bits = if length == ID57Length::Default {
            128
        } else {
            id57_bits_by_length(length)?
        };
        if bits != 128 && bits != 256 && bits != 512 {
            return Err(B57Error::invalid_length_enum(length as i32));
        }

        let requested = bits.div_ceil(8);
        let mut out = vec![0u8; requested];
        let mut hasher = blake3::Hasher::new_keyed(&self.keys.id57_key);
        hasher.update(data);
        hasher.finalize_xof().fill(&mut out);
        mask_excess_bits(&mut out, bits);
        Ok(encode(&out))
    }

    pub fn random(&self) -> Result<String, B57Error> {
        Ok(encode_r57_128(&read_entropy_bytes(16)?))
    }

    pub fn random_time(&self) -> Result<String, B57Error> {
        let mut t = [0u8; 4];
        let now_secs = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map_err(|_| B57Error::invalid_input("system clock before unix epoch"))?
            .as_secs() as u32;
        t.copy_from_slice(&now_secs.to_be_bytes());

        let r = read_entropy_bytes(12)?;
        let mixed = mix_entropy_128(&[&t, &r]);
        Ok(encode_r57_128(&mixed))
    }

    pub fn random_counter(&self, counter: u32) -> Result<String, B57Error> {
        let c = counter.to_be_bytes();
        let r = read_entropy_bytes(12)?;
        let mixed = mix_entropy_128(&[&c, &r]);
        Ok(encode_r57_128(&mixed))
    }

    pub fn random_session(&self, session_secret: &[u8]) -> Result<String, B57Error> {
        let nonce = read_entropy_bytes(16)?;
        let key = blake3::derive_key("S57/R57_SESSION/v1", session_secret);
        let h = blake3::keyed_hash(&key, &nonce);
        Ok(encode_r57_128(&h.as_bytes()[..16]))
    }

    pub fn random_device(&self, device_secret: &[u8]) -> Result<String, B57Error> {
        let nonce = read_entropy_bytes(16)?;
        let key = blake3::derive_key("S57/R57_DEVICE/v1", device_secret);
        let h = blake3::keyed_hash(&key, &nonce);
        Ok(encode_r57_128(&h.as_bytes()[..16]))
    }

    pub fn random_derived(&self, master_secret: &[u8], unique_input: &[u8]) -> Result<String, B57Error> {
        let key = blake3::derive_key("S57/R57_DERIVED/v1", master_secret);
        let h = blake3::keyed_hash(&key, unique_input);
        Ok(encode_r57_128(&h.as_bytes()[..16]))
    }

    pub fn random_hardened(&self) -> Result<String, B57Error> {
        let seed = read_entropy_bytes(16)?;
        let mixed = mix_entropy_128(&[&seed]);
        Ok(encode_r57_128(&mixed))
    }

    pub fn random_hybrid(&self, sources: &[&[u8]]) -> Result<String, B57Error> {
        if sources.is_empty() {
            return Err(B57Error::invalid_input("random_hybrid requires at least one source"));
        }
        let mixed = mix_entropy_128(sources);
        Ok(encode_r57_128(&mixed))
    }

    pub fn encrypt(&self, plaintext: &[u8], aad: &[u8]) -> Result<String, B57Error> {
        let key = self.keys.b57_aes_256_key;
        let cipher = Aes256Gcm::new_from_slice(&key).map_err(|_| B57Error::key_invalid())?;

        let mut nonce = [0u8; 12];
        OsRng
            .try_fill_bytes(&mut nonce)
            .map_err(|_| B57Error::insufficient_entropy())?;

        let ciphertext_with_tag = cipher
            .encrypt(Nonce::from_slice(&nonce), Payload { msg: plaintext, aad })
            .map_err(|_| B57Error::auth_failure())?;

        let mut envelope = Vec::with_capacity(2 + nonce.len() + ciphertext_with_tag.len());
        envelope.push(S57_VERSION);
        envelope.push(self.keys.key_id);
        envelope.extend_from_slice(&nonce);
        envelope.extend_from_slice(&ciphertext_with_tag);

        Ok(encode(&envelope))
    }

    pub fn decrypt(&self, b57_string: &str, aad: &[u8], expected_key_id: Option<u8>) -> Result<Vec<u8>, B57Error> {
        let env = decode(b57_string)?;
        if env.len() < 30 {
            return Err(B57Error::invalid_input("invalid envelope length"));
        }

        let version = env[0];
        if version != S57_VERSION {
            return Err(B57Error::invalid_version(version));
        }

        let key_id = env[1];
        if let Some(expected) = expected_key_id {
            if key_id != expected {
                return Err(B57Error::key_unavailable(key_id));
            }
        }
        if key_id != self.keys.key_id {
            return Err(B57Error::key_unavailable(key_id));
        }

        let nonce = &env[2..14];
        let ciphertext_with_tag = &env[14..];

        let cipher =
            Aes256Gcm::new_from_slice(&self.keys.b57_aes_256_key).map_err(|_| B57Error::key_invalid())?;
        cipher
            .decrypt(
                Nonce::from_slice(nonce),
                Payload {
                    msg: ciphertext_with_tag,
                    aad,
                },
            )
            .map_err(|_| B57Error::auth_failure())
    }
}

pub fn s57_is_valid(s: &str) -> bool {
    is_valid(s)
}

pub fn s57_is_canonical(s: &str) -> bool {
    is_canonical(s)
}

fn resolve_s57_h57_bits(length: H57Length) -> Result<usize, B57Error> {
    let bits = match length {
        H57Length::HashAuto => 256,
        H57Length::Len128 => 128,
        H57Length::Len256 => 256,
        H57Length::Len512 => 512,
        _ => return Err(B57Error::invalid_length_enum(length as i32)),
    };
    Ok(bits)
}

fn read_entropy_bytes(length: usize) -> Result<Vec<u8>, B57Error> {
    let mut out = vec![0u8; length];
    OsRng
        .try_fill_bytes(&mut out)
        .map_err(|_| B57Error::insufficient_entropy())?;
    Ok(out)
}

fn mix_entropy_128(parts: &[&[u8]]) -> Vec<u8> {
    let mut hasher = blake3::Hasher::new();
    for part in parts {
        hasher.update(part);
    }
    let mut out = [0u8; 16];
    hasher.finalize_xof().fill(&mut out);
    out.to_vec()
}

fn encode_r57_128(raw: &[u8]) -> String {
    let mut encoded = encode(raw);
    if encoded.len() == 22 {
        return encoded;
    }

    let mut derived = raw.to_vec();
    while encoded.len() < 22 {
        derived = mix_entropy_128(&[derived.as_slice(), &[0x57]]);
        encoded = encode(&derived);
    }
    encoded
}
