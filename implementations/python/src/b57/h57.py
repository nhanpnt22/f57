"""H57 hash-to-text implementation."""

from enum import Enum
from hashlib import sha256, sha512
import blake3 as blake3_module
from .errors import InvalidLengthEnumError, EntropyExceededError
from .b57 import encode


class HashFunction(Enum):
    """Hash function selector."""
    BLAKE3 = "blake3"
    SHA256 = "sha256"
    SHA512 = "sha512"


class H57Length(Enum):
    """H57 length enumerations."""
    HASH_AUTO = -1
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
    HASH256 = 10256
    HASH512 = 10512


_BITS_BY_LENGTH = {
    H57Length.LEN8: 8,
    H57Length.LEN16: 16,
    H57Length.LEN23: 23,
    H57Length.LEN29: 29,
    H57Length.LEN32: 32,
    H57Length.LEN47: 47,
    H57Length.LEN64: 64,
    H57Length.LEN70: 70,
    H57Length.LEN93: 93,
    H57Length.LEN128: 128,
    H57Length.LEN186: 186,
    H57Length.LEN256: 256,
    H57Length.LEN373: 373,
    H57Length.LEN512: 512,
}


def h57_hash(input_data: bytes, hash_fn: HashFunction, length: H57Length) -> str:
    """Hash input and encode as B57."""
    hash_fn_effective = hash_fn if hash_fn else HashFunction.BLAKE3
    
    if hash_fn_effective == HashFunction.BLAKE3:
        if length == H57Length.HASH_AUTO:
            hash_bytes = _compute_hash(input_data, hash_fn_effective)
            return encode(hash_bytes)
        
        effective = _resolve_effective_length(length, hash_fn_effective)
        bits = _bits_by_length(effective)
        requested = (bits + 7) // 8
        hash_bytes = _compute_hash_blake3_xof(input_data, requested)
        return encode(hash_bytes)

    hash_bytes = _compute_hash(input_data, hash_fn_effective)
    selected = _select_effective_bytes(hash_bytes, length, hash_fn_effective)
    return encode(selected)

def h57_verify(input_data: bytes, h57_string: str, hash_fn: HashFunction, length: H57Length) -> bool:
    """Verify H57 string matches input."""
    try:
        return h57_hash(input_data, hash_fn, length) == h57_string
    except Exception:
        return False


def h57_is_valid(s: str) -> bool:
    """Check if string is valid B57."""
    return not s or all(ord(c) in range(256) for c in s)


def h57_is_canonical(s: str) -> bool:
    """Check if string is canonical B57."""
    from .b57 import is_canonical
    return is_canonical(s)


def _compute_hash(input_data: bytes, hash_fn: HashFunction) -> bytes:
    """Compute hash of input."""
    if hash_fn == HashFunction.SHA256:
        return sha256(input_data).digest()
    elif hash_fn == HashFunction.SHA512:
        return sha512(input_data).digest()
    elif hash_fn == HashFunction.BLAKE3:
        return blake3_module.blake3(input_data).digest()
    else:
        raise ValueError(f"Unknown hash function: {hash_fn}")

def _compute_hash_blake3_xof(input_data: bytes, requested_bytes: int) -> bytes:
    if requested_bytes <= 0:
        return b""
    return blake3_module.blake3(input_data).digest(length=requested_bytes)


def _select_effective_bytes(hash_bytes: bytes, length: H57Length, hash_fn: HashFunction) -> bytes:
    """Select effective bytes from hash."""
    effective = _resolve_effective_length(length, hash_fn)
    bits = _bits_by_length(effective)
    requested = (bits + 7) // 8
    
    if requested > len(hash_bytes):
        raise EntropyExceededError(requested, len(hash_bytes))
    
    return hash_bytes[:requested]


def _resolve_effective_length(length: H57Length, hash_fn: HashFunction) -> H57Length:
    """Resolve effective length."""
    if length == H57Length.HASH_AUTO:
        return H57Length.LEN512 if hash_fn == HashFunction.SHA512 else H57Length.LEN256
    elif length == H57Length.HASH256:
        return H57Length.LEN256
    elif length == H57Length.HASH512:
        return H57Length.LEN512
    else:
        return length


def _bits_by_length(length: H57Length) -> int:
    """Get bit length for enum."""
    if length not in _BITS_BY_LENGTH:
        raise InvalidLengthEnumError(length.value)
    return _BITS_BY_LENGTH[length]
