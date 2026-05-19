"""B57 error definitions."""


class B57Error(Exception):
    """Base exception for B57 errors."""

    def __init__(self, code: str, message: str, index: int = None):
        self.code = code
        self.message = message
        self.index = index
        if index is not None:
            super().__init__(f"b57: {message} at position {index}")
        else:
            super().__init__(f"b57: {message}")


class InvalidCharError(B57Error):
    """Character not in B57 alphabet."""

    def __init__(self, index: int, char_code: int):
        super().__init__(
            "INVALID_CHAR",
            f"invalid character {chr(char_code)}",
            index
        )


class NonCanonicalError(B57Error):
    """Encoding is not canonical."""

    def __init__(self):
        super().__init__("NON_CANONICAL", "non-canonical encoding")


class InvalidLengthEnumError(B57Error):
    """Invalid length enum value."""

    def __init__(self, length: int):
        super().__init__("INVALID_LENGTH_ENUM", f"invalid length enum {length}")


class EntropyExceededError(B57Error):
    """Requested entropy exceeds available."""

    def __init__(self, requested: int, available: int):
        super().__init__(
            "ENTROPY_EXCEEDED",
            f"requested entropy exceeds hash output ({requested} bytes requested, {available} available)"
        )


class InvalidHashFunctionError(B57Error):
    """Invalid hash function."""

    def __init__(self, hash_fn: str):
        super().__init__("INVALID_HASH_FUNCTION", f'invalid hash function "{hash_fn}"')


class InsufficientEntropyError(B57Error):
    """Insufficient entropy generated."""

    def __init__(self):
        super().__init__("INSUFFICIENT_ENTROPY", "insufficient entropy generated")


class InvalidModeError(B57Error):
    """Invalid random mode."""

    def __init__(self, mode: int):
        super().__init__("INVALID_MODE", f"invalid random generation mode {mode}")


class InvalidInputError(B57Error):
    """Invalid input."""

    def __init__(self, msg: str):
        super().__init__("INVALID_INPUT", f"invalid input: {msg}")
