"""R57 random generation."""

import os
import secrets
from enum import Enum
from hashlib import sha256
from .b57 import encode


class R57Mode(Enum):
    """R57 generation modes."""
    CSPRNG = 1
    HASH_ENTROPY = 2
    KDF_DERIVED = 3
    COUNTER_KDF = 4
    TIMESTAMP_KDF = 5
    HARDWARE_RNG = 6
    UUID_V4_COMPAT = 7
    HYBRID_ENTROPY = 8


def r57_generate(mode: R57Mode) -> str:
    """Generate random 128-bit B57 identifier."""
    raw = _generate_entropy(mode)
    return _encode_r57_128(raw)


def r57_is_valid(s: str) -> bool:
    """Check if string is valid R57 (22 chars)."""
    return len(s) == 22 and _is_valid_b57(s)


def r57_is_canonical(s: str) -> bool:
    """Check if string is canonical R57."""
    return len(s) == 22 and _is_canonical_b57(s)


def _generate_entropy(mode: R57Mode) -> bytes:
    """Generate entropy based on mode."""
    if mode == R57Mode.CSPRNG or mode == R57Mode.HARDWARE_RNG:
        return secrets.token_bytes(16)
    
    elif mode == R57Mode.HASH_ENTROPY:
        seed = secrets.token_bytes(16)
        return _mix_entropy([seed])
    
    elif mode == R57Mode.KDF_DERIVED:
        context = secrets.token_bytes(16)
        return _mix_entropy([context])
    
    elif mode == R57Mode.COUNTER_KDF:
        random = secrets.token_bytes(12)
        return _mix_entropy([random])
    
    elif mode == R57Mode.TIMESTAMP_KDF:
        random = secrets.token_bytes(12)
        return _mix_entropy([random])
    
    elif mode == R57Mode.UUID_V4_COMPAT:
        raw = bytearray(secrets.token_bytes(16))
        raw[6] = (raw[6] & 0x0F) | 0x40
        raw[8] = (raw[8] & 0x3F) | 0x80
        return bytes(raw)
    
    elif mode == R57Mode.HYBRID_ENTROPY:
        seed = secrets.token_bytes(16)
        return _mix_entropy([seed])
    
    else:
        raise ValueError(f"Unknown R57 mode: {mode}")


def _mix_entropy(*parts) -> bytes:
    """Mix entropy parts."""
    data = b""
    for part_list in parts:
        for part in part_list:
            data += part
    return sha256(data).digest()[:16]


def _encode_r57_128(raw: bytes) -> str:
    """Encode 16 bytes to 22-character B57."""
    encoded = encode(raw)
    
    if len(encoded) == 22:
        return encoded
    
    # Derive additional bytes if needed
    derived = raw
    while len(encoded) < 22:
        derived = _mix_entropy([derived, b'\x57'])
        encoded = encode(derived)
    
    return encoded


def _is_valid_b57(s: str) -> bool:
    """Check if string is valid B57."""
    from .b57 import is_valid
    return is_valid(s)


def _is_canonical_b57(s: str) -> bool:
    """Check if string is canonical B57."""
    from .b57 import is_canonical
    return is_canonical(s)
