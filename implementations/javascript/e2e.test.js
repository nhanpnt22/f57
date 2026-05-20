import test from 'node:test';
import assert from 'node:assert/strict';
import { encode, decode } from './b57.js';
import { H57Length, h57Hash, h57Verify } from './h57.js';
import { ID57Length, id57Generate, id57Verify } from './id57.js';
import { ID57ShortLength, id57ShortGenerate, id57ShortVerify } from './id57_short.js';

const te = new TextEncoder();

test('e2e b57-h57-id57-id57short pipelines', () => {
  const inputs = [
    te.encode(''),
    te.encode('abc'),
    te.encode('b57-e2e'),
    new Uint8Array([0x80, 1, 2, 3, 4, 5])
  ];

  for (const input of inputs) {
    const b57 = encode(input);
    assert.deepEqual(Array.from(decode(b57)), Array.from(input));

    const h57 = h57Hash(input, H57Length.LEN_128);
    assert.equal(h57Verify(input, h57, H57Length.LEN_128), true);

    const id57 = id57Generate(input, ID57Length.LEN_128);
    assert.equal(id57Verify(input, id57, ID57Length.LEN_128), true);

    const short = id57ShortGenerate(input, ID57ShortLength.LEN_47);
    assert.equal(id57ShortVerify(input, short, ID57ShortLength.LEN_47), true);
  }
});
