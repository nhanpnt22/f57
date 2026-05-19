use crate::b57::{encode, is_canonical, is_valid};
use crate::errors::B57Error;
use blake3::Hasher;
use sha2::{Digest, Sha256, Sha512};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HashFunction {
    Blake3,
    Sha256,
    Sha512,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(i32)]
pub enum H57Length {
    HashAuto = -1,
    Len8 = 8,
    Len16 = 16,
    Len23 = 23,
    Len29 = 29,
    Len32 = 32,
    Len47 = 47,
    Len64 = 64,
    Len70 = 70,
    Len93 = 93,
    Len128 = 128,
    Len186 = 186,
    Len256 = 256,
    Len373 = 373,
    Len512 = 512,
    Hash256 = 10256,
    Hash512 = 10512,
}

pub fn h57_hash(input: &[u8], hash_fn: HashFunction, length: H57Length) -> Result<String, B57Error> {
    let hash_bytes = if hash_fn == HashFunction::Blake3 {
        if length == H57Length::HashAuto {
            compute_hash(input, HashFunction::Blake3)?
        } else {
            let bits = bits_by_length(length)?;
            let requested = bits.div_ceil(8);
            compute_hash_blake3_xof(input, requested)
        }
    } else {
        let base = compute_hash(input, hash_fn)?;
        select_effective_hash_bytes(&base, length)?
    };

    Ok(encode(&hash_bytes))
}

pub fn h57_verify(input: &[u8], h57_string: &str, hash_fn: HashFunction, length: H57Length) -> bool {
    h57_hash(input, hash_fn, length)
        .map(|expected| expected == h57_string)
        .unwrap_or(false)
}

pub fn h57_is_valid(h57_string: &str) -> bool {
    is_valid(h57_string)
}

pub fn h57_is_canonical(h57_string: &str) -> bool {
    is_canonical(h57_string)
}

pub fn compute_hash(input: &[u8], hash_fn: HashFunction) -> Result<Vec<u8>, B57Error> {
    match hash_fn {
        HashFunction::Sha256 => Ok(Sha256::digest(input).to_vec()),
        HashFunction::Sha512 => Ok(Sha512::digest(input).to_vec()),
        HashFunction::Blake3 => {
            let mut out = vec![0u8; 32];
            Hasher::new().update(input).finalize_xof().fill(&mut out);
            Ok(out)
        }
    }
}

pub fn compute_hash_blake3_xof(input: &[u8], output_len: usize) -> Vec<u8> {
    if output_len == 0 {
        return Vec::new();
    }
    let mut out = vec![0u8; output_len];
    Hasher::new().update(input).finalize_xof().fill(&mut out);
    out
}

pub fn select_effective_hash_bytes(hash_bytes: &[u8], length: H57Length) -> Result<Vec<u8>, B57Error> {
    if length == H57Length::HashAuto {
        return Ok(hash_bytes.to_vec());
    }
    let bits = bits_by_length(length)?;
    let requested = bits.div_ceil(8);
    if requested > hash_bytes.len() {
        return Err(B57Error::entropy_exceeded(requested, hash_bytes.len()));
    }
    Ok(hash_bytes[..requested].to_vec())
}

pub fn bits_by_length(length: H57Length) -> Result<usize, B57Error> {
    let bits = match length {
        H57Length::Len8 => 8,
        H57Length::Len16 => 16,
        H57Length::Len23 => 23,
        H57Length::Len29 => 29,
        H57Length::Len32 => 32,
        H57Length::Len47 => 47,
        H57Length::Len64 => 64,
        H57Length::Len70 => 70,
        H57Length::Len93 => 93,
        H57Length::Len128 => 128,
        H57Length::Len186 => 186,
        H57Length::Len256 => 256,
        H57Length::Len373 => 373,
        H57Length::Len512 => 512,
        H57Length::Hash256 => 256,
        H57Length::Hash512 => 512,
        H57Length::HashAuto => return Err(B57Error::invalid_length_enum(length as i32)),
    };
    Ok(bits)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::errors::ErrorCode;

    #[test]
    fn deterministic() {
        let a = h57_hash(b"hello-h57", HashFunction::Sha256, H57Length::HashAuto).unwrap();
        let b = h57_hash(b"hello-h57", HashFunction::Sha256, H57Length::HashAuto).unwrap();
        assert_eq!(a, b);
    }

    #[test]
    fn auto_lengths() {
        let s256 = h57_hash(b"x", HashFunction::Sha256, H57Length::HashAuto).unwrap();
        let s512 = h57_hash(b"x", HashFunction::Sha512, H57Length::HashAuto).unwrap();
        assert_eq!(s256.len(), 44);
        assert_eq!(s512.len(), 88);
    }

    #[test]
    fn invalid_length_enum() {
        let e = bits_by_length(H57Length::HashAuto).unwrap_err();
        assert_eq!(e.code, ErrorCode::InvalidLengthEnum);
    }

    #[test]
    fn entropy_exceeded() {
        let e = h57_hash(b"x", HashFunction::Sha256, H57Length::Len512).unwrap_err();
        assert_eq!(e.code, ErrorCode::EntropyExceeded);
    }

    #[test]
    fn verify_and_validity() {
        let h = h57_hash(b"verify", HashFunction::Blake3, H57Length::Len128).unwrap();
        assert!(h57_verify(b"verify", &h, HashFunction::Blake3, H57Length::Len128));
        assert!(h57_is_valid(&h));
        assert!(h57_is_canonical(&h));
    }

    #[test]
    fn blake3_xof_len() {
        let out = compute_hash_blake3_xof(b"x", 64);
        assert_eq!(out.len(), 64);
    }
}
