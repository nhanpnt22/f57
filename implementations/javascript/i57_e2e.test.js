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

test('i57 encode and decode properly', () => {
  const data = new Uint8Array([0, 255, 128, 64]);
  const enc = i57Encode(data);
  assert.equal(i57IsValid(enc), true);
  assert.equal(i57IsCanonical(enc), true);
  const dec = i57Decode(enc);
  assert.deepEqual(Array.from(dec), Array.from(data));
});

test('i57 integration hash properly', () => {
  const data = new Uint8Array([0, 255, 128, 64]);
  const h = i57Hash(data, 'blake3', 47);
  assert.equal(i57IsValid(h), true);
});

test('i57 integration random properly', () => {
  const r = i57Random(R57Mode.R57_1_CSPRNG);
  assert.equal(i57IsValid(r), true);
  assert.equal(i57ValidateIdentifier(r), true);
  assert.equal(i57ValidateEntropy(r), true);
});

test('i57 integration ID properly', () => {
  const data = new Uint8Array([0, 255, 128, 64]);
  const id = i57Id(data, 'blake3', 47);
  assert.equal(i57IsValid(id), true);
});
