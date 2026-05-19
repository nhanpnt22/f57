import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ID57ShortLength,
  id57ShortGenerate,
  id57ShortGenerateDefault,
  id57ShortIsCanonical,
  id57ShortIsValid,
  id57ShortVerify,
  id57ShortVerifyDefault
} from './id57_short.js';
import { HashFunction } from './h57.js';
import { B57Error, ErrorCode } from './errors.js';

const te = new TextEncoder();

test('id57-short deterministic output', () => {
  const input = te.encode('id57-short-deterministic');
  const a = id57ShortGenerate(input, HashFunction.BLAKE3, ID57ShortLength.LEN_47);
  const b = id57ShortGenerate(input, HashFunction.BLAKE3, ID57ShortLength.LEN_47);
  assert.equal(a, b);
});

test('id57-short default resolves to LEN_47', () => {
  const input = te.encode('id57-short-default');
  const out = id57ShortGenerateDefault(input);
  assert.ok(out.length >= 8 && out.length <= 9);
});

test('id57-short supports only profile lengths', () => {
  const input = te.encode('id57-short-lengths');
  const lengths = [
    ID57ShortLength.LEN_23,
    ID57ShortLength.LEN_29,
    ID57ShortLength.LEN_32,
    ID57ShortLength.LEN_47,
    ID57ShortLength.LEN_70,
    ID57ShortLength.DEFAULT
  ];

  for (const len of lengths) {
    const out = id57ShortGenerate(input, HashFunction.BLAKE3, len);
    assert.equal(id57ShortIsValid(out), true);
    assert.equal(id57ShortIsCanonical(out), true);
    assert.equal(id57ShortVerify(input, HashFunction.BLAKE3, out, len), true);
  }
});

test('id57-short rejects non-profile lengths', () => {
  assert.throws(
    () => id57ShortGenerate(te.encode('id57-short-invalid-len'), HashFunction.BLAKE3, 128),
    (err) => err instanceof B57Error && err.code === ErrorCode.INVALID_LENGTH_ENUM
  );
});

test('id57-short verify default path', () => {
  const input = te.encode('id57-short-verify-default');
  const out = id57ShortGenerateDefault(input);
  assert.equal(id57ShortVerifyDefault(input, out), true);
  assert.equal(id57ShortVerifyDefault(te.encode('different'), out), false);
});

test('id57-short invalid hash function is rejected', () => {
  assert.throws(
    () => id57ShortGenerate(te.encode('id57-short-invalid-hash'), 'unsupported', ID57ShortLength.LEN_47),
    (err) => err instanceof B57Error && err.code === ErrorCode.INVALID_HASH_FUNCTION
  );
});
