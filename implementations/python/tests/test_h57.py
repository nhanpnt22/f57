"""H57 hash-to-text tests."""

import pytest
from f57 import (
    h57_hash, h57_verify, h57_is_valid, h57_is_canonical,
    HashFunction, H57Length
)


def test_deterministic_hash():
    """Test hash is deterministic."""
    input_data = b"hello-h57"
    a = h57_hash(input_data, HashFunction.SHA256, H57Length.HASH_AUTO)
    b = h57_hash(input_data, HashFunction.SHA256, H57Length.HASH_AUTO)
    assert a == b


def test_auto_canonical_lengths():
    """Test auto lengths produce expected output."""
    input_data = b"canonical"
    
    sha256_out = h57_hash(input_data, HashFunction.SHA256, H57Length.HASH_AUTO)
    assert len(sha256_out) == 44
    
    sha512_out = h57_hash(input_data, HashFunction.SHA512, H57Length.HASH_AUTO)
    assert len(sha512_out) == 88


def test_verify():
    """Test hash verification."""
    input_data = b"verify"
    h = h57_hash(input_data, HashFunction.SHA256, H57Length.LEN128)
    assert h57_verify(input_data, h, HashFunction.SHA256, H57Length.LEN128)
    assert not h57_verify(b"different", h, HashFunction.SHA256, H57Length.LEN128)


def test_is_valid_and_canonical():
    """Test validity and canonicity."""
    input_data = b"test"
    h = h57_hash(input_data, HashFunction.SHA256, H57Length.LEN128)
    assert h57_is_valid(h)
    assert h57_is_canonical(h)
