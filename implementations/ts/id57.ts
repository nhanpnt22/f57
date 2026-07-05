import { decode, encode, encodedLength, isCanonical, isValid } from './b57.js';
import { computeHashBLAKE3XOF } from './h57.js';
import { newInvalidLengthEnumError } from './errors.js';

type ByteInput = Uint8Array | Buffer | ArrayBuffer;

export const ID57Length = Object.freeze({
  DEFAULT: 0,
  // Positive values: bit lengths (security model, variable width within [min,max]).
  LEN_8: 8, LEN_16: 16, LEN_32: 32, LEN_64: 64,
  LEN_128: 128, LEN_256: 256, LEN_512: 512,
  // Negative values: fixed character widths (non-security).
  // Magnitude = exact output width; generated as a prefix cut of LEN_128.
  FIXED_2: -2, FIXED_3: -3, FIXED_4: -4, FIXED_5: -5, FIXED_6: -6,
  FIXED_7: -7, FIXED_8: -8, FIXED_10: -10, FIXED_11: -11, FIXED_12: -12
});

export const id57BitsByLength: Map<number, number> = new Map([
  [ID57Length.LEN_8, 8], [ID57Length.LEN_16, 16], [ID57Length.LEN_32, 32],
  [ID57Length.LEN_64, 64], [ID57Length.LEN_128, 128],
  [ID57Length.LEN_256, 256], [ID57Length.LEN_512, 512]
]);

const id57FixedWidths: Set<number> = new Set([2, 3, 4, 5, 6, 7, 8, 10, 11, 12]);

export function resolveID57Length(length: number) {
  if (length === ID57Length.DEFAULT) return ID57Length.LEN_128;
  if (length < 0) {
    if (!id57FixedWidths.has(-length)) throw newInvalidLengthEnumError(length);
    return length;
  }
  if (!id57BitsByLength.has(length)) throw newInvalidLengthEnumError(length);
  return length;
}

export function maskExcessBits(bytes: Uint8Array, bitLength: number) {
  if (bytes.length === 0) return;
  const excessBits = bytes.length * 8 - bitLength;
  if (excessBits <= 0) return;
  const mask = (0xff << excessBits) & 0xff;
  bytes[bytes.length - 1] &= mask;
}

export function id57Generate(input: ByteInput, length: number = ID57Length.DEFAULT): string {
  const effectiveLength = resolveID57Length(length);

  if (effectiveLength < 0) {
    // Fixed width: prefix cut of the LEN_128 identifier (spec 5.2).
    // LEN_128 output is always >= 16 chars and k <= 12, so the cut is always exact.
    const full = id57Generate(input, ID57Length.LEN_128);
    return full.slice(0, -effectiveLength);
  }

  const bits = id57BitsByLength.get(effectiveLength);
  const requestedBytes = Math.ceil(bits / 8);

  const hashBytes = computeHashBLAKE3XOF(input, requestedBytes);
  const effective = new Uint8Array(requestedBytes);
  effective.set(hashBytes.subarray(0, requestedBytes));
  maskExcessBits(effective, bits);

  return encode(effective);
}

export function id57GenerateDefault(input: ByteInput) {
  return id57Generate(input, ID57Length.DEFAULT);
}

export function id57Verify(input: ByteInput, id57String: string, length: number = ID57Length.DEFAULT) {
  try {
    return id57Generate(input, length) === id57String;
  } catch {
    return false;
  }
}

export function id57VerifyDefault(input: ByteInput, id57String: string) {
  return id57Verify(input, id57String, ID57Length.DEFAULT);
}

export function id57IsValid(id57String: string) {
  return isValid(id57String);
}

export function id57IsCanonical(id57String: string) {
  return isCanonical(id57String);
}

export function id57Range(length: number = ID57Length.DEFAULT) {
  const effectiveLength = resolveID57Length(length);

  if (effectiveLength < 0) {
    // Fixed width: min == max == k (spec 11.4).
    const k = -effectiveLength;
    return { min: k, max: k };
  }

  const bits = id57BitsByLength.get(effectiveLength);
  const byteLength = Math.ceil(bits / 8);
  return { min: byteLength, max: encodedLength(byteLength) };
}

export function id57IsLength(id57String: string, length: number = ID57Length.DEFAULT) {
  const effectiveLength = resolveID57Length(length);

  if (effectiveLength < 0) {
    // Fixed-width outputs are bignum prefixes, NOT canonical B57 (spec 11.5):
    // validate exact width + alphabet only, never decode.
    return id57String.length === -effectiveLength && isValid(id57String);
  }

  const bits = id57BitsByLength.get(effectiveLength);
  const byteLength = Math.ceil(bits / 8);
  const { min, max } = id57Range(length);

  if (id57String.length < min || id57String.length > max) return false;
  if (!isCanonical(id57String)) return false;

  const decoded = decode(id57String);
  if (decoded.length !== byteLength) return false;

  const excessBits = byteLength * 8 - bits;
  if (excessBits > 0) {
    const mask = (1 << excessBits) - 1;
    if ((decoded[byteLength - 1] & mask) !== 0) return false;
  }

  return true;
}
