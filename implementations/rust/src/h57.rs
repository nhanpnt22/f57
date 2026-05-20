use crate::b57::{encode, is_canonical, is_valid};
use crate::errors::B57Error;
use blake3::Hasher;

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

pub fn h57_hash(input: &[u8], length: H57Length) -> Result<String, B57Error> {
    if length == H57Length::HashAuto {
        let hash_bytes = compute_hash_blake3_xof(input, 32);
        return Ok(encode(&hash_bytes));
    }

    let bits = bits_by_length(length)?;
    let requested = bits.div_ceil(8);
    let hash_bytes = compute_hash_blake3_xof(input, requested);
    
    Ok(encode(&hash_bytes))
}

pub fn h57_verify(input: &[u8], h57_string: &str, length: H57Length) -> bool {
    h57_hash(input, length)
        .map(|expected| expected == h57_string)
        .unwrap_or(false)
}

pub fn h57_is_valid(h57_string: &str) -> bool {
    is_valid(h57_string)
}

pub fn h57_is_canonical(h57_string: &str) -> bool {
    is_canonical(h57_string)
}

pub fn compute_hash_blake3_xof(input: &[u8], output_len: usize) -> Vec<u8> {
    if output_len == 0 {
        return Vec::new();
    }
    let mut out = vec![0u8; output_len];
    Hasher::new().update(input).finalize_xof().fill(&mut out);
    out
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
        H57Length::HashAuto => 256,
    };
    Ok(bits)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn deterministic() {
        let a = h57_hash(b"hello-h57", H57Length::HashAuto).unwrap();
        let b = h57_hash(b"hello-h57", H57Length::HashAuto).unwrap();
        assert_eq!(a, b);
    }

    #[test]
    fn verify_and_validity() {
        let h = h57_hash(b"verify", H57Length::Len128).unwrap();
        assert!(h57_verify(b"verify", &h, H57Length::Len128));
        assert!(h57_is_valid(&h));
        assert!(h57_is_canonical(&h));
    }

    #[test]
    fn blake3_xof_len() {
        let out = compute_hash_blake3_xof(b"x", 64);
        assert_eq!(out.len(), 64);
    }
}
