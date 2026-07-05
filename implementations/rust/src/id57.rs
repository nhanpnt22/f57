use crate::b57::{encode, encoded_length, is_canonical, is_valid};
use crate::errors::B57Error;
use crate::h57::compute_hash_blake3_xof;
use std::collections::HashMap;

/// ID57 length selector.
///
/// The SIGN of the underlying value selects the generation mode
/// (ID57 Core API 5.1/7.3):
///
/// - `Default` (0) resolves to `Len128` (bit-length mode).
/// - Positive values (`Len8`..`Len512`) select BIT-LENGTH mode: the
///   character width is a `[min_chars, max_chars]` BOUND, not fixed
///   (7.1/7.3).
/// - Negative values (`Fixed2`..`Fixed12`) select FIXED-WIDTH mode: the
///   magnitude is the exact, guaranteed character count (7.2/7.3),
///   produced by cutting the `Len128` output to that many characters
///   (5.2).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
#[repr(i32)]
pub enum ID57Length {
    Default = 0,
    Len8 = 8,
    Len16 = 16,
    Len32 = 32,
    Len64 = 64,
    Len128 = 128,
    Len256 = 256,
    Len512 = 512,
    Fixed2 = -2,
    Fixed3 = -3,
    Fixed4 = -4,
    Fixed5 = -5,
    Fixed6 = -6,
    Fixed7 = -7,
    Fixed8 = -8,
    Fixed9 = -9,
    Fixed10 = -10,
    Fixed11 = -11,
    Fixed12 = -12,
}

impl TryFrom<i32> for ID57Length {
    type Error = B57Error;

    /// Maps a raw `length_enum` integer (as would cross an FFI/dynamic
    /// binding boundary) to a defined `ID57Length` variant.
    ///
    /// This is the mechanism by which an out-of-range negative value
    /// (e.g. -13, -1, -0 i.e. 0-magnitude-negative is not representable)
    /// is rejected with `INVALID_LENGTH_ENUM`, since Rust's enum type
    /// itself only admits defined discriminants.
    fn try_from(value: i32) -> Result<Self, B57Error> {
        match value {
            0 => Ok(ID57Length::Default),
            8 => Ok(ID57Length::Len8),
            16 => Ok(ID57Length::Len16),
            32 => Ok(ID57Length::Len32),
            64 => Ok(ID57Length::Len64),
            128 => Ok(ID57Length::Len128),
            256 => Ok(ID57Length::Len256),
            512 => Ok(ID57Length::Len512),
            -2 => Ok(ID57Length::Fixed2),
            -3 => Ok(ID57Length::Fixed3),
            -4 => Ok(ID57Length::Fixed4),
            -5 => Ok(ID57Length::Fixed5),
            -6 => Ok(ID57Length::Fixed6),
            -7 => Ok(ID57Length::Fixed7),
            -8 => Ok(ID57Length::Fixed8),
            -9 => Ok(ID57Length::Fixed9),
            -10 => Ok(ID57Length::Fixed10),
            -11 => Ok(ID57Length::Fixed11),
            -12 => Ok(ID57Length::Fixed12),
            other => Err(B57Error::invalid_length_enum(other)),
        }
    }
}

