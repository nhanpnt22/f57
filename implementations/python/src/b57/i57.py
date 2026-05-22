"""I57 integration API."""

import math
import os
from dataclasses import dataclass

import blake3 as blake3_module
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from .b57 import encode, decode, is_valid, is_canonical
from .errors import InvalidInputError
from .h57 import h57_hash, HashFunction, H57Length
from .id57 import id57_generate, ID57Length
from .r57 import r57_generate, R57Mode, r57_is_valid, r57_is_canonical


def i57_encode(input_data: bytes) -> str:
    """Encode bytes to B57."""
    return encode(input_data)


def i57_decode(s: str) -> bytes:
    """Decode B57 string to bytes."""
    return decode(s)


def i57_hash(input_data: bytes, hash_fn: HashFunction, length: H57Length) -> str:
    """Hash input and encode."""
    return h57_hash(input_data, hash_fn, length)


def i57_random(mode: R57Mode) -> str:
    """Generate random B57."""
    return r57_generate(mode)


def i57_id(input_data: bytes, hash_fn: HashFunction, length: ID57Length) -> str:
    """Generate deterministic ID."""
    return id57_generate(input_data, hash_fn, length)


def i57_is_valid(s: str) -> bool:
    """Check if string is valid B57."""
    return s and is_valid(s)


def i57_is_canonical(s: str) -> bool:
    """Check if string is canonical B57."""
    return s and is_canonical(s)


def i57_validate_identifier(s: str) -> bool:
    """Validate as identifier (22 chars, valid, canonical)."""
    return len(s) == 22 and is_valid(s) and is_canonical(s)


def i57_validate_entropy(s: str) -> bool:
    """Validate entropy heuristics."""
    if not i57_validate_identifier(s):
        return False
    
    if not _passes_character_diversity(s):
        return False
    
    if _has_repeated_half_pattern(s):
        return False
    
    return not _is_single_repeated_pattern(s.lower())


def _passes_character_diversity(s: str) -> bool:
    """Check character diversity."""
    unique = len(set(s))
    max_run = _longest_run_length(s)
    return unique >= 4 and max_run <= len(s) // 2


def _longest_run_length(s: str) -> int:
    """Get longest consecutive character run."""
    if not s:
        return 0
    max_run = 1
    current = 1
    for i in range(1, len(s)):
        if s[i] == s[i - 1]:
            current += 1
            max_run = max(max_run, current)
        else:
            current = 1
    return max_run


def _has_repeated_half_pattern(s: str) -> bool:
    """Check for repeated half pattern."""
    if len(s) % 2 != 0:
        return False
    half = len(s) // 2
    return s[:half] == s[half:]


def _is_single_repeated_pattern(s: str) -> bool:
    """Check if single character repeated."""
    if not s:
        return False
    return all(c == s[0] for c in s)


@dataclass(frozen=True)
class I57SecureKeys:
    b57_aes_256_key: bytes
    h57_key: bytes
    id57_key: bytes


def _decode_key_material(value: str) -> bytes:
    """Decode 32-byte key material from hex or utf-8 text."""
    if not value:
        raise InvalidInputError("missing key material")

    try:
        raw = bytes.fromhex(value)
        if len(raw) == 32:
            return raw
    except ValueError:
        pass

    raw = value.encode("utf-8")
    if len(raw) == 32:
        return raw

    raise InvalidInputError("key material must be 32 bytes")


def _resolve_one_key(env_name: str, config_key: str, config: dict) -> bytes | None:
    """Resolve key from config dict then environment."""
    if config_key in config and config[config_key]:
        return _decode_key_material(str(config[config_key]))
    env_val = os.getenv(env_name)
    if env_val:
        return _decode_key_material(env_val)
    return None


def i57_b57_aes_256_encode(plaintext: bytes, key: bytes, aad: bytes = b"", key_id: int = 1) -> str:
    """AES-256-GCM envelope encoder used by internal secure helpers."""
    if not 0 <= key_id <= 255:
        raise InvalidInputError("key_id must be between 0 and 255")
    if len(key) != 32:
        raise InvalidInputError("key must be 32 bytes")

    nonce = os.urandom(12)
    aesgcm = AESGCM(key)
    ciphertext_with_tag = aesgcm.encrypt(nonce, plaintext, aad)
    envelope = bytes([1, key_id]) + nonce + ciphertext_with_tag
    return encode(envelope)


def i57_b57_aes_256_decode(encoded: str, key: bytes, aad: bytes = b"", expected_key_id: int | None = None) -> bytes:
    """AES-256-GCM envelope decoder used by internal secure helpers."""
    if len(key) != 32:
        raise InvalidInputError("key must be 32 bytes")

    envelope = decode(encoded)
    if len(envelope) < 30:
        raise InvalidInputError("invalid envelope length")

    if envelope[0] != 1:
        raise InvalidInputError("invalid envelope version")

    key_id = envelope[1]
    if expected_key_id is not None and key_id != (expected_key_id & 0xFF):
        raise InvalidInputError("unexpected key_id")

    nonce = envelope[2:14]
    ciphertext_with_tag = envelope[14:]
    aesgcm = AESGCM(key)
    return aesgcm.decrypt(nonce, ciphertext_with_tag, aad)


def i57_hash_secure(input_data: bytes, length: H57Length, keys: I57SecureKeys) -> str:
    """Secure keyed hash helper for internal coverage paths."""
    if length == H57Length.HASH_AUTO:
        bits = 256
    elif length == H57Length.LEN128:
        bits = 128
    elif length == H57Length.LEN256:
        bits = 256
    elif length == H57Length.LEN512:
        bits = 512
    else:
        raise InvalidInputError("unsupported secure hash length")

    requested = (bits + 7) // 8
    h = blake3_module.blake3(key=keys.h57_key)
    h.update(input_data)
    raw = bytearray(h.digest(length=requested))
    excess = len(raw) * 8 - bits
    if excess > 0:
        raw[-1] &= ((0xFF << excess) & 0xFF)
    return encode(bytes(raw))
