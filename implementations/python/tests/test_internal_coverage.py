import pytest

from f57 import b57 as b57_mod
from f57 import h57 as h57_mod
from f57 import i57 as i57_mod
from f57 import r57 as r57_mod
from f57 import errors as err_mod


def test_error_constructors_and_messages():
    assert 'position' in str(err_mod.InvalidCharError(1, ord('x')))
    assert 'non-canonical' in str(err_mod.NonCanonicalError())
    assert 'invalid length enum' in str(err_mod.InvalidLengthEnumError(999))
    assert 'requested entropy exceeds' in str(err_mod.EntropyExceededError(10, 5))
    assert 'invalid hash function' in str(err_mod.InvalidHashFunctionError('bad'))
    assert 'insufficient entropy' in str(err_mod.InsufficientEntropyError())
    assert 'invalid random generation mode' in str(err_mod.InvalidModeError(999))
    assert 'invalid input' in str(err_mod.InvalidInputError('oops'))


def test_b57_length_helpers_and_noncanonical_guard():
    assert b57_mod.encoded_length(0) == 0
    assert b57_mod.decoded_length(0) == 0
    # Force the non-canonical helper branch.
    with pytest.raises(err_mod.NonCanonicalError):
        b57_mod._verify_canonical('A', b'\x01')


def test_h57_internal_branches():
    data = b'hello'

    # SHA paths
    sha256_h = h57_mod.h57_hash(data, h57_mod.HashFunction.SHA256, h57_mod.H57Length.LEN128)
    sha512_h = h57_mod.h57_hash(data, h57_mod.HashFunction.SHA512, h57_mod.H57Length.LEN256)
    assert sha256_h and sha512_h

    # Verify failure path
    assert not h57_mod.h57_verify(data, 'not-a-valid-value', h57_mod.HashFunction.SHA256, h57_mod.H57Length.LEN128)

    # Internal branch: zero-length xof
    assert h57_mod._compute_hash_blake3_xof(data, 0) == b''

    # Internal branch: unknown hash function in _compute_hash
    with pytest.raises(ValueError):
        h57_mod._compute_hash(data, object())

    # Internal branch: entropy exceeded
    with pytest.raises(err_mod.EntropyExceededError):
        h57_mod._select_effective_bytes(b'1234', h57_mod.H57Length.LEN512, h57_mod.HashFunction.SHA256)

    # Effective-length resolver branches
    assert h57_mod._resolve_effective_length(h57_mod.H57Length.HASH_AUTO, h57_mod.HashFunction.SHA512) == h57_mod.H57Length.LEN512
    assert h57_mod._resolve_effective_length(h57_mod.H57Length.HASH256, h57_mod.HashFunction.BLAKE3) == h57_mod.H57Length.LEN256
    assert h57_mod._resolve_effective_length(h57_mod.H57Length.HASH512, h57_mod.HashFunction.BLAKE3) == h57_mod.H57Length.LEN512

    # Invalid bits lookup
    class FakeLength:
        value = 999

    with pytest.raises(err_mod.InvalidLengthEnumError):
        h57_mod._bits_by_length(FakeLength())


def test_i57_internal_key_material_and_crypto_errors(monkeypatch):
    # _decode_key_material: hex path
    hex_key = '41' * 32
    assert i57_mod._decode_key_material(hex_key) == b'A' * 32

    # _decode_key_material: utf path
    assert i57_mod._decode_key_material('Z' * 32) == b'Z' * 32

    # _decode_key_material: invalid path
    with pytest.raises(err_mod.InvalidInputError):
        i57_mod._decode_key_material('short')

    # _resolve_one_key with empty inputs
    monkeypatch.delenv('B57_AES_256_KEY', raising=False)
    assert i57_mod._resolve_one_key('B57_AES_256_KEY', 'i57.keys.b57_aes_256_key', {}) is None

    # invalid key_id for encode
    with pytest.raises(err_mod.InvalidInputError):
        i57_mod.i57_b57_aes_256_encode(b'x', b'K' * 32, key_id=300)

    # malformed envelope
    with pytest.raises(Exception):
        i57_mod.i57_b57_aes_256_decode('A', b'K' * 32, expected_key_id=1)

    # invalid H57 length in secure hash helper
    keys = i57_mod.I57SecureKeys(b'K' * 32, b'H' * 32, b'I' * 32)
    with pytest.raises(Exception):
        i57_mod.i57_hash_secure(b'data', object(), keys)


def test_r57_invalid_mode_branch():
    with pytest.raises(ValueError):
        r57_mod._generate_entropy(999)