/// 5.1 id57_generate.
///
/// Dispatches on the sign of `length` (resolved via `resolve_id57_length`):
///
/// - `effective < 0` (FIXED-WIDTH, 5.2): generate the `Len128` identifier
///   for the same input and cut it to the first `k = -effective`
///   characters. `Len128` output is always >= 16 chars and every defined
///   `k <= 12`, so the cut always succeeds.
/// - `effective >= 0` (BIT-LENGTH, unchanged): hash, truncate to
///   `bits(effective)`, mask excess bits, B57-encode.
pub fn id57_generate(input: &[u8], length: ID57Length) -> Result<String, B57Error> {
    let effective = resolve_id57_length(length)?;
    let raw = effective as i32;

    if raw < 0 {
        let k = (-raw) as usize;
        let full = id57_generate(input, ID57Length::Len128)?;
        return Ok(full[..k].to_string());
    }

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

pub fn id57_verify(input: &[u8], id57_string: &str, length: ID57Length) -> bool {
    id57_generate(input, length)
        .map(|expected| expected == id57_string)
        .unwrap_or(false)
}

pub fn id57_verify_default(input: &[u8], id57_string: &str) -> bool {
    id57_verify(input, id57_string, ID57Length::Default)
}

pub fn id57_is_valid(id57_string: &str) -> bool {
    is_valid(id57_string)
}

pub fn id57_is_canonical(id57_string: &str) -> bool {
    is_canonical(id57_string)
}

/// 11.4 id57_range -> (min_chars, max_chars).
///
/// Fixed widths (negative `length`) return `(k, k)`. Bit lengths
/// (positive/DEFAULT) return the `[byte_length, b57_encoded_length]`
/// bound (7.3).
pub fn id57_range(length: ID57Length) -> Result<(usize, usize), B57Error> {
    let effective = resolve_id57_length(length)?;
    let raw = effective as i32;

    if raw < 0 {
        let k = (-raw) as usize;
        return Ok((k, k));
    }

    let bits = id57_bits_by_length(effective)?;
    let byte_length = bits.div_ceil(8);
    Ok((byte_length, encoded_length(byte_length)))
}

/// 11.5 id57_is_length.
///
/// Defined ONLY for fixed widths (negative `length`). Bit lengths
/// (including DEFAULT, which resolves to one) raise
/// `INVALID_LENGTH_ENUM` - id57_is_length does not validate bit lengths;
/// use `id57_range` + `id57_is_canonical` for those instead.
///
/// For a fixed width it checks exactly two independent conditions: the
/// string is exactly `k` characters, and it is valid B57 (alphabet).
/// It intentionally does NOT decode or check canonical form - a
/// fixed-width output is a prefix of a bignum encoding, not a canonical
/// B57 string.
pub fn id57_is_length(id57_string: &str, length: ID57Length) -> Result<bool, B57Error> {
    let effective = resolve_id57_length(length)?;
    let raw = effective as i32;

    if raw >= 0 {
        return Err(B57Error::invalid_length_enum(raw));
    }

    let k = (-raw) as usize;
    Ok(id57_string.len() == k && id57_is_valid(id57_string))
}

pub fn resolve_id57_length(length: ID57Length) -> Result<ID57Length, B57Error> {
    if length == ID57Length::Default {
        return Ok(ID57Length::Len128);
    }
    if (length as i32) < 0 {
        // Negative values are fixed widths; being a defined enum variant
        // already guarantees the magnitude is one of the defined FIXED_k.
        return Ok(length);
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
        (ID57Length::Len32, 32),
        (ID57Length::Len64, 64),
        (ID57Length::Len128, 128),
        (ID57Length::Len256, 256),
        (ID57Length::Len512, 512),
    ]);

    map.get(&length)
        .copied()
        .ok_or(B57Error::invalid_length_enum(length as i32))
}

#[cfg(test)]
mod tests {
    use super::*;

    const BIT_LENGTHS: [ID57Length; 8] = [
        ID57Length::Len8,
        ID57Length::Len16,
        ID57Length::Len32,
        ID57Length::Len64,
        ID57Length::Len128,
        ID57Length::Len256,
        ID57Length::Len512,
        ID57Length::Default,
    ];

    const FIXED_LENGTHS: [(ID57Length, usize); 11] = [
        (ID57Length::Fixed2, 2),
        (ID57Length::Fixed3, 3),
        (ID57Length::Fixed4, 4),
        (ID57Length::Fixed5, 5),
        (ID57Length::Fixed6, 6),
        (ID57Length::Fixed7, 7),
        (ID57Length::Fixed8, 8),
        (ID57Length::Fixed9, 9),
        (ID57Length::Fixed10, 10),
        (ID57Length::Fixed11, 11),
        (ID57Length::Fixed12, 12),
    ];

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

