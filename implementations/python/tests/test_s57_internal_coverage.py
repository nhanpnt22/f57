"""Additional S57 and I57 internal coverage tests."""

import os

import pytest

from b57 import (
    S57,
    S57Config,
    H57Length,
    ID57Length,
    InvalidInputError,
    InvalidLengthEnumError,
    KeyInvalidError,
)
from b57 import i57 as i57_mod


def _s57() -> S57:
    return S57(
        S57Config(
            server_secret_key=b"S57_SERVER_SECRET_KEY_MUST_BE_LONG_1234567890",
            environment_salt=b"coverage-v1",
            key_id=9,
        )
    )


def test_s57_constructor_and_resolve_key_branches():
    with pytest.raises(KeyInvalidError):
        S57(S57Config(server_secret_key=b"short", environment_salt=b"x"))

    s57 = _s57()
    keys = s57.resolve_keys(3)
    assert keys.key_id == 3


def test_s57_helper_paths_and_error_branches():
    s57 = _s57()

    assert s57.hash(b"x", H57Length.HASH_AUTO)
    with pytest.raises(InvalidLengthEnumError):
        s57.hash(b"x", H57Length.LEN47)

    assert s57.id(b"x", ID57Length.DEFAULT)
    with pytest.raises(InvalidLengthEnumError):
        s57.id(b"x", ID57Length.LEN47)

    with pytest.raises(InvalidInputError):
        s57.random_hybrid()

    with pytest.raises(InvalidInputError):
        s57.decrypt("A")

    # Envelope with correct version but too short payload after nonce.
    raw = bytes([1, 9]) + b"\x00" * 12 + b"\x01" * 8
    tampered = i57_mod.encode(raw)
    with pytest.raises(InvalidInputError):
        s57.decrypt(tampered)


def test_i57_secure_helpers_happy_and_edge_cases(monkeypatch):
    key32 = b"K" * 32

    assert i57_mod._decode_key_material("4b" * 32) == key32
    assert i57_mod._decode_key_material("K" * 32) == key32

    cfg = {"i57.keys.b57_aes_256_key": "4b" * 32}
    assert i57_mod._resolve_one_key("B57_AES_256_KEY", "i57.keys.b57_aes_256_key", cfg) == key32

    monkeypatch.setenv("B57_AES_256_KEY", "4b" * 32)
    assert i57_mod._resolve_one_key("B57_AES_256_KEY", "missing", {}) == key32

    sealed = i57_mod.i57_b57_aes_256_encode(b"payload", key32, b"aad", key_id=11)
    opened = i57_mod.i57_b57_aes_256_decode(sealed, key32, b"aad", expected_key_id=11)
    assert opened == b"payload"

    with pytest.raises(InvalidInputError):
        i57_mod.i57_b57_aes_256_encode(b"x", key32, key_id=300)

    with pytest.raises(InvalidInputError):
        i57_mod.i57_b57_aes_256_decode(sealed, key32, b"aad", expected_key_id=1)

    secure_keys = i57_mod.I57SecureKeys(key32, b"H" * 32, b"I" * 32)
    assert i57_mod.i57_hash_secure(b"data", H57Length.LEN128, secure_keys)
    assert i57_mod.i57_hash_secure(b"data", H57Length.LEN256, secure_keys)
    assert i57_mod.i57_hash_secure(b"data", H57Length.LEN512, secure_keys)
    assert i57_mod.i57_hash_secure(b"data", H57Length.HASH_AUTO, secure_keys)

    with pytest.raises(InvalidInputError):
        i57_mod.i57_hash_secure(b"data", H57Length.LEN47, secure_keys)

    monkeypatch.delenv("B57_AES_256_KEY", raising=False)
    assert i57_mod._resolve_one_key("B57_AES_256_KEY", "missing", {}) is None
