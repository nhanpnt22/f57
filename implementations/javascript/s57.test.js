import test from 'node:test';
import assert from 'node:assert/strict';

import { encode, decode, isCanonical, isValid } from './b57.js';
import { H57Length } from './h57.js';
import { ID57Length } from './id57.js';
import { ErrorCode } from './errors.js';
import { S57, S57_VERSION } from './s57.js';

const enc = new TextEncoder();

function createS57() {
  return new S57({
    server_secret_key: enc.encode('S57_SERVER_SECRET_KEY_MUST_BE_LONG_1234567890'),
    environment_salt: enc.encode('prod-v1'),
    key_id: 7
  });
}

test('S57 key derivation outputs 32-byte keys', () => {
  const s57 = createS57();
  const keys = s57.resolveKeys();
  assert.equal(keys.b57_aes_256_key.length, 32);
  assert.equal(keys.h57_key.length, 32);
  assert.equal(keys.id57_key.length, 32);
  assert.equal(keys.key_id, 7);
});

test('S57 hash deterministic and canonical', () => {
  const s57 = createS57();
  const input = enc.encode('hello-s57-hash');
  const a = s57.hash(input, H57Length.LEN_256);
  const b = s57.hash(input, H57Length.LEN_256);

  assert.equal(a, b);
  assert.equal(a.length, 44);
  assert.equal(isValid(a), true);
  assert.equal(isCanonical(a), true);
});

test('S57 id deterministic and enforces profile lengths', () => {
  const s57 = createS57();
  const input = enc.encode('hello-s57-id');

  const d = s57.id(input, ID57Length.DEFAULT);
  const v256 = s57.id(input, ID57Length.LEN_256);
  const v512 = s57.id(input, ID57Length.LEN_512);

  assert.equal(d.length, 22);
  assert.equal(v256.length, 44);
  assert.equal(v512.length, 88);

  // S57 only exposes the 128/256/512-bit security profile: non-security
  // fixed widths (FIXED_k, negative length_enum) MUST be rejected, since
  // they are non-security by definition (spec s57-security-57.txt 8).
  assert.throws(() => s57.id(input, ID57Length.FIXED_8), (err) => err.code === ErrorCode.INVALID_LENGTH_ENUM);
  assert.throws(() => s57.id(input, 77777), (err) => err.code === ErrorCode.INVALID_LENGTH_ENUM);
});

test('S57 random API variants produce canonical 22-char strings', () => {
  const s57 = createS57();
  const values = [
    s57.random(),
    s57.random_time(),
    s57.random_counter(42),
    s57.random_session(enc.encode('session-secret')),
    s57.random_device(enc.encode('device-secret')),
    s57.random_derived(enc.encode('master-secret'), enc.encode('u-1')),
    s57.random_hardened(),
    s57.random_hybrid(enc.encode('a'), enc.encode('b'), enc.encode('c'))
  ];

  for (const value of values) {
    assert.equal(value.length, 22);
    assert.equal(isValid(value), true);
    assert.equal(isCanonical(value), true);
  }
});

test('S57 random_derived is deterministic for same inputs', () => {
  const s57 = createS57();
  const master = enc.encode('master');
  const unique = enc.encode('unique');

  const a = s57.random_derived(master, unique);
  const b = s57.random_derived(master, unique);
  assert.equal(a, b);
});

test('S57 encrypt/decrypt round-trip with aad', () => {
  const s57 = createS57();
  const plaintext = enc.encode('secret payload');
  const aad = enc.encode('aad-v1');

  const cipher = s57.encrypt(plaintext, aad);
  const out = s57.decrypt(cipher, aad);

  assert.deepEqual(Array.from(out), Array.from(plaintext));
});

test('S57 decrypt fails with wrong aad', () => {
  const s57 = createS57();
  const plaintext = enc.encode('hello');
  const cipher = s57.encrypt(plaintext, enc.encode('good-aad'));

  assert.throws(
    () => s57.decrypt(cipher, enc.encode('bad-aad')),
    (err) => err.code === ErrorCode.AUTH_FAILURE
  );
});

test('S57 decrypt fails for unknown key_id', () => {
  const s57 = createS57();
  const plaintext = enc.encode('hello');
  const cipher = s57.encrypt(plaintext);

  assert.throws(
    () => s57.decrypt(cipher, new Uint8Array(0), 1),
    (err) => err.code === ErrorCode.KEY_UNAVAILABLE
  );
});

test('S57 decrypt fails for invalid version byte', () => {
  const s57 = createS57();
  const plaintext = enc.encode('hello');
  const cipher = s57.encrypt(plaintext);
  const raw = Uint8Array.from(decode(cipher));
  raw[0] = 0xff;
  const tampered = encode(raw);

  assert.throws(
    () => s57.decrypt(tampered),
    (err) => err.code === ErrorCode.INVALID_VERSION
  );
});

test('S57 constants exposed', () => {
  assert.equal(S57_VERSION, 0x01);
});