        let (min_chars, max_chars) = id57_range(ID57Length::Default).unwrap();
        assert_eq!((min_chars, max_chars), (16, 22));
        assert!(d.len() >= min_chars && d.len() <= max_chars);
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

    #[test]
    fn bit_lengths_generate_verify_and_range() {
        for &length in BIT_LENGTHS.iter() {
            let id = id57_generate(b"bit-length-input", length)
                .unwrap_or_else(|e| panic!("generate failed for {:?}: {:?}", length, e));
            assert!(id57_verify(b"bit-length-input", &id, length));
            assert!(id57_is_canonical(&id));

            let (min_chars, max_chars) = id57_range(length)
                .unwrap_or_else(|e| panic!("range failed for {:?}: {:?}", length, e));
            assert!(min_chars <= max_chars);
            assert!(id.len() >= min_chars && id.len() <= max_chars);

            // id57_is_length is not defined for bit lengths (11.5) - it
            // MUST error, never silently return false.
            let err = id57_is_length(&id, length)
                .expect_err("id57_is_length must error for bit-length enums");
            assert_eq!(err.code, crate::errors::ErrorCode::InvalidLengthEnum);
        }
    }

    #[test]
    fn fixed_widths_generate_exactly_k_chars() {
        for &(length, k) in FIXED_LENGTHS.iter() {
            let id = id57_generate(b"fixed-width-input", length)
                .unwrap_or_else(|e| panic!("generate failed for {:?}: {:?}", length, e));
            assert_eq!(id.len(), k);

            let (min_chars, max_chars) = id57_range(length).unwrap();
            assert_eq!((min_chars, max_chars), (k, k));

            assert!(id57_is_length(&id, length).unwrap());
        }
    }

    #[test]
    fn fixed_width_is_cut_prefix_of_len128() {
        let full = id57_generate(b"prefix-invariant-input", ID57Length::Len128).unwrap();

        for &(length, k) in FIXED_LENGTHS.iter() {
            let fixed = id57_generate(b"prefix-invariant-input", length).unwrap();
            assert_eq!(fixed, full[..k]);
        }

        // FIXED_j is a prefix of FIXED_k for j < k, same input.
        let f8 = id57_generate(b"prefix-invariant-input", ID57Length::Fixed8).unwrap();
        let f4 = id57_generate(b"prefix-invariant-input", ID57Length::Fixed4).unwrap();
        assert_eq!(&f8[..4], f4);
    }

    #[test]
    fn id57_is_length_checks_both_conditions_independently() {
        // Wrong length, valid chars -> false.
        assert!(!id57_is_length("AAA", ID57Length::Fixed4).unwrap());

        // Correct length, invalid chars ('0', 'O', 'I', 'l' are excluded
        // from the B57 alphabet) -> false.
        assert!(!id57_is_length("000O", ID57Length::Fixed4).unwrap());

        // A literal string not derived from any real generation, but
        // valid B57 chars and correct length -> true. Proves the
        // function does not try to decode/canonicalize.
        assert!(id57_is_length("AAAA", ID57Length::Fixed4).unwrap());
    }

    #[test]
    fn negative_length_enum_validation() {
        // -9 (FIXED_9) is valid.
        assert!(ID57Length::try_from(-9).is_ok());
        assert!(id57_generate(b"x", ID57Length::Fixed9).is_ok());

        // Out-of-range negatives are rejected.
        for bad in [-13, -1, -20, -100] {
            let err = ID57Length::try_from(bad)
                .expect_err("out-of-range negative length_enum must be rejected");
            assert_eq!(err.code, crate::errors::ErrorCode::InvalidLengthEnum);
        }
    }

    #[test]
    fn id57_is_length_rejects_bit_length_enum_including_default() {
        for &length in BIT_LENGTHS.iter() {
            let err = id57_is_length("AAAA", length)
                .expect_err("id57_is_length must reject bit-length/default enums");
            assert_eq!(err.code, crate::errors::ErrorCode::InvalidLengthEnum);
        }
    }
}
