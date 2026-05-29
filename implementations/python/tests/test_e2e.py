"""End-to-end integration test."""

import pytest
from f57 import (
    encode, decode, h57_hash, h57_verify, id57_generate_default, id57_short_generate_default,
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
    
    # ID57
    id_str = id57_generate_default(input_data)
    assert len(id_str) == 22
    
    # ID57-SHORT
    id_short = id57_short_generate_default(input_data)
    assert id_short
    
    # I57
    i57_enc = i57_encode(input_data)
    i57_dec = i57_decode(i57_enc)
    assert i57_dec == input_data
    
    i57_h = i57_hash(input_data, HashFunction.SHA256, H57Length.LEN128)
    assert i57_h
    
    i57_id_res = i57_id(input_data, HashFunction.SHA256, ID57Length.DEFAULT)
    assert len(i57_id_res) == 22
    
    # R57
    r57 = i57_random(R57Mode.CSPRNG)
    assert len(r57) == 22
