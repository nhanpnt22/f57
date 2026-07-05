import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ID57Length,

  id57Generate,
  id57GenerateDefault,
  id57IsCanonical,
  id57IsLength,
  id57IsValid,
  id57Range,
  id57Verify,
  id57VerifyDefault,
  maskExcessBits,
  resolveID57Length
} from './id57.js';
import { } from './h57.js';
import { encode } from './b57.js';
import { B57Error, ErrorCode } from './errors.js';

const te = new TextEncoder();

test('id57 deterministic output', () => {
  const input = te.encode('id57-deterministic');
  const a = id57Generate(input, ID57Length.LEN_256);
  const b = id57Generate(input, ID57Length.LEN_256);
  assert.equal(a, b);
});

test('id57 default uses LEN_128 baseline', () => {
  const input = te.encode('id57-default');
  const out = id57GenerateDefault(input);
  const { min, max } = id57Range(ID57Length.LEN_128);
  assert.ok(out.length >= min && out.length <= max);
});

test('id57 one-way output differs from raw encode', () => {
  const input = te.encode('id57-one-way');
  const out = id57Generate(input, ID57Length.LEN_128);
  assert.notEqual(out, encode(input));
});

test('id57 all bit-length enums with BLAKE3', () => {
  const input = te.encode('id57-length-enums');
  const lengths = [
    ID57Length.LEN_8,
    ID57Length.LEN_16,
    ID57Length.LEN_32,
    ID57Length.LEN_64,
    ID57Length.LEN_128,
    ID57Length.LEN_256,
    ID57Length.LEN_512,
    ID57Length.DEFAULT
  ];

  for (const len of lengths) {
    const out = id57Generate(input, len);
    assert.equal(id57IsValid(out), true);
    assert.equal(id57IsCanonical(out), true);
    assert.equal(id57Verify(input, out, len), true);

    const effectiveLen = len === ID57Length.DEFAULT ? ID57Length.LEN_128 : len;
    const { min, max } = id57Range(effectiveLen);
    assert.ok(out.length >= min && out.length <= max);
    assert.equal(id57IsLength(out, effectiveLen), true);
  }
});

test('id57 all fixed-width enums with BLAKE3', () => {
  const input = te.encode('id57-fixed-length-enums');
  const widths = [
    ID57Length.FIXED_2, ID57Length.FIXED_3, ID57Length.FIXED_4, ID57Length.FIXED_5,
    ID57Length.FIXED_6, ID57Length.FIXED_7, ID57Length.FIXED_8,
    ID57Length.FIXED_10, ID57Length.FIXED_11, ID57Length.FIXED_12
  ];

  for (const len of widths) {
    const out = id57Generate(input, len);
    const k = -len;

    assert.equal(out.length, k);
    assert.equal(id57IsValid(out), true);
    assert.equal(id57Verify(input, out, len), true);
    assert.deepEqual(id57Range(len), { min: k, max: k });
    assert.equal(id57IsLength(out, len), true);
  }
});

test('id57Range returns min/max char bounds for bit lengths, fixed (k,k) for widths', () => {
  assert.deepEqual(id57Range(ID57Length.LEN_8), { min: 1, max: 2 });
  assert.deepEqual(id57Range(ID57Length.LEN_32), { min: 4, max: 6 });
  assert.deepEqual(id57Range(ID57Length.LEN_128), { min: 16, max: 22 });
  assert.deepEqual(id57Range(ID57Length.FIXED_4), { min: 4, max: 4 });
  assert.deepEqual(id57Range(ID57Length.FIXED_8), { min: 8, max: 8 });
  assert.deepEqual(id57Range(ID57Length.FIXED_12), { min: 12, max: 12 });
});

test('fixed-width id57 is a prefix cut of the LEN_128 output', () => {
  const input = te.encode('id57-fixed-cut-invariant');
  const full = id57Generate(input, ID57Length.LEN_128);

  assert.equal(id57Generate(input, ID57Length.FIXED_8), full.slice(0, 8));
  assert.equal(id57Generate(input, ID57Length.FIXED_4), full.slice(0, 4));
  // Nesting: a shorter fixed width is a prefix of a longer one for the same input.
  assert.equal(
    id57Generate(input, ID57Length.FIXED_8).startsWith(id57Generate(input, ID57Length.FIXED_4)),
    true
  );
});

test('id57IsLength on fixed widths validates exact width + alphabet, not canonical form', () => {
  // Fixed-width outputs are bignum prefixes, not canonical B57 - id57IsLength MUST NOT decode them.
  assert.equal(id57IsLength('AAAA', ID57Length.FIXED_4), true);
  assert.equal(id57IsLength('AAA', ID57Length.FIXED_4), false);
  assert.equal(id57IsLength('AAAAA', ID57Length.FIXED_4), false);
  assert.equal(id57IsLength('!!!!', ID57Length.FIXED_4), false);
});

test('id57IsLength rejects bit-length strings outside the valid range or non-canonical form', () => {
  const input = te.encode('id57-is-length');
  const out = id57Generate(input, ID57Length.LEN_32);

  assert.equal(id57IsLength(out, ID57Length.LEN_32), true);
  assert.equal(id57IsLength(out.slice(0, 1), ID57Length.LEN_32), false);
  assert.equal(id57IsLength(out + out, ID57Length.LEN_32), false);
  assert.equal(id57IsLength('!!!', ID57Length.LEN_32), false);
});

test('id57 rejects the omitted FIXED_9 and unknown fixed widths', () => {
  assert.throws(
    () => id57Generate(te.encode('id57-fixed9'), -9),
    (err) => err instanceof B57Error && err.code === ErrorCode.INVALID_LENGTH_ENUM
  );
});

test('id57 invalid length enum is rejected', () => {
  assert.throws(
    () => id57Generate(te.encode('id57-invalid-len'), 77777),
    (err) => err instanceof B57Error && err.code === ErrorCode.INVALID_LENGTH_ENUM
  );
});



test('id57 verify default works', () => {
  const input = te.encode('id57-verify-default');
  const out = id57GenerateDefault(input);
  assert.equal(id57VerifyDefault(input, out), true);
  assert.equal(id57VerifyDefault(te.encode('different'), out), false);
});


