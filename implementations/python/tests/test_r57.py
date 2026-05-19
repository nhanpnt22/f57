"""R57 random generation tests."""

import pytest
from b57 import r57_generate, r57_is_valid, r57_is_canonical, R57Mode


def test_mode_values():
    """Test mode enum values."""
    assert R57Mode.CSPRNG.value == 1


def test_all_modes_generate():
    """Test all modes generate valid identifiers."""
    for mode in R57Mode:
        id_str = r57_generate(mode)
        assert r57_is_valid(id_str)
        assert r57_is_canonical(id_str)
        assert len(id_str) == 22
