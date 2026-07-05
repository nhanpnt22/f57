"""I57 integration API tests."""

import pytest
from f57 import (
    i57_encode, i57_decode, i57_hash, i57_id, i57_random,
    i57_is_valid, i57_is_canonical, i57_validate_identifier, i57_validate_entropy,
    id57_generate, id57_range,
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


def test_validate_identifier_bit_length_branch():
    """Bit-length branch: bound + canonical + decoded byte-length/mask check."""
    input_data = b"i57-bit-length"
    id_str = id57_generate(input_data, HashFunction.BLAKE3, ID57Length.DEFAULT)
    assert i57_validate_identifier(id_str, ID57Length.DEFAULT)
    assert i57_validate_identifier(id_str)  # default arg matches DEFAULT

    id_256 = id57_generate(input_data, HashFunction.BLAKE3, ID57Length.LEN256)
    assert i57_validate_identifier(id_256, ID57Length.LEN256)
    assert not i57_validate_identifier(id_256, ID57Length.LEN128)

    # Corrupted/truncated string should fail the bound check.
    truncated = id_str[:-1]
    lo, hi = id57_range(ID57Length.DEFAULT)
    if len(truncated) < lo:
        assert not i57_validate_identifier(truncated, ID57Length.DEFAULT)

    # Non-canonical (extra leading 'A' padding beyond what canonical form allows)
    assert not i57_validate_identifier("not!!valid", ID57Length.DEFAULT)


def test_validate_identifier_fixed_width_branch():
    """Fixed-width branch: delegates entirely to id57_is_length."""
    input_data = b"i57-fixed-width"
    fixed = id57_generate(input_data, HashFunction.BLAKE3, ID57Length.FIXED_8)
    assert i57_validate_identifier(fixed, ID57Length.FIXED_8)

    # Wrong width fails.
    assert not i57_validate_identifier(fixed[:-1], ID57Length.FIXED_8)

    # A literal, non-generated valid-alphabet string of the right width
    # still validates True (no decode/canonical check for fixed widths).
    assert i57_validate_identifier("AAAAAAAA", ID57Length.FIXED_8)

    # Invalid character at correct width fails.
    assert not i57_validate_identifier("AAAAAAA0", ID57Length.FIXED_8)
