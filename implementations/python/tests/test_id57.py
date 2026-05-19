"""ID57 deterministic ID tests."""

import pytest
from b57 import (
    id57_generate, id57_generate_default, id57_verify, id57_verify_default,
    id57_is_valid, id57_is_canonical,
    HashFunction, ID57Length
)


def test_deterministic_generation():
    """Test ID generation is deterministic."""
    input_data = b"id57"
    a = id57_generate(input_data, HashFunction.SHA256, ID57Length.LEN256)
    b = id57_generate(input_data, HashFunction.SHA256, ID57Length.LEN256)
    assert a == b


def test_default_uses_len128():
    """Test default uses 128-bit."""
    input_data = b"x"
    d = id57_generate_default(input_data)
    p = id57_generate(input_data, HashFunction.SHA256, ID57Length.DEFAULT)
    assert d == p
    assert len(d) == 22


def test_verify_paths():
    """Test verification methods."""
    input_data = b"abc"
    s = id57_generate_default(input_data)
    assert id57_verify_default(input_data, s)
    assert not id57_verify_default(b"abcx", s)


def test_is_valid_and_canonical():
    """Test validity and canonicity."""
    input_data = b"test"
    s = id57_generate_default(input_data)
    assert id57_is_valid(s)
    assert id57_is_canonical(s)
