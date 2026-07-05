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

test('id57Range returns min/max char bounds derived from byte length', () => {
  assert.deepEqual(id57Range(ID57Length.LEN_8), { min: 1, max: 2 });
  assert.deepEqual(id57Range(ID57Length.LEN_23), { min: 3, max: 5 });
  assert.deepEqual(id57Range(ID57Length.LEN_29), { min: 4, max: 6 });
  assert.deepEqual(id57Range(ID57Length.LEN_32), { min: 4, max: 6 });
  assert.deepEqual(id57Range(ID57Length.LEN_47), { min: 6, max: 9 });
  assert.deepEqual(id57Range(ID57Length.LEN_128), { min: 16, max: 22 });
});

test('id57IsLength rejects strings outside the valid range or non-canonical form', () => {
  const input = te.encode('id57-is-length');
  const out = id57Generate(input, ID57Length.LEN_47);

  assert.equal(id57IsLength(out, ID57Length.LEN_47), true);
  assert.equal(id57IsLength(out.slice(0, 1), ID57Length.LEN_47), false);
  assert.equal(id57IsLength(out + out, ID57Length.LEN_47), false);
  assert.equal(id57IsLength('!!!', ID57Length.LEN_47), false);
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


