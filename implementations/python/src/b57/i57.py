"""I57 integration API."""

import math
from .b57 import encode, decode, is_valid, is_canonical
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
