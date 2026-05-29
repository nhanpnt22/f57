"""I57 integration API tests."""

import pytest
from f57 import (
    i57_encode, i57_decode, i57_hash, i57_id, i57_random,
    i57_is_valid, i57_is_canonical, i57_validate_identifier, i57_validate_entropy,
    HashFunction, H57Length, ID57Length, R57Mode
)


def test_encode_decode():
    """Test encode/decode roundtrip."""
    input_data = b"hello world"
    enc = i57_encode(input_data)
    dec = i57_decode(enc)
    assert dec == input_data


def test_hash_and_id():
    """Test hash and ID generation."""
    input_data = b"x"
    h = i57_hash(input_data, HashFunction.SHA256, H57Length.LEN128)
    assert h
    
    id_str = i57_id(input_data, HashFunction.SHA256, ID57Length.DEFAULT)
    assert id_str


def test_validation():
    """Test validation functions."""
    input_data = b"hello"
    enc = i57_encode(input_data)
    assert i57_is_valid(enc)
    assert i57_is_canonical(enc)
    assert not i57_is_valid("")


def test_entropy_heuristics():
    """Test entropy validation."""
    id_str = i57_random(R57Mode.CSPRNG)
    assert i57_validate_identifier(id_str)
    assert i57_validate_entropy(id_str)
    
    # Single repeated character should fail entropy check
    assert not i57_validate_entropy("AAAAAAAAAAAAAAAAAAAAAA")
    # Repeated half pattern should fail
    assert not i57_validate_entropy("ABABABABABABABABABABAB")
