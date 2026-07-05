"""S57 unit tests."""

import pytest

from f57 import (
    S57,
    S57Config,
    S57_VERSION,
    H57Length,
    ID57Length,
    is_valid,
    is_canonical,
    decode,
    encode,
    InvalidLengthEnumError,
    AuthFailureError,
    KeyUnavailableError,
    InvalidVersionError,
)


def create_s57() -> S57:
    return S57(
        S57Config(
            server_secret_key=b"S57_SERVER_SECRET_KEY_MUST_BE_LONG_1234567890",
            environment_salt=b"prod-v1",
            key_id=7,
        )
    )


def test_s57_key_derivation_output_lengths():
    s57 = create_s57()
    keys = s57.resolve_keys()
    assert len(keys.b57_aes_256_key) == 32
    assert len(keys.h57_key) == 32
    assert len(keys.id57_key) == 32
    assert keys.key_id == 7


def test_s57_hash_deterministic_and_canonical():
    s57 = create_s57()
    inp = b"hello-s57-hash"
    a = s57.hash(inp, H57Length.LEN256)
    b = s57.hash(inp, H57Length.LEN256)
    assert a == b
    assert len(a) == 44
    assert is_valid(a)
    assert is_canonical(a)


def test_s57_id_deterministic_and_lengths():
    s57 = create_s57()
    inp = b"hello-s57-id"
    v128 = s57.id(inp, ID57Length.DEFAULT)
    v256 = s57.id(inp, ID57Length.LEN256)
    v512 = s57.id(inp, ID57Length.LEN512)
    assert len(v128) == 22
    assert len(v256) == 44
    assert len(v512) == 88

    with pytest.raises(InvalidLengthEnumError):
        s57.id(inp, ID57Length.LEN8)


def test_s57_random_api_outputs():
    s57 = create_s57()
    values = [
        s57.random(),
        s57.random_time(),
        s57.random_counter(42),
        s57.random_session(b"session-secret"),
        s57.random_device(b"device-secret"),
        s57.random_derived(b"master-secret", b"u-1"),
        s57.random_hardened(),
        s57.random_hybrid(b"a", b"b", b"c"),
    ]

    for value in values:
        assert len(value) == 22
        assert is_valid(value)
        assert is_canonical(value)


def test_s57_random_derived_deterministic():
    s57 = create_s57()
    a = s57.random_derived(b"master", b"unique")
    b = s57.random_derived(b"master", b"unique")
    assert a == b


def test_s57_encrypt_decrypt_roundtrip():
    s57 = create_s57()
    pt = b"secret payload"
    aad = b"aad-v1"

    encrypted = s57.encrypt(pt, aad)
    out = s57.decrypt(encrypted, aad)
    assert out == pt


def test_s57_decrypt_wrong_aad_fails():
    s57 = create_s57()
    encrypted = s57.encrypt(b"hello", b"good-aad")
    with pytest.raises(AuthFailureError):
        s57.decrypt(encrypted, b"bad-aad")


def test_s57_decrypt_wrong_key_id_fails():
    s57 = create_s57()
    encrypted = s57.encrypt(b"hello")
    with pytest.raises(KeyUnavailableError):
        s57.decrypt(encrypted, b"", expected_key_id=1)


def test_s57_decrypt_invalid_version_fails():
    s57 = create_s57()
    encrypted = s57.encrypt(b"hello")
    raw = bytearray(decode(encrypted))
    raw[0] = 0xFF
    tampered = encode(bytes(raw))

    with pytest.raises(InvalidVersionError):
        s57.decrypt(tampered)


def test_s57_constant_exposed():
    assert S57_VERSION == 0x01
