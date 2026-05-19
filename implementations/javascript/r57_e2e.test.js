import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { R57Mode, r57Generate } from './r57.js';

describe('R57 E2E Continuous Generation Loop', () => {
  it('runs 1000 generations smoothly maintaining 22-length chars', () => {
    for (let i = 0; i < 1000; i++) {
      const result = r57Generate(R57Mode.R57_1_CSPRNG);
      assert.strictEqual(result.length, 22);
    }
  });

  it('runs cross-mode generation loop', () => {
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
      assert.strictEqual(result.length, 22);
    }
  });
});
