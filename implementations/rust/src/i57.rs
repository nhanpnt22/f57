use crate::b57::{decode, encode, is_canonical, is_valid};
use crate::errors::B57Error;
use crate::h57::{h57_hash, HashFunction, H57Length};
use crate::id57::{id57_generate, ID57Length};
use crate::r57::{r57_generate, R57Mode};

pub fn i57_encode(input: &[u8]) -> String {
    encode(input)
}

pub fn i57_decode(input: &str) -> Result<Vec<u8>, B57Error> {
    decode(input)
}

pub fn i57_hash(input: &[u8], hash_fn: HashFunction, length: H57Length) -> Result<String, B57Error> {
    h57_hash(input, hash_fn, length)
}

pub fn i57_random(mode: R57Mode) -> Result<String, B57Error> {
    r57_generate(mode)
}

pub fn i57_id(
    input: &[u8],
    hash_fn: Option<HashFunction>,
    length: ID57Length,
) -> Result<String, B57Error> {
    id57_generate(input, hash_fn, length)
}

pub fn i57_is_valid(input: &str) -> bool {
    !input.is_empty() && is_valid(input)
}

pub fn i57_is_canonical(input: &str) -> bool {
    !input.is_empty() && is_canonical(input)
}

pub fn i57_validate_identifier(input: &str) -> bool {
    input.len() == 22 && i57_is_valid(input) && i57_is_canonical(input)
}

pub fn i57_validate_entropy(input: &str) -> bool {
    if !i57_validate_identifier(input) {
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
        let h = i57_hash(b"x", HashFunction::Sha256, H57Length::Len128).unwrap();
        assert!(!h.is_empty());

        let id = i57_id(b"x", Some(HashFunction::Sha256), ID57Length::Len128).unwrap();
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
        assert!(i57_validate_identifier(&id));
        assert!(i57_validate_entropy(&id));
        assert!(!i57_validate_entropy("AAAAAAAAAAAAAAAAAAAAAA"));
        assert!(!i57_validate_entropy("ABABABABABABABABABABAB"));
    }
}
