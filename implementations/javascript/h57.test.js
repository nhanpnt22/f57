import test from 'node:test';
import assert from 'node:assert/strict';
import {
  H57Length,
  h57Hash,
  h57IsCanonical,
  h57IsValid,
  h57Verify,
  
  } from './h57.js';
import { B57Error, ErrorCode } from './errors.js';

const te = new TextEncoder();

test('h57 deterministic output', () => {
  const input = te.encode('h57-deterministic');
  const a = h57Hash(input, H57Length.LEN_256);
  const b = h57Hash(input, H57Length.LEN_256);
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
    const out = h57Hash(input, len);
    assert.equal(h57IsValid(out), true);
    assert.equal(h57IsCanonical(out), true);
    assert.equal(h57Verify(input, out, len), true);
  }
});








