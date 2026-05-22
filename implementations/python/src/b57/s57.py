"""S57 secure composition profile."""

from __future__ import annotations

import secrets
import struct
import time
from dataclasses import dataclass
from typing import Optional

import blake3 as blake3_module
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from .b57 import encode, decode, is_valid, is_canonical
from .errors import (
    InvalidLengthEnumError,
    InvalidInputError,
    InvalidVersionError,
    AuthFailureError,
    KeyInvalidError,
    KeyUnavailableError,
)
from .h57 import H57Length
from .id57 import ID57Length

S57_VERSION = 0x01


@dataclass(frozen=True)
class S57Config:
    server_secret_key: bytes
    environment_salt: bytes
    key_id: int = 1


@dataclass(frozen=True)
class S57Keys:
    b57_aes_256_key: bytes
    h57_key: bytes
    id57_key: bytes
    key_id: int


class S57:
    def __init__(self, config: S57Config):
        if len(config.server_secret_key) < 32 or len(config.environment_salt) == 0:
            raise KeyInvalidError()

        self._server_secret = bytes(config.server_secret_key)
        self._env_salt = bytes(config.environment_salt)
        self._key_id = (config.key_id or 1) & 0xFF
        self.keys = self.resolve_keys(self._key_id)

    def resolve_keys(self, key_id: Optional[int] = None) -> S57Keys:
        effective = self._key_id if key_id is None else (key_id & 0xFF)
        seed = self._server_secret + self._env_salt
        if len(seed) < 32:
            raise KeyInvalidError()

        return S57Keys(
            b57_aes_256_key=_blake3_derive_key("S57/B57_AES_256/v1", seed, 32),
            h57_key=_blake3_derive_key("S57/H57_KEY/v1", seed, 32),
            id57_key=_blake3_derive_key("S57/ID57_KEY/v1", seed, 32),
            key_id=effective,
        )

    def hash(self, data: bytes, length: H57Length = H57Length.LEN256) -> str:
        bits = _resolve_s57_h57_bits(length)
        requested = (bits + 7) // 8
        out = _blake3_keyed(self.keys.h57_key, data, requested)
        out = bytearray(out)
        _mask_excess_bits(out, bits)
        return encode(bytes(out))

    def id(self, data: bytes, length: ID57Length = ID57Length.DEFAULT) -> str:
        effective = ID57Length.LEN128 if length == ID57Length.DEFAULT else length
        bits = _id57_bits(effective)
        if bits not in (128, 256, 512):
            raise InvalidLengthEnumError(length.value)

        requested = (bits + 7) // 8
        out = _blake3_keyed(self.keys.id57_key, data, requested)
        out = bytearray(out)
        _mask_excess_bits(out, bits)
        return encode(bytes(out))

    def random(self) -> str:
        return _encode_r57_128(secrets.token_bytes(16))

    def random_time(self) -> str:
        now_secs = int(time.time()) & 0xFFFFFFFF
        mixed = blake3_module.blake3(struct.pack(">I", now_secs) + secrets.token_bytes(12)).digest(length=16)
        return _encode_r57_128(mixed)

    def random_counter(self, counter: int) -> str:
        mixed = blake3_module.blake3(struct.pack(">I", counter & 0xFFFFFFFF) + secrets.token_bytes(12)).digest(length=16)
        return _encode_r57_128(mixed)

    def random_session(self, session_secret: bytes) -> str:
        key = _blake3_derive_key("S57/R57_SESSION/v1", bytes(session_secret), 32)
        mixed = _blake3_keyed(key, secrets.token_bytes(16), 16)
        return _encode_r57_128(mixed)

    def random_device(self, device_secret: bytes) -> str:
        key = _blake3_derive_key("S57/R57_DEVICE/v1", bytes(device_secret), 32)
        mixed = _blake3_keyed(key, secrets.token_bytes(16), 16)
        return _encode_r57_128(mixed)

    def random_derived(self, master_secret: bytes, unique_input: bytes) -> str:
        key = _blake3_derive_key("S57/R57_DERIVED/v1", bytes(master_secret), 32)
        mixed = _blake3_keyed(key, bytes(unique_input), 16)
        return _encode_r57_128(mixed)

    def random_hardened(self) -> str:
        mixed = blake3_module.blake3(secrets.token_bytes(16)).digest(length=16)
        return _encode_r57_128(mixed)

    def random_hybrid(self, *sources: bytes) -> str:
        if len(sources) == 0:
            raise InvalidInputError("random_hybrid requires at least one source")
        merged = b"".join(bytes(s) for s in sources)
        mixed = blake3_module.blake3(merged).digest(length=16)
        return _encode_r57_128(mixed)

    def encrypt(self, plaintext: bytes, aad: bytes = b"") -> str:
        if len(self.keys.b57_aes_256_key) != 32:
            raise KeyInvalidError()
        nonce = secrets.token_bytes(12)
        aesgcm = AESGCM(self.keys.b57_aes_256_key)
        ciphertext_with_tag = aesgcm.encrypt(nonce, bytes(plaintext), bytes(aad))

        envelope = bytes([S57_VERSION, self.keys.key_id]) + nonce + ciphertext_with_tag
        return encode(envelope)

    def decrypt(self, b57_string: str, aad: bytes = b"", expected_key_id: Optional[int] = None) -> bytes:
        env = decode(b57_string)
        if len(env) < 30:
            raise InvalidInputError("invalid envelope length")

        version = env[0]
        if version != S57_VERSION:
            raise InvalidVersionError(version)

        key_id = env[1]
        if expected_key_id is not None and key_id != (expected_key_id & 0xFF):
            raise KeyUnavailableError(key_id)
        if key_id != self.keys.key_id:
            raise KeyUnavailableError(key_id)

        nonce = env[2:14]
        ciphertext_with_tag = env[14:]
        if len(ciphertext_with_tag) < 16:
            raise InvalidInputError("invalid envelope length")

        aesgcm = AESGCM(self.keys.b57_aes_256_key)
        try:
            return aesgcm.decrypt(nonce, ciphertext_with_tag, bytes(aad))
        except Exception as exc:
            raise AuthFailureError() from exc


