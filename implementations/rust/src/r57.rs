use crate::b57::{encode, is_canonical, is_valid};
use crate::errors::B57Error;
use blake3::Hasher;
use once_cell::sync::OnceCell;
use rand::rngs::OsRng;
use rand::RngCore;
use std::sync::atomic::{AtomicU32, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

static R57_COUNTER: AtomicU32 = AtomicU32::new(0);
static SESSION_SECRET: OnceCell<[u8; 32]> = OnceCell::new();
static DEVICE_SECRET: OnceCell<[u8; 32]> = OnceCell::new();
static MASTER_SECRET: OnceCell<[u8; 32]> = OnceCell::new();

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(i32)]
pub enum R57Mode {
    Csprng = 1,
    HashEntropy = 2,
    KdfDerived = 3,
    CounterKdf = 4,
    TimestampKdf = 5,
    HardwareRng = 6,
    UuidV4Compat = 7,
    HybridEntropy = 8,
}

pub fn r57_generate(mode: R57Mode) -> Result<String, B57Error> {
    let raw = generate_r57_entropy(mode)?;
    Ok(encode_r57_128(&raw))
}

pub fn r57_is_valid(s: &str) -> bool {
    s.len() == 22 && is_valid(s)
}

pub fn r57_is_canonical(s: &str) -> bool {
    s.len() == 22 && is_canonical(s)
}

fn generate_r57_entropy(mode: R57Mode) -> Result<Vec<u8>, B57Error> {
    match mode {
        R57Mode::Csprng => read_entropy_bytes(16),
        R57Mode::HashEntropy => {
            let seed = read_entropy_bytes(16)?;
            Ok(mix_entropy_128(&[seed.as_slice()]))
        }
        R57Mode::KdfDerived => generate_kdf_derived_entropy(),
        R57Mode::CounterKdf => generate_counter_kdf_entropy(),
        R57Mode::TimestampKdf => generate_timestamp_kdf_entropy(),
        R57Mode::HardwareRng => read_entropy_bytes(16),
        R57Mode::UuidV4Compat => generate_uuidv4_compat_entropy(),
        R57Mode::HybridEntropy => generate_hybrid_entropy(),
    }
}

fn generate_kdf_derived_entropy() -> Result<Vec<u8>, B57Error> {
    let context = read_entropy_bytes(16)?;
    let secret = master_secret()?;
    Ok(mix_entropy_128(&[secret.as_slice(), context.as_slice()]))
}

fn generate_counter_kdf_entropy() -> Result<Vec<u8>, B57Error> {
    let random_component = read_entropy_bytes(12)?;
    let counter = R57_COUNTER.fetch_add(1, Ordering::SeqCst).wrapping_add(1);
    let mut c = [0u8; 4];
    c.copy_from_slice(&counter.to_be_bytes());
    Ok(mix_entropy_128(&[&c, &random_component]))
}

fn generate_timestamp_kdf_entropy() -> Result<Vec<u8>, B57Error> {
    let random_component = read_entropy_bytes(12)?;
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|_| B57Error::invalid_input("system clock before unix epoch"))?
        .as_secs() as u32;
    let minutes = now / 60;
    let timestamp = minutes.to_be_bytes();
    let secret = device_secret()?;
    Ok(mix_entropy_128(&[
        secret.as_slice(),
        &timestamp,
        random_component.as_slice(),
    ]))
}

fn generate_uuidv4_compat_entropy() -> Result<Vec<u8>, B57Error> {
    let mut raw = read_entropy_bytes(16)?;
    raw[6] = (raw[6] & 0x0F) | 0x40;
    raw[8] = (raw[8] & 0x3F) | 0x80;
    Ok(raw)
}

fn generate_hybrid_entropy() -> Result<Vec<u8>, B57Error> {
    let seed = read_entropy_bytes(16)?;
    let counter = R57_COUNTER.fetch_add(1, Ordering::SeqCst).wrapping_add(1).to_be_bytes();

    let now_nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|_| B57Error::invalid_input("system clock before unix epoch"))?
        .as_nanos() as u64;
    let timestamp = now_nanos.to_be_bytes();
    let secret = session_secret()?;

    Ok(mix_entropy_128(&[
        seed.as_slice(),
        &counter,
        &timestamp,
        secret.as_slice(),
    ]))
}

fn read_entropy_bytes(length: usize) -> Result<Vec<u8>, B57Error> {
    let mut out = vec![0u8; length];
    OsRng
        .try_fill_bytes(&mut out)
        .map_err(|_| B57Error::insufficient_entropy())?;
    Ok(out)
}

fn random_secret() -> Result<[u8; 32], B57Error> {
    let mut s = [0u8; 32];
    OsRng
        .try_fill_bytes(&mut s)
        .map_err(|_| B57Error::insufficient_entropy())?;
    Ok(s)
}

fn session_secret() -> Result<&'static [u8; 32], B57Error> {
    if let Some(v) = SESSION_SECRET.get() {
        return Ok(v);
    }
    let v = random_secret()?;
    let _ = SESSION_SECRET.set(v);
    SESSION_SECRET
        .get()
        .ok_or_else(|| B57Error::invalid_input("failed to initialize session secret"))
}

fn device_secret() -> Result<&'static [u8; 32], B57Error> {
    if let Some(v) = DEVICE_SECRET.get() {
        return Ok(v);
    }
    let v = random_secret()?;
    let _ = DEVICE_SECRET.set(v);
    DEVICE_SECRET
        .get()
        .ok_or_else(|| B57Error::invalid_input("failed to initialize device secret"))
}

fn master_secret() -> Result<&'static [u8; 32], B57Error> {
    if let Some(v) = MASTER_SECRET.get() {
        return Ok(v);
    }
    let v = random_secret()?;
    let _ = MASTER_SECRET.set(v);
    MASTER_SECRET
        .get()
        .ok_or_else(|| B57Error::invalid_input("failed to initialize master secret"))
}

fn mix_entropy_128(parts: &[&[u8]]) -> Vec<u8> {
    let mut hasher = Hasher::new();
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
        derived = mix_entropy_128(&[&derived, &[0x57]]);
        encoded = encode(&derived);
    }
    encoded
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn mode_values_and_validation() {
        assert_eq!(R57Mode::Csprng as i32, 1);
        let id = r57_generate(R57Mode::Csprng).unwrap();
        assert!(r57_is_valid(&id));
        assert!(r57_is_canonical(&id));
    }

    #[test]
    fn all_modes_generate() {
        let modes = [
            R57Mode::Csprng,
            R57Mode::HashEntropy,
            R57Mode::KdfDerived,
            R57Mode::CounterKdf,
            R57Mode::TimestampKdf,
            R57Mode::HardwareRng,
            R57Mode::UuidV4Compat,
            R57Mode::HybridEntropy,
        ];

        for mode in modes {
            let id = r57_generate(mode).unwrap();
            assert_eq!(id.len(), 22);
            assert!(r57_is_valid(&id));
            assert!(r57_is_canonical(&id));
        }
    }
}
