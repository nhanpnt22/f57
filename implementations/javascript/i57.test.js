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
import { ID57Length, id57Generate } from './id57.js';
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
  const res = i57Hash(input, 47);
  assert.equal(typeof res, 'string');
});

test('i57Random', () => {
  const res = i57Random(R57Mode.R57_1_CSPRNG);
  assert.equal(typeof res, 'string');
});

test('i57Id', () => {
  const input = new Uint8Array([1, 2, 3]);
  const res = i57Id(input, ID57Length.LEN_32);
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

test('i57ValidateIdentifier default (bit-length/DEFAULT branch)', () => {
  const id = i57Random(R57Mode.R57_1_CSPRNG);
  assert.equal(i57ValidateIdentifier(id), true);
  assert.equal(i57ValidateIdentifier('short'), false);
  assert.equal(i57ValidateIdentifier('12345678901234567890 0'), false);
});

test('i57ValidateIdentifier bit-length branch: relaxed range check, not exact-22', () => {
  const input = new Uint8Array([9, 8, 7, 6, 5]);
  const id128 = id57Generate(input, ID57Length.LEN_128);

  assert.equal(i57ValidateIdentifier(id128, ID57Length.LEN_128), true);
  assert.equal(i57ValidateIdentifier(id128, ID57Length.DEFAULT), true);

  // A corrupted/truncated bit-length identifier must fail (well below min_chars).
  assert.equal(i57ValidateIdentifier(id128.slice(0, 5), ID57Length.LEN_128), false);
  // A corrupted/extended identifier must fail (well above max_chars).
  assert.equal(i57ValidateIdentifier(`${id128}${'A'.repeat(30)}`, ID57Length.LEN_128), false);

  const id256 = id57Generate(input, ID57Length.LEN_256);
  assert.equal(i57ValidateIdentifier(id256, ID57Length.LEN_256), true);
  // Wrong length_enum for the actual byte length must fail.
  assert.equal(i57ValidateIdentifier(id256, ID57Length.LEN_128), false);
});

test('i57ValidateIdentifier fixed-width branch delegates to id57IsLength', () => {
  const input = new Uint8Array([1, 2, 3, 4]);
  const fixed8 = id57Generate(input, ID57Length.FIXED_8);

  assert.equal(i57ValidateIdentifier(fixed8, ID57Length.FIXED_8), true);
  // Wrong fixed width must fail.
  assert.equal(i57ValidateIdentifier(fixed8, ID57Length.FIXED_9), false);
  // A truncated/corrupted fixed-width string (wrong width) must fail.
  assert.equal(i57ValidateIdentifier(fixed8.slice(0, -1), ID57Length.FIXED_8), false);
});

test('i57ValidateEntropy', () => {
  const id = i57Random(R57Mode.R57_1_CSPRNG);
  assert.equal(i57ValidateEntropy(id), true);
  assert.equal(i57ValidateEntropy('AAAAAAAAAAAAAAAAAAAAAA'), false);
  assert.equal(i57ValidateEntropy('ABABABABABABABABABABAB'), false);
});
