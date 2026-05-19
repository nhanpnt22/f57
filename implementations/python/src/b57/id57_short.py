"""ID57-SHORT constrained ID profiles."""

from enum import Enum
from .id57 import ID57Length, id57_generate, id57_verify
from .h57 import HashFunction


class ID57ShortLength(Enum):
    """ID57-SHORT length enumerations."""
    DEFAULT = 0
    LEN23 = 23
    LEN29 = 29
    LEN32 = 32
    LEN47 = 47
    LEN70 = 70


def id57_short_generate(input_data: bytes, hash_fn: HashFunction, length: "ID57ShortLength") -> str:
    """Generate short constrained ID."""
    effective = _resolve_short_length(length)
    return id57_generate(input_data, hash_fn, effective)


def id57_short_generate_default(input_data: bytes) -> str:
    """Generate short ID with default settings."""
    return id57_short_generate(input_data, HashFunction.SHA256, ID57ShortLength.DEFAULT)


def id57_short_verify(input_data: bytes, hash_fn: HashFunction, id57_string: str, length: "ID57ShortLength") -> bool:
    """Verify short ID."""
    try:
        return id57_short_generate(input_data, hash_fn, length) == id57_string
    except Exception:
        return False


def id57_short_verify_default(input_data: bytes, id57_string: str) -> bool:
    """Verify short ID with default settings."""
    return id57_short_verify(input_data, HashFunction.SHA256, id57_string, ID57ShortLength.DEFAULT)


def id57_short_is_valid(s: str) -> bool:
    """Check if string is valid B57."""
    from .b57 import is_valid
    return is_valid(s)


def id57_short_is_canonical(s: str) -> bool:
    """Check if string is canonical B57."""
    from .b57 import is_canonical
    return is_canonical(s)


def _resolve_short_length(length: "ID57ShortLength") -> ID57Length:
    """Map short length to ID57 length."""
    mapping = {
        ID57ShortLength.DEFAULT: ID57Length.LEN47,
        ID57ShortLength.LEN23: ID57Length.LEN23,
        ID57ShortLength.LEN29: ID57Length.LEN29,
        ID57ShortLength.LEN32: ID57Length.LEN32,
        ID57ShortLength.LEN47: ID57Length.LEN47,
        ID57ShortLength.LEN70: ID57Length.LEN70,
    }
    return mapping[length]