def s57_is_valid(value: str) -> bool:
    return is_valid(value)


def s57_is_canonical(value: str) -> bool:
    return is_canonical(value)


def _resolve_s57_h57_bits(length: H57Length) -> int:
    if length == H57Length.HASH_AUTO:
        return 256
    if length == H57Length.LEN128:
        return 128
    if length == H57Length.LEN256:
        return 256
    if length == H57Length.LEN512:
        return 512
    raise InvalidLengthEnumError(length.value)


def _id57_bits(length: ID57Length) -> int:
    bits = {
        ID57Length.LEN8: 8,
        ID57Length.LEN16: 16,
        ID57Length.LEN23: 23,
        ID57Length.LEN29: 29,
        ID57Length.LEN32: 32,
        ID57Length.LEN47: 47,
        ID57Length.LEN64: 64,
        ID57Length.LEN70: 70,
        ID57Length.LEN93: 93,
        ID57Length.LEN128: 128,
        ID57Length.LEN186: 186,
        ID57Length.LEN256: 256,
        ID57Length.LEN373: 373,
        ID57Length.LEN512: 512,
    }
    if length not in bits:
        raise InvalidLengthEnumError(length.value)
    return bits[length]


def _blake3_derive_key(context: str, seed: bytes, out_len: int) -> bytes:
    h = blake3_module.blake3(derive_key_context=context)
    h.update(seed)
    return h.digest(length=out_len)


def _blake3_keyed(key: bytes, data: bytes, out_len: int) -> bytes:
    h = blake3_module.blake3(key=key)
    h.update(data)
    return h.digest(length=out_len)


def _mask_excess_bits(data: bytearray, bit_length: int) -> None:
    if not data:
        return
    excess = len(data) * 8 - bit_length
    if excess <= 0:
        return
    mask = (0xFF << excess) & 0xFF
    data[-1] &= mask


def _encode_r57_128(raw: bytes) -> str:
    encoded = encode(raw)
    if len(encoded) == 22:
        return encoded

    derived = raw
    while len(encoded) < 22:
        derived = blake3_module.blake3(derived + b"\x57").digest(length=16)
        encoded = encode(derived)
    return encoded
