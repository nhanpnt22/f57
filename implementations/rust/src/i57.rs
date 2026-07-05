use crate::b57::{decode, encode, is_canonical, is_valid};
use crate::errors::B57Error;
use crate::h57::{h57_hash, H57Length};
use crate::id57::{
    id57_bits_by_length, id57_generate, id57_is_length, id57_range, resolve_id57_length,
    ID57Length,
};
use crate::r57::{r57_generate, R57Mode};

pub fn i57_encode(input: &[u8]) -> String {
    encode(input)
}

pub fn i57_decode(input: &str) -> Result<Vec<u8>, B57Error> {
    decode(input)
}

pub fn i57_hash(input: &[u8], length: H57Length) -> Result<String, B57Error> {
    h57_hash(input, length)
}

pub fn i57_random(mode: R57Mode) -> Result<String, B57Error> {
    r57_generate(mode)
}

pub fn i57_id(
    input: &[u8],
    length: ID57Length,
) -> Result<String, B57Error> {
    id57_generate(input, length)
}

pub fn i57_is_valid(input: &str) -> bool {
    !input.is_empty() && is_valid(input)
}

pub fn i57_is_canonical(input: &str) -> bool {
    !input.is_empty() && is_canonical(input)
}

/// 5.3 i57_validate_identifier.
///
/// The SIGN of `length` selects the check, mirroring ID57 Core API
/// 7.3/11.4/11.5:
///
/// - FIXED width (`length` < 0, after resolving DEFAULT/bit lengths
///   through `resolve_id57_length`): delegates entirely to
///   `id57_is_length` (valid B57 + exact length == k). MUST NOT decode
///   or check canonical form - a fixed-width output is a bignum prefix,
///   not canonical B57.
/// - BIT length (`length` >= 0): `id57_is_length` does not apply, so the
///   bound + canonical + decoded byte-length + excess-bit-mask check is
///   implemented directly here.
pub fn i57_validate_identifier(input: &str, length: ID57Length) -> bool {
    let effective = match resolve_id57_length(length) {
        Ok(v) => v,
        Err(_) => return false,
    };

    if (effective as i32) < 0 {
        return id57_is_length(input, effective).unwrap_or(false);
    }

    let (min_chars, max_chars) = match id57_range(effective) {
        Ok(v) => v,
        Err(_) => return false,
    };
    let len = input.len();
    if len < min_chars || len > max_chars {
        return false;
    }
    if !is_canonical(input) {
        return false;
    }

    let decoded = match decode(input) {
        Ok(d) => d,
        Err(_) => return false,
    };
    let bits = match id57_bits_by_length(effective) {
        Ok(b) => b,
        Err(_) => return false,
    };
    let byte_length = bits.div_ceil(8);
    if decoded.len() != byte_length {
        return false;
    }

    let excess_bits = byte_length * 8 - bits;
    if excess_bits > 0 {
        let last_byte = decoded[byte_length - 1];
        let mask = (1u8 << excess_bits) - 1;
        if last_byte & mask != 0 {
            return false;
        }
    }

    true
}

/// Convenience wrapper: `i57_validate_identifier` with `length` defaulted
/// to `ID57Length::Default` (which resolves to `Len128`), matching the
/// unparameterized behavior callers relied on before length_enum support
/// was added.
pub fn i57_validate_identifier_default(input: &str) -> bool {
    i57_validate_identifier(input, ID57Length::Default)
}

pub fn i57_validate_entropy(input: &str) -> bool {
    if !i57_validate_identifier_default(input) {
        return false;
    }
    if !passes_character_diversity(input) {
        return false;
    }
    if has_repeated_half_pattern(input) {
        return false;
    }
    !is_single_repeated_pattern(&input.to_ascii_lowercase())
}

fn passes_character_diversity(input: &str) -> bool {
    let mut unique = std::collections::HashSet::new();
    for ch in input.chars() {
        unique.insert(ch);
    }

    let max_run = longest_run_length(input);
    unique.len() >= 4 && max_run <= input.len() / 2
}

