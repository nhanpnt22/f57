"""B57 core tests."""

import pytest
from f57 import encode, decode, is_valid, is_canonical, encoded_length, decoded_length
from f57 import InvalidCharError, NonCanonicalError


def test_encode_decode_roundtrip():
    """Test roundtrip encode/decode."""
    input_data = b"hello world"
    encoded = encode(input_data)
    decoded = decode(encoded)
    assert decoded == input_data


def test_leading_zeros():
    """Test leading zeros are preserved."""
    data = b"\x00\x00\x01\x02\x03"
    encoded = encode(data)
    assert encoded.startswith("AA")
    assert decode(encoded) == data


def test_all_zeros():
    """Test all zeros."""
    assert encode(b"\x00\x00\x00") == "AAA"
    assert decode("AAA") == b"\x00\x00\x00"


def test_invalid_char():
    """Test invalid character detection."""
    with pytest.raises(InvalidCharError):
        decode("A0B")


def test_is_valid_and_canonical():
    """Test validity and canonicity checks."""
    data = b"hello"
    enc = encode(data)
    assert is_valid(enc)
    assert is_canonical(enc)
    assert not is_valid("A0B")


def test_length_helpers():
    """Test length estimation helpers."""
    assert encoded_length(0) == 0
    assert decoded_length(0) == 0
    assert encoded_length(16) > 0
    assert decoded_length(22) > 0


def test_empty_string():
    """Test empty input."""
    assert encode(b"") == ""
    assert decode("") == b""
