"""End-to-end integration test."""

import pytest
from f57 import (
    encode, decode, h57_hash, h57_verify, id57_generate_default, id57_generate, id57_range,
    i57_encode, i57_decode, i57_hash, i57_id, i57_random,
    HashFunction, H57Length, ID57Length, R57Mode
)


def test_e2e_roundtrip_and_profiles():
    """Test all profiles together."""
    input_data = b"python-e2e-input"
    
    # B57
    b57_out = encode(input_data)
    b57_decoded = decode(b57_out)
    assert b57_decoded == input_data
    
    # H57
    h = h57_hash(input_data, HashFunction.SHA256, H57Length.LEN128)
    assert h
    
    # ID57 (bit-length mode: bounded width, not fixed)
    id_str = id57_generate_default(input_data)
    lo, hi = id57_range(ID57Length.DEFAULT)
    assert lo <= len(id_str) <= hi

    # ID57 (fixed-width mode)
    id_fixed = id57_generate(input_data, HashFunction.BLAKE3, ID57Length.FIXED_8)
    assert len(id_fixed) == 8
    assert id_fixed == id_str[:8]

    # I57
    i57_enc = i57_encode(input_data)
    i57_dec = i57_decode(i57_enc)
    assert i57_dec == input_data
    
    i57_h = i57_hash(input_data, HashFunction.SHA256, H57Length.LEN128)
    assert i57_h
    
    i57_id_res = i57_id(input_data, HashFunction.SHA256, ID57Length.DEFAULT)
    lo, hi = id57_range(ID57Length.DEFAULT)
    assert lo <= len(i57_id_res) <= hi
    
    # R57
    r57 = i57_random(R57Mode.CSPRNG)
    assert len(r57) == 22
