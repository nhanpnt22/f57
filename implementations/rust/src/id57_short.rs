use crate::errors::B57Error;
use crate::h57::HashFunction;
use crate::id57::{
    id57_generate, id57_is_canonical, id57_is_valid, ID57Length,
};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(i32)]
pub enum ID57ShortLength {
    Default = 0,
    Len23 = 23,
    Len29 = 29,
    Len32 = 32,
    Len47 = 47,
    Len70 = 70,
}

pub fn id57_short_generate(
    input: &[u8],
    hash_fn: Option<HashFunction>,
    length: ID57ShortLength,
) -> Result<String, B57Error> {
    let effective = resolve_id57_short_length(length)?;
    id57_generate(input, hash_fn, effective)
}

pub fn id57_short_generate_default(input: &[u8]) -> Result<String, B57Error> {
    id57_short_generate(input, Some(HashFunction::Blake3), ID57ShortLength::Default)
}

pub fn id57_short_verify(
    input: &[u8],
    hash_fn: Option<HashFunction>,
    id57_string: &str,
    length: ID57ShortLength,
) -> bool {
    id57_short_generate(input, hash_fn, length)
        .map(|expected| expected == id57_string)
        .unwrap_or(false)
}

pub fn id57_short_verify_default(input: &[u8], id57_string: &str) -> bool {
    id57_short_verify(
        input,
        Some(HashFunction::Blake3),
        id57_string,
        ID57ShortLength::Default,
    )
}

pub fn id57_short_is_valid(id57_string: &str) -> bool {
    id57_is_valid(id57_string)
}

pub fn id57_short_is_canonical(id57_string: &str) -> bool {
    id57_is_canonical(id57_string)
}

pub fn resolve_id57_short_length(length: ID57ShortLength) -> Result<ID57Length, B57Error> {
    match length {
        ID57ShortLength::Default => Ok(ID57Length::Len47),
        ID57ShortLength::Len23 => Ok(ID57Length::Len23),
        ID57ShortLength::Len29 => Ok(ID57Length::Len29),
        ID57ShortLength::Len32 => Ok(ID57Length::Len32),
        ID57ShortLength::Len47 => Ok(ID57Length::Len47),
        ID57ShortLength::Len70 => Ok(ID57Length::Len70),
    }
}
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_and_verify() {
        let s = id57_short_generate_default(b"abc").unwrap();
        assert!(id57_short_verify_default(b"abc", &s));
    }

    #[test]
    fn invalid_len_rejected_by_surface() {
        let s = id57_short_generate(b"abc", Some(HashFunction::Blake3), ID57ShortLength::Len23).unwrap();
        assert!(id57_short_is_valid(&s));
        assert!(id57_short_is_canonical(&s));
    }
}
