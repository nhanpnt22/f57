"""ID57-SHORT constrained ID tests."""

import pytest
from f57 import (
    id57_short_generate, id57_short_generate_default, id57_short_verify, id57_short_verify_default,
    id57_short_is_valid, id57_short_is_canonical,
    HashFunction, ID57ShortLength
)


def test_default_and_verify():
    """Test default generation and verification."""
    input_data = b"abc"
    s = id57_short_generate_default(input_data)
    assert id57_short_verify_default(input_data, s)


def test_is_valid_and_canonical():
    """Test validity and canonicity."""
    input_data = b"test"
    s = id57_short_generate_default(input_data)
    assert id57_short_is_valid(s)
    assert id57_short_is_canonical(s)
