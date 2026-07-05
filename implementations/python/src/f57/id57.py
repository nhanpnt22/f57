"""ID57 deterministic ID generation."""

import math
from enum import Enum
from .errors import InvalidLengthEnumError, EntropyExceededError
from .h57 import HashFunction, _compute_hash, _compute_hash_blake3_xof
from .b57 import encode, is_valid, is_canonical, encoded_length


class ID57Length(Enum):
    """ID57 length enumerations.

    Positive values (and DEFAULT/0) select BIT-LENGTH mode (spec 7.1):
    character width is a [min_chars, max_chars] bound, not a fixed count.

    Negative values select FIXED-WIDTH mode (spec 7.2): the magnitude is
    the exact character count, produced by cutting the LEN128 output to
    the first k characters (spec 5.2).
    """
    DEFAULT = 0
    LEN8 = 8
    LEN16 = 16
    LEN32 = 32
    LEN64 = 64
    LEN128 = 128
    LEN256 = 256
    LEN512 = 512

    FIXED_2 = -2
    FIXED_3 = -3
    FIXED_4 = -4
    FIXED_5 = -5
    FIXED_6 = -6
    FIXED_7 = -7
    FIXED_8 = -8
    FIXED_9 = -9
    FIXED_10 = -10
    FIXED_11 = -11
    FIXED_12 = -12


_BITS_BY_LENGTH = {
    ID57Length.LEN8: 8,
    ID57Length.LEN16: 16,
    ID57Length.LEN32: 32,
    ID57Length.LEN64: 64,
    ID57Length.LEN128: 128,
    ID57Length.LEN256: 256,
    ID57Length.LEN512: 512,
}

_FIXED_MAGNITUDES = {2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12}


def id57_generate(input_data: bytes, hash_fn: HashFunction, length: ID57Length) -> str:
    """Generate deterministic ID.

    The sign of `length` selects the mode:
    - positive (or DEFAULT): bit-length mode, unchanged bounded-width pipeline.
    - negative (FIXED_k): fixed-width mode - generate the LEN128 identifier
      and cut it to the first k characters (spec 5.2).
    """
    effective = _resolve_length(length)

    if _is_fixed(effective):
        k = -_length_value(effective)
        full = id57_generate(input_data, hash_fn, ID57Length.LEN128)
        return full[:k]

    bits = _bits_by_length(effective)
    requested = (bits + 7) // 8

    hash_fn_effective = hash_fn if hash_fn else HashFunction.BLAKE3

    if hash_fn_effective == HashFunction.BLAKE3:
        hash_bytes = _compute_hash_blake3_xof(input_data, requested)
    else:
        hash_bytes = _compute_hash(input_data, hash_fn_effective)
        if requested > len(hash_bytes):
            raise EntropyExceededError(requested, len(hash_bytes))

    effective_bytes = bytearray(hash_bytes[:requested])
    _mask_excess_bits(effective_bytes, bits)
    return encode(bytes(effective_bytes))


def id57_generate_default(input_data: bytes) -> str:
    """Generate ID with default settings (128-bit BLAKE3)."""
    return id57_generate(input_data, HashFunction.BLAKE3, ID57Length.DEFAULT)


def id57_verify(input_data: bytes, hash_fn: HashFunction, id57_string: str, length: ID57Length) -> bool:
    """Verify ID matches input."""
    try:
        return id57_generate(input_data, hash_fn, length) == id57_string
    except Exception:
        return False


def id57_verify_default(input_data: bytes, id57_string: str) -> bool:
    """Verify ID with default settings."""
    return id57_verify(input_data, HashFunction.BLAKE3, id57_string, ID57Length.DEFAULT)


def id57_is_valid(s: str) -> bool:
    """Check if string is valid B57."""
    return is_valid(s)


def id57_is_canonical(s: str) -> bool:
    """Check if string is canonical B57."""
    return is_canonical(s)


def id57_range(length: ID57Length = ID57Length.DEFAULT) -> tuple:
    """Return (min_chars, max_chars) for a length_enum (spec 11.4).

    Fixed widths (negative length_enum) return (k, k). Bit lengths
    (positive length_enum, or DEFAULT) return the [min_chars, max_chars]
    bound derived from the truncated byte length.
    """
    effective = _resolve_length(length)

    if _is_fixed(effective):
        k = -_length_value(effective)
        return (k, k)

    bits = _bits_by_length(effective)
    byte_length = (bits + 7) // 8
    return (byte_length, encoded_length(byte_length))


def id57_is_length(id57_string: str, length: ID57Length) -> bool:
    """Check whether id57_string is a valid FIXED-width identifier (spec 11.5).

    Defined ONLY for fixed widths (negative length_enum). Raises
    InvalidLengthEnumError for any non-negative length_enum - bit lengths
    are validated via id57_range + id57_is_canonical instead.

    This does NOT decode or check canonical form: fixed-width outputs are
    prefixes of a bignum encoding, not canonical B57 strings.
    """
    effective = _resolve_length(length)

    if not _is_fixed(effective):
        raise InvalidLengthEnumError(_length_value(length))

    k = -_length_value(effective)
    return len(id57_string) == k and id57_is_valid(id57_string)


def _resolve_length(length: ID57Length) -> ID57Length:
    """Resolve effective length."""
    if length == ID57Length.DEFAULT:
        return ID57Length.LEN128
    if _is_fixed_raw(length):
        return length
    _bits_by_length(length)  # Validate
    return length


def _length_value(length: ID57Length) -> int:
    """Get the raw int value backing an ID57Length (or ad-hoc invalid value)."""
    return length.value if isinstance(length, ID57Length) else length


def _is_fixed_raw(length: ID57Length) -> bool:
    """Whether a length_enum's raw value is a valid negative FIXED_k."""
    value = _length_value(length)
    return value < 0 and (-value) in _FIXED_MAGNITUDES


def _is_fixed(length: ID57Length) -> bool:
    """Whether an already-resolved length_enum is fixed-width."""
    return _length_value(length) < 0


def _bits_by_length(length: ID57Length) -> int:
    """Get bit length for enum."""
    if length not in _BITS_BY_LENGTH:
        raise InvalidLengthEnumError(_length_value(length))
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
