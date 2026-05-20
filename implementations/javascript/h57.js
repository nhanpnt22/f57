import { blake3 } from '@noble/hashes/blake3';
import { encode, isValid, isCanonical } from './b57.js';
import { newEntropyExceededError, newInvalidLengthEnumError } from './errors.js';

export const H57Length = Object.freeze({
  HASH_AUTO: -1,
  LEN_8: 8,
  LEN_16: 16,
  LEN_23: 23,
  LEN_29: 29,
  LEN_32: 32,
  LEN_47: 47,
  LEN_64: 64,
  LEN_70: 70,
  LEN_93: 93,
  LEN_128: 128,
  LEN_186: 186,
  LEN_256: 256,
  LEN_373: 373,
  LEN_512: 512,
  HASH_256: 10256,
  HASH_512: 10512
});

export const h57BitsByLength = new Map([
  [H57Length.LEN_8, 8],
  [H57Length.LEN_16, 16],
  [H57Length.LEN_23, 23],
  [H57Length.LEN_29, 29],
  [H57Length.LEN_32, 32],
  [H57Length.LEN_47, 47],
  [H57Length.LEN_64, 64],
  [H57Length.LEN_70, 70],
  [H57Length.LEN_93, 93],
  [H57Length.LEN_128, 128],
  [H57Length.LEN_186, 186],
  [H57Length.LEN_256, 256],
  [H57Length.LEN_373, 373],
  [H57Length.LEN_512, 512],
  [H57Length.HASH_256, 256],
  [H57Length.HASH_512, 512]
]);

function toBytes(input) {
  if (input instanceof Uint8Array) {
    return input;
  }
  if (Buffer.isBuffer(input)) {
    return new Uint8Array(input);
  }
  if (input instanceof ArrayBuffer) {
    return new Uint8Array(input);
  }
  throw new TypeError('input must be Uint8Array, Buffer, or ArrayBuffer');
}

export function computeHashBLAKE3XOF(input, outputLen) {
  if (outputLen <= 0) {
    return new Uint8Array(0);
  }
  return blake3(toBytes(input), { dkLen: outputLen });
}

export function h57Hash(input, length = H57Length.HASH_AUTO) {
  let hashBytes;
  if (length === H57Length.HASH_AUTO) {
    hashBytes = blake3(toBytes(input), { dkLen: 32 });
  } else {
    const bits = h57BitsByLength.get(length);
    if (!bits) {
      throw newInvalidLengthEnumError(length);
    }
    const requestedBytes = Math.ceil(bits / 8);
    hashBytes = computeHashBLAKE3XOF(input, requestedBytes);
  }
  return encode(hashBytes);
}

export function h57Verify(input, h57String, length = H57Length.HASH_AUTO) {
  try {
    return h57Hash(input, length) === h57String;
  } catch {
    return false;
  }
}

export function h57IsValid(h57String) {
  return isValid(h57String);
}

export function h57IsCanonical(h57String) {
  return isCanonical(h57String);
}
