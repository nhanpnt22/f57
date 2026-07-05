"""ID57 deterministic ID tests."""

import pytest
from f57 import (
    id57_generate, id57_generate_default, id57_verify, id57_verify_default,
    id57_is_valid, id57_is_canonical, id57_range, id57_is_length,
    HashFunction, ID57Length, InvalidLengthEnumError
)


BIT_LENGTHS = [
    ID57Length.LEN8,
    ID57Length.LEN16,
    ID57Length.LEN32,
    ID57Length.LEN64,
    ID57Length.LEN128,
    ID57Length.LEN256,
    ID57Length.LEN512,
    ID57Length.DEFAULT,
]

FIXED_WIDTHS = [
    (ID57Length.FIXED_2, 2),
    (ID57Length.FIXED_3, 3),
    (ID57Length.FIXED_4, 4),
    (ID57Length.FIXED_5, 5),
    (ID57Length.FIXED_6, 6),
    (ID57Length.FIXED_7, 7),
    (ID57Length.FIXED_8, 8),
    (ID57Length.FIXED_9, 9),
    (ID57Length.FIXED_10, 10),
    (ID57Length.FIXED_11, 11),
    (ID57Length.FIXED_12, 12),
]


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
    p = id57_generate(input_data, HashFunction.BLAKE3, ID57Length.DEFAULT)
    assert d == p
    lo, hi = id57_range(ID57Length.DEFAULT)
    assert lo <= len(d) <= hi


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


@pytest.mark.parametrize("length_enum", BIT_LENGTHS)
def test_bit_lengths_generate_within_bound_and_reject_is_length(length_enum):
    """Bit lengths (and DEFAULT) generate within [min,max] and id57_is_length raises."""
    input_data = b"bit-length-" + str(length_enum).encode()
    out = id57_generate(input_data, HashFunction.BLAKE3, length_enum)
    lo, hi = id57_range(length_enum)
    assert lo <= len(out) <= hi
    assert id57_verify(input_data, HashFunction.BLAKE3, out, length_enum)

    with pytest.raises(InvalidLengthEnumError):
        id57_is_length(out, length_enum)


@pytest.mark.parametrize("length_enum,k", FIXED_WIDTHS)
def test_fixed_widths_generate_exact_length(length_enum, k):
    """Fixed widths always produce exactly k characters."""
    input_data = b"fixed-width-input"
    out = id57_generate(input_data, HashFunction.BLAKE3, length_enum)
    assert len(out) == k
    assert id57_range(length_enum) == (k, k)
    assert id57_is_length(out, length_enum) is True


@pytest.mark.parametrize("length_enum,k", FIXED_WIDTHS)
def test_fixed_width_is_prefix_of_len128(length_enum, k):
    """FIXED_k output must equal the first k chars of the LEN128 output."""
    input_data = b"prefix-invariant-input"
    full = id57_generate(input_data, HashFunction.BLAKE3, ID57Length.LEN128)
    fixed = id57_generate(input_data, HashFunction.BLAKE3, length_enum)
    assert fixed == full[:k]


def test_nested_fixed_widths():
    """FIXED_j output is a prefix of FIXED_k output for j < k."""
    input_data = b"nested-fixed-widths"
    outputs = {
        k: id57_generate(input_data, HashFunction.BLAKE3, length_enum)
        for length_enum, k in FIXED_WIDTHS
    }
    widths = sorted(outputs.keys())
    for i in range(len(widths) - 1):
        j, k = widths[i], widths[i + 1]
        assert outputs[k].startswith(outputs[j])


def test_is_length_checks_both_conditions_independently():
    """id57_is_length must check length AND alphabet, neither alone suffices."""
    # Correct length, but not derived from real generation - must still pass,
    # proving id57_is_length does not decode/canonicalize.
    assert id57_is_length("AAAA", ID57Length.FIXED_4) is True

    # Wrong length, valid chars -> False
    assert id57_is_length("AAA", ID57Length.FIXED_4) is False
    assert id57_is_length("AAAAA", ID57Length.FIXED_4) is False

    # Correct length, invalid char ('0' and 'I' and 'O' and 'l' are excluded
    # from the B57 alphabet) -> False
    assert id57_is_length("AAA0", ID57Length.FIXED_4) is False


def test_is_length_rejects_bit_lengths():
    """id57_is_length must raise for every bit length, including DEFAULT."""
    for length_enum in BIT_LENGTHS:
        with pytest.raises(InvalidLengthEnumError):
            id57_is_length("AAAAAAAAAAAAAAAA", length_enum)


def test_out_of_range_negative_lengths_raise():
    """-9 is a valid FIXED_9, but -13/-1/other stray negatives must raise."""
    assert id57_range(ID57Length.FIXED_9) == (9, 9)
    out = id57_generate(b"x", HashFunction.BLAKE3, ID57Length.FIXED_9)
    assert len(out) == 9

    for bad in (-13, -1, -100):
        with pytest.raises(InvalidLengthEnumError):
            id57_generate(b"x", HashFunction.BLAKE3, bad)
        with pytest.raises(InvalidLengthEnumError):
            id57_range(bad)
