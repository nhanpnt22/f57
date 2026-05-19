import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  i57Encode,
  i57Decode,
  i57Hash,
  i57Random,
  i57Id,
  i57IsValid,
  i57IsCanonical,
  i57ValidateIdentifier,
  i57ValidateEntropy
} from './i57.js';
import { R57Mode } from './r57.js';

test('i57Encode and i57Decode', () => {
  const input = new Uint8Array([1, 2, 3]);
  const enc = i57Encode(input);
  assert.equal(typeof enc, 'string');
  const dec = i57Decode(enc);
  assert.deepEqual(Array.from(dec), Array.from(input));
});

test('i57Hash', () => {
  const input = new Uint8Array([1, 2, 3]);
  const res = i57Hash(input, 'blake3', 47);
  assert.equal(typeof res, 'string');
});

test('i57Random', () => {
  const res = i57Random(R57Mode.R57_1_CSPRNG);
  assert.equal(typeof res, 'string');
});

test('i57Id', () => {
  const input = new Uint8Array([1, 2, 3]);
  const res = i57Id(input, 'blake3', 47);
  assert.equal(typeof res, 'string');
});

test('i57IsValid', () => {
  assert.equal(i57IsValid('222'), true);
  assert.equal(i57IsValid('O'), false);
  assert.equal(i57IsValid(''), false);
});

test('i57IsCanonical', () => {
  assert.equal(i57IsCanonical('222'), true);
  assert.equal(i57IsCanonical('O'), false);
  assert.equal(i57IsCanonical(''), false);
});

test('i57ValidateIdentifier', () => {
  const id = i57Random(R57Mode.R57_1_CSPRNG);
  assert.equal(i57ValidateIdentifier(id), true);
  assert.equal(i57ValidateIdentifier('short'), false);
  assert.equal(i57ValidateIdentifier('12345678901234567890 0'), false);
});

test('i57ValidateEntropy', () => {
  const id = i57Random(R57Mode.R57_1_CSPRNG);
  assert.equal(i57ValidateEntropy(id), true);
  assert.equal(i57ValidateEntropy('AAAAAAAAAAAAAAAAAAAAAA'), false);
  assert.equal(i57ValidateEntropy('ABABABABABABABABABABAB'), false);
});

