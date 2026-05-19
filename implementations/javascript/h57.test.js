import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HashFunction,
  H57Length,
  h57Hash,
  h57IsCanonical,
  h57IsValid,
  h57Verify,
  selectEffectiveHashBytes,
  computeHash
} from './h57.js';
import { B57Error, ErrorCode } from './errors.js';

const te = new TextEncoder();

test('h57 deterministic output', () => {
  const input = te.encode('h57-deterministic');
  const a = h57Hash(input, HashFunction.BLAKE3, H57Length.LEN_256);
  const b = h57Hash(input, HashFunction.BLAKE3, H57Length.LEN_256);
  assert.equal(a, b);
});

test('h57 defaults to BLAKE3 when hash function is omitted', () => {
  const input = te.encode('h57-default-hash');
  const a = h57Hash(input, undefined, H57Length.LEN_128);
  const b = h57Hash(input, HashFunction.BLAKE3, H57Length.LEN_128);
  assert.equal(a, b);
});

test('h57 supports required and informational enums with BLAKE3', () => {
  const input = te.encode('h57-length-enums');
  const lengths = [
    H57Length.LEN_8,
    H57Length.LEN_16,
    H57Length.LEN_23,
    H57Length.LEN_29,
    H57Length.LEN_32,
    H57Length.LEN_47,
    H57Length.LEN_64,
    H57Length.LEN_70,
    H57Length.LEN_93,
    H57Length.LEN_128,
    H57Length.LEN_186,
    H57Length.LEN_256,
    H57Length.LEN_373,
    H57Length.LEN_512
  ];

  for (const len of lengths) {
    const out = h57Hash(input, HashFunction.BLAKE3, len);
    assert.equal(h57IsValid(out), true);
    assert.equal(h57IsCanonical(out), true);
    assert.equal(h57Verify(input, out, HashFunction.BLAKE3, len), true);
  }
});

test('h57 SHA-512 supports LEN_512', () => {
  const out = h57Hash(te.encode('h57-sha512'), HashFunction.SHA512, H57Length.LEN_512);
  assert.equal(h57IsValid(out), true);
});

test('h57 SHA-256 rejects LEN_512 with entropy exceeded', () => {
  assert.throws(
    () => h57Hash(te.encode('h57-sha256'), HashFunction.SHA256, H57Length.LEN_512),
    (err) => err instanceof B57Error && err.code === ErrorCode.ENTROPY_EXCEEDED
  );
});

test('h57 invalid hash function is rejected', () => {
  assert.throws(
    () => h57Hash(te.encode('h57-invalid-hash'), 'unsupported', H57Length.LEN_128),
    (err) => err instanceof B57Error && err.code === ErrorCode.INVALID_HASH_FUNCTION
  );
});

test('h57 selectEffectiveHashBytes error path', () => {
  const hash = computeHash(te.encode('x'), HashFunction.SHA256);
  assert.throws(
    () => selectEffectiveHashBytes(hash, H57Length.LEN_512),
    (err) => err instanceof B57Error && err.code === ErrorCode.ENTROPY_EXCEEDED
  );
});