fn longest_run_length(input: &str) -> usize {
    if input.is_empty() {
        return 0;
    }
    let bytes = input.as_bytes();
    let mut max_run = 1usize;
    let mut current = 1usize;

    for i in 1..bytes.len() {
        if bytes[i] == bytes[i - 1] {
            current += 1;
            if current > max_run {
                max_run = current;
            }
        } else {
            current = 1;
        }
    }
    max_run
}

fn has_repeated_half_pattern(input: &str) -> bool {
    if input.len() % 2 != 0 {
        return false;
    }
    let half = input.len() / 2;
    input[..half] == input[half..]
}

fn is_single_repeated_pattern(input: &str) -> bool {
    if input.is_empty() {
        return false;
    }
    input.chars().all(|c| c == input.chars().next().unwrap())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn encode_decode() {
        let input = b"hello world";
        let enc = i57_encode(input);
        let dec = i57_decode(&enc).unwrap();
        assert_eq!(dec, input);
    }

    #[test]
    fn hash_and_id() {
        let h = i57_hash(b"x", H57Length::Len128).unwrap();
        assert!(!h.is_empty());

        let id = i57_id(b"x", ID57Length::Len128).unwrap();
        assert!(!id.is_empty());
    }

    #[test]
    fn validation() {
        let encoded = i57_encode(b"hello");
        assert!(i57_is_valid(&encoded));
        assert!(i57_is_canonical(&encoded));
        assert!(!i57_is_valid(""));
        assert!(!i57_is_canonical(""));
    }

    #[test]
    fn entropy_heuristics() {
        let id = i57_random(R57Mode::Csprng).unwrap();
        assert!(i57_validate_identifier_default(&id));
        assert!(i57_validate_entropy(&id));
        assert!(!i57_validate_entropy("AAAAAAAAAAAAAAAAAAAAAA"));
        assert!(!i57_validate_entropy("ABABABABABABABABABABAB"));
    }

    #[test]
    fn validate_identifier_bit_length_branch() {
        let id = id57_generate(b"i57-bit-length", ID57Length::Len128).unwrap();
        assert!(i57_validate_identifier(&id, ID57Length::Len128));
        assert!(i57_validate_identifier(&id, ID57Length::Default));

        // Corrupted string: below the Len128 min_chars bound (16) ->
        // rejected regardless of content.
        assert!(!i57_validate_identifier("BBBBBBBBBB", ID57Length::Len128));

        // Corrupted string: above the Len128 max_chars bound (22) ->
        // rejected regardless of content.
        let too_long = "B".repeat(30);
        assert!(!i57_validate_identifier(&too_long, ID57Length::Len128));

        // Corrupted string: an invalid (non-B57-alphabet) character
        // breaks canonical validation -> rejected.
        let mut corrupted = id.clone().into_bytes();
        corrupted[0] = b'0'; // '0' is excluded from the B57 alphabet
        let corrupted = String::from_utf8(corrupted).unwrap();
        assert!(!i57_validate_identifier(&corrupted, ID57Length::Len128));

        // Wrong bit length for this id: a Len128 id (16-22 chars) is
        // outside Len64's [8, 11] char bound.
        assert!(!i57_validate_identifier(&id, ID57Length::Len64));
    }

    #[test]
    fn validate_identifier_fixed_width_branch() {
        let id = id57_generate(b"i57-fixed-width", ID57Length::Fixed8).unwrap();
        assert_eq!(id.len(), 8);
        assert!(i57_validate_identifier(&id, ID57Length::Fixed8));

        // Corrupted (truncated) string: wrong length -> rejected.
        let truncated = &id[..id.len() - 1];
        assert!(!i57_validate_identifier(truncated, ID57Length::Fixed8));

        // A literal string, not derived from real generation, is still
        // accepted if it is valid B57 and exactly k chars - proving the
        // fixed branch does not decode/canonicalize.
        assert!(i57_validate_identifier("AAAA", ID57Length::Fixed4));
    }
}
