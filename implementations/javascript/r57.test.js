import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { R57Mode, r57Generate, r57IsValid, r57IsCanonical } from './r57.js';
import { B57Error } from './errors.js';

describe('R57', () => {
  describe('R57Mode', () => {
    it('defines mode enum set', () => {
      assert.strictEqual(R57Mode.R57_1_CSPRNG, 1);
      assert.strictEqual(R57Mode.R57_8_HYBRID_ENTROPY, 8);
    });
  });

  describe('r57Generate', () => {
    it('generates a 22-character string when valid mode is provided', () => {
      const result = r57Generate(R57Mode.R57_1_CSPRNG);
      assert.strictEqual(typeof result, 'string');
      assert.strictEqual(result.length, 22);
      assert.strictEqual(r57IsValid(result), true);
      assert.strictEqual(r57IsCanonical(result), true);
    });

    it('supports all documented modes', () => {
      const modes = [
        R57Mode.R57_1_CSPRNG,
        R57Mode.R57_2_HASH_ENTROPY,
        R57Mode.R57_3_KDF_DERIVED,
        R57Mode.R57_4_COUNTER_KDF,
        R57Mode.R57_5_TIMESTAMP_KDF,
        R57Mode.R57_6_HARDWARE_RNG,
        R57Mode.R57_7_UUIDV4_COMPAT,
        R57Mode.R57_8_HYBRID_ENTROPY
      ];

      for (const mode of modes) {
        const result = r57Generate(mode);
        assert.strictEqual(typeof result, 'string');
        assert.strictEqual(result.length, 22);
        assert.strictEqual(r57IsValid(result), true);
      }
    });

    it('throws invalid mode error for unknown mode', () => {
      assert.throws(() => {
        r57Generate(999);
      }, (err) => err instanceof B57Error && err.message.includes('invalid r57 mode'));
    });

    it('generates unique values', () => {
      const r1 = r57Generate(R57Mode.R57_1_CSPRNG);
      const r2 = r57Generate(R57Mode.R57_1_CSPRNG);
      assert.notStrictEqual(r1, r2);
    });
  });

  describe('r57IsValid', () => {
    it('returns true for a valid generated R57 string', () => {
      const result = r57Generate(R57Mode.R57_1_CSPRNG);
      assert.strictEqual(r57IsValid(result), true);
    });

    it('returns false for non-string', () => {
      assert.strictEqual(r57IsValid(123), false);
      assert.strictEqual(r57IsValid(null), false);
      assert.strictEqual(r57IsValid(undefined), false);
    });

    it('returns false for incorrect length', () => {
      assert.strictEqual(r57IsValid('a'.repeat(21)), false);
      assert.strictEqual(r57IsValid('a'.repeat(23)), false);
    });

    it('returns false for invalid B57 characters', () => {
      assert.strictEqual(r57IsValid('a'.repeat(21) + '0'), false);
      assert.strictEqual(r57IsValid('a'.repeat(21) + 'O'), false);
      assert.strictEqual(r57IsValid('a'.repeat(21) + 'I'), false);
      assert.strictEqual(r57IsValid('a'.repeat(21) + 'l'), false);
    });
  });

  describe('r57IsCanonical', () => {
    it('returns true for a valid generated R57 string', () => {
      const result = r57Generate(R57Mode.R57_1_CSPRNG);
      assert.strictEqual(r57IsCanonical(result), true);
    });

    it('returns false for non-string', () => {
      assert.strictEqual(r57IsCanonical(123), false);
      assert.strictEqual(r57IsCanonical(null), false);
      assert.strictEqual(r57IsCanonical(undefined), false);
    });

    it('returns false for incorrect length', () => {
        assert.strictEqual(r57IsCanonical('2'.repeat(21)), false);
        assert.strictEqual(r57IsCanonical('2'.repeat(23)), false);
    });

    it('returns false for invalid B57 characters', () => {
      assert.strictEqual(r57IsCanonical('a'.repeat(21) + '0'), false);
    });
  });
});
