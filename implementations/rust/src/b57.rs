use crate::errors::B57Error;
use num_bigint::BigUint;
use num_traits::{ToPrimitive, Zero};
use once_cell::sync::Lazy;

pub const ALPHABET: &str = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz123456789";
const BASE: usize = 57;

static ALPHA_INDEX: Lazy<[i16; 256]> = Lazy::new(|| {
    let mut index = [-1i16; 256];
    for (i, c) in ALPHABET.as_bytes().iter().enumerate() {
        index[*c as usize] = i as i16;
    }
    index
});

pub fn encode(data: &[u8]) -> String {
    if data.is_empty() {
        return String::new();
    }

    let leading_zeros = data.iter().take_while(|b| **b == 0).count();
    if leading_zeros == data.len() {
        return "A".repeat(data.len());
    }

    let mut num = BigUint::from_bytes_be(&data[leading_zeros..]);
    let base = BigUint::from(BASE as u32);
    let mut out: Vec<u8> = Vec::new();

    while !num.is_zero() {
        let rem = (&num % &base).to_usize().unwrap_or(0);
        num /= &base;
        out.push(ALPHABET.as_bytes()[rem]);
    }

    out.reverse();
    let mut result = Vec::with_capacity(leading_zeros + out.len());
    result.extend(std::iter::repeat_n(ALPHABET.as_bytes()[0], leading_zeros));
    result.extend(out);
    String::from_utf8(result).unwrap_or_default()
}

pub fn decode(s: &str) -> Result<Vec<u8>, B57Error> {
    if s.is_empty() {
        return Ok(Vec::new());
    }

    validate_characters(s)?;

    let bytes = s.as_bytes();
    let leading_zeros = bytes
        .iter()
        .take_while(|b| ALPHA_INDEX[**b as usize] == 0)
        .count();

    if leading_zeros == s.len() {
        let out = vec![0u8; s.len()];
        verify_canonical(s, &out)?;
        return Ok(out);
    }

    let mut num = BigUint::zero();
    let base = BigUint::from(BASE as u32);
    for b in &bytes[leading_zeros..] {
        let idx = ALPHA_INDEX[*b as usize] as u32;
        num = num * &base + BigUint::from(idx);
    }

    let num_bytes = num.to_bytes_be();
    let mut result = vec![0u8; leading_zeros + num_bytes.len()];
    result[leading_zeros..].copy_from_slice(&num_bytes);

    verify_canonical(s, &result)?;
    Ok(result)
}

pub fn is_valid(s: &str) -> bool {
    s.bytes().all(|b| ALPHA_INDEX[b as usize] >= 0)
}

pub fn is_canonical(s: &str) -> bool {
    if s.is_empty() {
        return true;
    }
    if !is_valid(s) {
        return false;
    }
    decode(s).map(|d| encode(&d) == s).unwrap_or(false)
}

pub fn encoded_length(byte_len: usize) -> usize {
    if byte_len == 0 {
        return 0;
    }
    ((byte_len as f64 * 8.0) / 57f64.log2()).ceil() as usize
}

pub fn decoded_length(char_len: usize) -> usize {
    if char_len == 0 {
        return 0;
    }
    ((char_len as f64 * 57f64.log2()) / 8.0).floor() as usize
}

fn validate_characters(s: &str) -> Result<(), B57Error> {
    for (i, b) in s.bytes().enumerate() {
        if ALPHA_INDEX[b as usize] < 0 {
            return Err(B57Error::invalid_char(i, b));
        }
    }
    Ok(())
}

fn verify_canonical(original: &str, decoded: &[u8]) -> Result<(), B57Error> {
    if encode(decoded) != original {
        return Err(B57Error::non_canonical());
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn roundtrip() {
        let data = b"hello world";
        let enc = encode(data);
        let dec = decode(&enc).unwrap();
        assert_eq!(dec, data);
    }

    #[test]
    fn leading_zeros_preserved() {
        let data = vec![0, 0, 1, 2, 3];
        let enc = encode(&data);
        assert!(enc.starts_with("AA"));
        assert_eq!(decode(&enc).unwrap(), data);
    }

    #[test]
    fn all_zeroes() {
        assert_eq!(encode(&[0, 0, 0]), "AAA");
        assert_eq!(decode("AAA").unwrap(), vec![0, 0, 0]);
    }

    #[test]
    fn invalid_char() {
        let err = decode("A0").unwrap_err();
        assert_eq!(err.code, crate::errors::ErrorCode::InvalidChar);
    }

    #[test]
    fn validity_and_canonicality() {
        let e = encode(b"abc");
        assert!(is_valid(&e));
        assert!(is_canonical(&e));
        assert!(!is_valid("A0"));
    }

    #[test]
    fn length_helpers() {
        assert_eq!(encoded_length(0), 0);
        assert_eq!(decoded_length(0), 0);
        assert!(encoded_length(16) > 0);
        assert!(decoded_length(22) > 0);
    }
}
