import test from 'node:test';
import assert from 'node:assert/strict';
import { decode, encode, isCanonical, isValid, encodedLength, decodedLength } from './b57.js';
import { B57Error, ErrorCode } from './errors.js';

const te = new TextEncoder();

test('b57 encodes and decodes empty values', () => {
  assert.equal(encode(new Uint8Array()), '');
  assert.deepEqual(Array.from(decode('')), []);
});

test('b57 roundtrip and determinism', () => {
  const input = te.encode('b57-roundtrip-data');
  const a = encode(input);
  const b = encode(input);
  assert.equal(a, b);
  assert.deepEqual(Array.from(decode(a)), Array.from(input));
  assert.equal(isValid(a), true);
  assert.equal(isCanonical(a), true);
});

test('b57 rejects invalid characters', () => {
  assert.equal(isValid('ABC0'), false);
  assert.throws(
    () => decode('ABC0'),
    (err) => err instanceof B57Error && err.code === ErrorCode.INVALID_CHAR
  );
});

test('b57 checks helper length estimators', () => {
  assert.equal(encodedLength(0), 0);
  assert.equal(decodedLength(0), 0);
  assert.ok(encodedLength(32) > 0);
  assert.ok(decodedLength(44) > 0);
});

test('b57 preserves leading zeros', () => {
  const bytes = new Uint8Array([0, 0, 1, 2, 3]);
  const encoded = encode(bytes);
  const decoded = decode(encoded);
  assert.deepEqual(Array.from(decoded), Array.from(bytes));
});
