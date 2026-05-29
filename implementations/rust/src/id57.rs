use crate::b57::{encode, is_canonical, is_valid};
use crate::errors::B57Error;
use crate::h57::compute_hash_blake3_xof;
use std::collections::HashMap;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
#[repr(i32)]
pub enum ID57Length {
    Default = 0,
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
}

pub fn id57_generate(
    input: &[u8],
    length: ID57Length,
) -> Result<String, B57Error> {
    let effective = resolve_id57_length(length)?;
    let bits = id57_bits_by_length(effective)?;
    let requested = bits.div_ceil(8);

    let hash_bytes = compute_hash_blake3_xof(input, requested);
    let mut effective_bytes = hash_bytes[..requested].to_vec();
    mask_excess_bits(&mut effective_bytes, bits);

    Ok(encode(&effective_bytes))
}

pub fn id57_generate_default(input: &[u8]) -> Result<String, B57Error> {
    id57_generate(input, ID57Length::Default)
}

pub fn id57_verify(
    input: &[u8],
    id57_string: &str,
    length: ID57Length,
) -> bool {
    id57_generate(input, length)
        .map(|expected| expected == id57_string)
        .unwrap_or(false)
}

pub fn id57_verify_default(input: &[u8], id57_string: &str) -> bool {
    id57_verify(
        input,
        id57_string,
        ID57Length::Default,
    )
}

pub fn id57_is_valid(id57_string: &str) -> bool {
    is_valid(id57_string)
}

pub fn id57_is_canonical(id57_string: &str) -> bool {
    is_canonical(id57_string)
}

pub fn resolve_id57_length(length: ID57Length) -> Result<ID57Length, B57Error> {
    if length == ID57Length::Default {
        return Ok(ID57Length::Len128);
    }
    id57_bits_by_length(length)?;
    Ok(length)
}

pub fn mask_excess_bits(bytes: &mut [u8], bit_length: usize) {
    if bytes.is_empty() {
        return;
    }
    let excess = bytes.len() * 8usize - bit_length;
    if excess == 0 {
        return;
    }
    let mask = 0xFFu8 << excess;
    let last = bytes.len() - 1;
    bytes[last] &= mask;
}

pub fn id57_bits_by_length(length: ID57Length) -> Result<usize, B57Error> {
    let map: HashMap<ID57Length, usize> = HashMap::from([
        (ID57Length::Len8, 8),
        (ID57Length::Len16, 16),
        (ID57Length::Len23, 23),
        (ID57Length::Len29, 29),
        (ID57Length::Len32, 32),
        (ID57Length::Len47, 47),
        (ID57Length::Len64, 64),
        (ID57Length::Len70, 70),
        (ID57Length::Len93, 93),
        (ID57Length::Len128, 128),
        (ID57Length::Len186, 186),
        (ID57Length::Len256, 256),
        (ID57Length::Len373, 373),
        (ID57Length::Len512, 512),
    ]);

    map.get(&length)
        .copied()
        .ok_or(B57Error::invalid_length_enum(length as i32))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn deterministic() {
        let a = id57_generate(b"id57", ID57Length::Len256).unwrap();
        let b = id57_generate(b"id57", ID57Length::Len256).unwrap();
        assert_eq!(a, b);
    }

    #[test]
    fn default_uses_len128() {
        let d = id57_generate_default(b"x").unwrap();
        let p = id57_generate(b"x", ID57Length::Default).unwrap();
        assert_eq!(d, p);
        assert_eq!(d.len(), 22);
    }

    #[test]
    fn resolve_default() {
        let resolved = resolve_id57_length(ID57Length::Default).unwrap();
        assert_eq!(resolved, ID57Length::Len128);
    }

    #[test]
    fn verify_paths() {
        let s = id57_generate_default(b"abc").unwrap();
        assert!(id57_verify_default(b"abc", &s));
        assert!(!id57_verify_default(b"abcx", &s));
    }

    #[test]
    fn mask_bits() {
        let mut b = vec![0xFF];
        mask_excess_bits(&mut b, 5);
        assert_eq!(b[0], 0xF8);
    }
}
