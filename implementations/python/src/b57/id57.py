"""ID57 deterministic ID generation."""

from enum import Enum
from hashlib import sha256
from .errors import InvalidLengthEnumError, EntropyExceededError
from .h57 import HashFunction
from .b57 import encode


class ID57Length(Enum):
    """ID57 length enumerations."""
    DEFAULT = 0
    LEN8 = 8
    LEN16 = 16
    LEN23 = 23
    LEN29 = 29
    LEN32 = 32
    LEN47 = 47
    LEN64 = 64
    LEN70 = 70
    LEN93 = 93
    LEN128 = 128
    LEN186 = 186
    LEN256 = 256
    LEN373 = 373
    LEN512 = 512


_BITS_BY_LENGTH = {
    ID57Length.LEN8: 8,
    ID57Length.LEN16: 16,
    ID57Length.LEN23: 23,
    ID57Length.LEN29: 29,
    ID57Length.LEN32: 32,
    ID57Length.LEN47: 47,
    ID57Length.LEN64: 64,
    ID57Length.LEN70: 70,
    ID57Length.LEN93: 93,
    ID57Length.LEN128: 128,
    ID57Length.LEN186: 186,
    ID57Length.LEN256: 256,
    ID57Length.LEN373: 373,
    ID57Length.LEN512: 512,
}


def id57_generate(input_data: bytes, hash_fn: HashFunction, length: ID57Length) -> str:
    """Generate deterministic ID."""
    effective = _resolve_length(length)
    bits = _bits_by_length(effective)
    requested = (bits + 7) // 8
    
    hash_bytes = sha256(input_data).digest()
    if requested > len(hash_bytes):
        raise EntropyExceededError(requested, len(hash_bytes))
    
    effective_bytes = bytearray(hash_bytes[:requested])
    _mask_excess_bits(effective_bytes, bits)
    return encode(bytes(effective_bytes))


def id57_generate_default(input_data: bytes) -> str:
    """Generate ID with default settings (128-bit SHA256)."""
    return id57_generate(input_data, HashFunction.SHA256, ID57Length.DEFAULT)


def id57_verify(input_data: bytes, hash_fn: HashFunction, id57_string: str, length: ID57Length) -> bool:
    """Verify ID matches input."""
    try:
        return id57_generate(input_data, hash_fn, length) == id57_string
    except Exception:
        return False


def id57_verify_default(input_data: bytes, id57_string: str) -> bool:
    """Verify ID with default settings."""
    return id57_verify(input_data, HashFunction.SHA256, id57_string, ID57Length.DEFAULT)


def id57_is_valid(s: str) -> bool:
    """Check if string is valid B57."""
    from .b57 import is_valid
    return is_valid(s)


def id57_is_canonical(s: str) -> bool:
    """Check if string is canonical B57."""
    from .b57 import is_canonical
    return is_canonical(s)


def _resolve_length(length: ID57Length) -> ID57Length:
    """Resolve effective length."""
    if length == ID57Length.DEFAULT:
        return ID57Length.LEN128
    _bits_by_length(length)  # Validate
    return length


def _bits_by_length(length: ID57Length) -> int:
    """Get bit length for enum."""
    if length not in _BITS_BY_LENGTH:
        raise InvalidLengthEnumError(length.value)
    return _BITS_BY_LENGTH[length]


def _mask_excess_bits(data: bytearray, bit_length: int) -> None:
    """Mask excess bits in last byte."""
    if not data or bit_length <= 0:
        return
    
    excess = len(data) * 8 - bit_length
    if excess <= 0:
        return
    
    mask = 0xFF << excess
    data[-1] &= mask
