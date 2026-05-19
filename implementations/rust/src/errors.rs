use std::fmt::{Display, Formatter};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ErrorCode {
    InvalidChar,
    NonCanonical,
    InvalidLengthEnum,
    EntropyExceeded,
    InvalidHashFunction,
    InsufficientEntropy,
    InvalidMode,
    InvalidInput,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct B57Error {
    pub code: ErrorCode,
    pub message: String,
    pub index: Option<usize>,
}

impl B57Error {
    pub fn invalid_char(index: usize, ch: u8) -> Self {
        Self {
            code: ErrorCode::InvalidChar,
            message: format!("invalid character {:?}", ch as char),
            index: Some(index),
        }
    }

    pub fn non_canonical() -> Self {
        Self {
            code: ErrorCode::NonCanonical,
            message: "non-canonical encoding".to_string(),
            index: None,
        }
    }

    pub fn invalid_length_enum(length: i32) -> Self {
        Self {
            code: ErrorCode::InvalidLengthEnum,
            message: format!("invalid length enum {}", length),
            index: None,
        }
    }

    pub fn entropy_exceeded(requested_bytes: usize, available_bytes: usize) -> Self {
        Self {
            code: ErrorCode::EntropyExceeded,
            message: format!(
                "requested entropy exceeds hash output ({} bytes requested, {} available)",
                requested_bytes, available_bytes
            ),
            index: None,
        }
    }

    pub fn invalid_hash_function(hash_fn: &str) -> Self {
        Self {
            code: ErrorCode::InvalidHashFunction,
            message: format!("invalid hash function \"{}\"", hash_fn),
            index: None,
        }
    }

    pub fn insufficient_entropy() -> Self {
        Self {
            code: ErrorCode::InsufficientEntropy,
            message: "insufficient entropy generated".to_string(),
            index: None,
        }
    }

    pub fn invalid_mode(mode: i32) -> Self {
        Self {
            code: ErrorCode::InvalidMode,
            message: format!("invalid random generation mode {}", mode),
            index: None,
        }
    }

    pub fn invalid_input(msg: &str) -> Self {
        Self {
            code: ErrorCode::InvalidInput,
            message: format!("invalid input: {}", msg),
            index: None,
        }
    }
}

impl Display for B57Error {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        if let Some(index) = self.index {
            write!(f, "b57: {} at position {}", self.message, index)
        } else {
            write!(f, "b57: {}", self.message)
        }
    }
}

impl std::error::Error for B57Error {}
