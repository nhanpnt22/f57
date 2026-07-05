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
import { encode } from './b57.js';
import { B57Error, ErrorCode } from './errors.js';

const te = new TextEncoder();

const BIT_LENGTHS = [
  ID57Length.LEN_8,
  ID57Length.LEN_16,
  ID57Length.LEN_32,
  ID57Length.LEN_64,
  ID57Length.LEN_128,
  ID57Length.LEN_256,
  ID57Length.LEN_512,
  ID57Length.DEFAULT
];

const FIXED_LENGTHS = [
  ID57Length.FIXED_2,
  ID57Length.FIXED_3,
  ID57Length.FIXED_4,
  ID57Length.FIXED_5,
  ID57Length.FIXED_6,
  ID57Length.FIXED_7,
  ID57Length.FIXED_8,
  ID57Length.FIXED_9,
  ID57Length.FIXED_10,
  ID57Length.FIXED_11,
  ID57Length.FIXED_12
];

test('id57 deterministic output', () => {
  const input = te.encode('id57-deterministic');
  const a = id57Generate(input, ID57Length.LEN_256);
  const b = id57Generate(input, ID57Length.LEN_256);
  assert.equal(a, b);
});

test('id57 default uses LEN_128 baseline', () => {
  const input = te.encode('id57-default');
  const out = id57GenerateDefault(input);
  assert.ok(out.length >= 16 && out.length <= 22);
});

test('id57 one-way output differs from raw encode', () => {
  const input = te.encode('id57-one-way');
  const out = id57Generate(input, ID57Length.LEN_128);
  assert.notEqual(out, encode(input));
});

test('id57 all bit lengths generate/verify within range and reject id57IsLength', () => {
  const input = te.encode('id57-length-enums');

  for (const len of BIT_LENGTHS) {
    const out = id57Generate(input, len);
    assert.equal(id57IsValid(out), true);
    assert.equal(id57IsCanonical(out), true);
    assert.equal(id57Verify(input, out, len), true);

    const { min, max } = id57Range(len);
    assert.ok(out.length >= min && out.length <= max, `length ${out.length} not within [${min}, ${max}] for ${len}`);

    // id57IsLength is defined ONLY for fixed widths; bit lengths (and
    // DEFAULT) MUST throw INVALID_LENGTH_ENUM (spec 11.5).
    assert.throws(
      () => id57IsLength(out, len),
      (err) => err instanceof B57Error && err.code === ErrorCode.INVALID_LENGTH_ENUM
    );
  }
});

test('id57 bit-length id57Range bounds match spec 7.1', () => {
  assert.deepEqual(id57Range(ID57Length.LEN_8), { min: 1, max: 2 });
  assert.deepEqual(id57Range(ID57Length.LEN_16), { min: 2, max: 3 });
  assert.deepEqual(id57Range(ID57Length.LEN_32), { min: 4, max: 6 });
  assert.deepEqual(id57Range(ID57Length.LEN_64), { min: 8, max: 11 });
  assert.deepEqual(id57Range(ID57Length.LEN_128), { min: 16, max: 22 });
  assert.deepEqual(id57Range(ID57Length.LEN_256), { min: 32, max: 44 });
  assert.deepEqual(id57Range(ID57Length.LEN_512), { min: 64, max: 88 });
  assert.deepEqual(id57Range(ID57Length.DEFAULT), id57Range(ID57Length.LEN_128));
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

test('id57 all fixed widths generate exactly k chars and verify id57IsLength', () => {
  const input = te.encode('id57-fixed-widths');

  for (const len of FIXED_LENGTHS) {
    const k = -len;
    const out = id57Generate(input, len);
    assert.equal(out.length, k);
    assert.deepEqual(id57Range(len), { min: k, max: k });
    assert.equal(id57IsLength(out, len), true);
    assert.equal(id57Verify(input, out, len), true);
  }
});

test('id57 fixed width -9 (FIXED_9) is valid; -13/-1 and other out-of-range negatives throw', () => {
  const input = te.encode('id57-fixed-9-and-invalid');

  // FIXED_9 was completed in spec v0.3.1 - it must NOT be treated as invalid.
  const out = id57Generate(input, ID57Length.FIXED_9);
  assert.equal(out.length, 9);
  assert.equal(id57IsLength(out, ID57Length.FIXED_9), true);

  for (const bad of [-13, -1, -100, -0.5]) {
    assert.throws(
      () => id57Generate(input, bad),
      (err) => err instanceof B57Error && err.code === ErrorCode.INVALID_LENGTH_ENUM
    );
    assert.throws(
      () => resolveID57Length(bad),
      (err) => err instanceof B57Error && err.code === ErrorCode.INVALID_LENGTH_ENUM
    );
  }
});

test('id57 fixed-width cut invariant: FIXED_k output is a prefix of LEN_128 output', () => {
  const input = te.encode('id57-cut-invariant');
  const full = id57Generate(input, ID57Length.LEN_128);

  assert.equal(id57Generate(input, ID57Length.FIXED_8), full.slice(0, 8));

  for (const len of FIXED_LENGTHS) {
    const k = -len;
    assert.equal(id57Generate(input, len), full.slice(0, k));
  }
});

test('id57 fixed widths are nested prefixes of each other (FIXED_j is a prefix of FIXED_k for j < k)', () => {
  const input = te.encode('id57-nested-prefixes');
  const outputs = FIXED_LENGTHS.map((len) => ({ k: -len, out: id57Generate(input, len) }));

  for (const a of outputs) {
    for (const b of outputs) {
      if (a.k < b.k) {
        assert.equal(b.out.slice(0, a.k), a.out, `FIXED_${a.k} should be a prefix of FIXED_${b.k}`);
      }
    }
  }
});

test('id57IsLength checks BOTH width and alphabet independently', () => {
  // Correct length, but invalid B57 characters (e.g. contains '0','O','I','l', or space)
  // must fail even though the length matches.
  assert.equal(id57IsLength('000O', ID57Length.FIXED_4), false);
  assert.equal(id57IsLength('AB O', ID57Length.FIXED_4), false);

  // Valid B57 alphabet but wrong length must fail even though characters are fine.
  assert.equal(id57IsLength('AAA', ID57Length.FIXED_4), false);
  assert.equal(id57IsLength('AAAAA', ID57Length.FIXED_4), false);

  // A literal string composed purely of valid B57 characters, of the exact
  // width, validates true WITHOUT being decoded/canonicalized as B57 - proving
  // id57IsLength does not attempt to decode fixed-width (non-canonical
  // bignum-prefix) strings.
  assert.equal(id57IsLength('AAAA', ID57Length.FIXED_4), true);
});

test('id57IsLength throws for positive/DEFAULT length_enum values', () => {
  for (const len of BIT_LENGTHS) {
    assert.throws(
      () => id57IsLength('AAAA', len),
      (err) => err instanceof B57Error && err.code === ErrorCode.INVALID_LENGTH_ENUM
    );
  }
});

test('maskExcessBits still masks trailing bits for bit-length mode', () => {
  const bytes = new Uint8Array([0xff, 0xff]);
  maskExcessBits(bytes, 12);
  assert.equal(bytes[0], 0xff);
  assert.equal(bytes[1], 0xf0);
});
