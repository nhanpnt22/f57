import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ID57Length,
  computeID57HashForLength,
  id57Generate,
  id57GenerateDefault,
  id57IsCanonical,
  id57IsValid,
  id57Verify,
  id57VerifyDefault,
  maskExcessBits,
  resolveID57Length
} from './id57.js';
import { HashFunction } from './h57.js';
import { encode } from './b57.js';
import { B57Error, ErrorCode } from './errors.js';

const te = new TextEncoder();

test('id57 deterministic output', () => {
  const input = te.encode('id57-deterministic');
  const a = id57Generate(input, HashFunction.BLAKE3, ID57Length.LEN_256);
  const b = id57Generate(input, HashFunction.BLAKE3, ID57Length.LEN_256);
  assert.equal(a, b);
});

test('id57 default uses LEN_128 baseline', () => {
  const input = te.encode('id57-default');
  const out = id57GenerateDefault(input);
  assert.equal(out.length, 22);
});

test('id57 one-way output differs from raw encode', () => {
  const input = te.encode('id57-one-way');
  const out = id57Generate(input, HashFunction.BLAKE3, ID57Length.LEN_128);
  assert.notEqual(out, encode(input));
});

test('id57 all length enums with BLAKE3', () => {
  const input = te.encode('id57-length-enums');
  const lengths = [
    ID57Length.LEN_8,
    ID57Length.LEN_16,
    ID57Length.LEN_23,
    ID57Length.LEN_29,
    ID57Length.LEN_32,
    ID57Length.LEN_47,
    ID57Length.LEN_64,
    ID57Length.LEN_70,
    ID57Length.LEN_93,
    ID57Length.LEN_128,
    ID57Length.LEN_186,
    ID57Length.LEN_256,
    ID57Length.LEN_373,
    ID57Length.LEN_512,
    ID57Length.DEFAULT
  ];

  for (const len of lengths) {
    const out = id57Generate(input, HashFunction.BLAKE3, len);
    assert.equal(id57IsValid(out), true);
    assert.equal(id57IsCanonical(out), true);
    assert.equal(id57Verify(input, HashFunction.BLAKE3, out, len), true);
  }
});

test('id57 invalid length enum is rejected', () => {
  assert.throws(
    () => id57Generate(te.encode('id57-invalid-len'), HashFunction.BLAKE3, 77777),
    (err) => err instanceof B57Error && err.code === ErrorCode.INVALID_LENGTH_ENUM
  );
});

test('id57 SHA-256 rejects LEN_512 with entropy exceeded', () => {
  assert.throws(
    () => id57Generate(te.encode('id57-sha256'), HashFunction.SHA256, ID57Length.LEN_512),
    (err) => err instanceof B57Error && err.code === ErrorCode.ENTROPY_EXCEEDED
  );
});

test('id57 verify default works', () => {
  const input = te.encode('id57-verify-default');
  const out = id57GenerateDefault(input);
  assert.equal(id57VerifyDefault(input, out), true);
  assert.equal(id57VerifyDefault(te.encode('different'), out), false);
});

test('id57 helper coverage paths', () => {
  assert.equal(resolveID57Length(ID57Length.DEFAULT), ID57Length.LEN_128);
  assert.equal(resolveID57Length(ID57Length.LEN_64), ID57Length.LEN_64);
  assert.throws(
    () => resolveID57Length(999999),
    (err) => err instanceof B57Error && err.code === ErrorCode.INVALID_LENGTH_ENUM
  );

  const b = computeID57HashForLength(te.encode('id57-default-hash'), '', 8);
  assert.ok(b.length >= 8);

  const masked = new Uint8Array([0xff]);
  maskExcessBits(masked, 5);
  assert.equal(masked[0], 0xf8);
});
