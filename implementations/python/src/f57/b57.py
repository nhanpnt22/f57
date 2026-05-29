"""B57 core encode/decode implementation."""

from .errors import InvalidCharError, NonCanonicalError

ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz123456789"
BASE = 57

# Build lookup table
_ALPHA_INDEX = {ord(c): i for i, c in enumerate(ALPHABET)}


def encode(data: bytes) -> str:
    """Encode bytes to B57 string."""
    if not data:
        return ""

    # Count leading zeros
    leading_zeros = 0
    for byte in data:
        if byte == 0:
            leading_zeros += 1
        else:
            break

    if leading_zeros == len(data):
        return "A" * len(data)

    # Convert to big integer
    num = 0
    for i in range(leading_zeros, len(data)):
        num = num * 256 + data[i]

    # Convert to base 57
    out = []
    while num > 0:
        out.append(ALPHABET[num % BASE])
        num //= BASE

    out.reverse()
    return "A" * leading_zeros + "".join(out)


def decode(s: str) -> bytes:
    """Decode B57 string to bytes."""
    if not s:
        return b""

    # Validate characters
    for i, char in enumerate(s):
        if ord(char) not in _ALPHA_INDEX:
            raise InvalidCharError(i, ord(char))

    # Count leading 'A's
    leading_zeros = 0
    for char in s:
        if _ALPHA_INDEX[ord(char)] == 0:
            leading_zeros += 1
        else:
            break

    if leading_zeros == len(s):
        _verify_canonical(s, bytes(len(s)))
        return bytes(len(s))

    # Convert from base 57
    num = 0
    for i in range(leading_zeros, len(s)):
        num = num * BASE + _ALPHA_INDEX[ord(s[i])]

    # Convert to bytes
    decoded = []
    while num > 0:
        decoded.append(num % 256)
        num //= 256

    decoded.reverse()
    result = bytes(leading_zeros) + bytes(decoded)

    _verify_canonical(s, result)
    return result


def is_valid(s: str) -> bool:
    """Check if string is valid B57."""
    return not s or all(ord(c) in _ALPHA_INDEX for c in s)


def is_canonical(s: str) -> bool:
    """Check if string is canonical B57."""
    if not s:
        return True
    if not is_valid(s):
        return False
    try:
        return encode(decode(s)) == s
    except Exception:
        return False


def encoded_length(byte_len: int) -> int:
    """Estimate encoded length for given byte count."""
    if byte_len == 0:
        return 0
    bits_per_char = len(bin(BASE)) - 2
    return (byte_len * 8 + bits_per_char - 1) // bits_per_char


def decoded_length(char_len: int) -> int:
    """Estimate decoded length for given character count."""
    if char_len == 0:
        return 0
    bits_per_char = len(bin(BASE)) - 2
    return (char_len * bits_per_char) // 8


def _verify_canonical(original: str, decoded: bytes) -> None:
    """Verify that encoded form matches original."""
    if encode(decoded) != original:
        raise NonCanonicalError()
