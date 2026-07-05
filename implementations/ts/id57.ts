import { decode, encode, encodedLength, isCanonical, isValid } from './b57.js';
import { computeHashBLAKE3XOF } from './h57.js';
import { newInvalidLengthEnumError } from './errors.js';

type ByteInput = Uint8Array | Buffer | ArrayBuffer;

export const ID57Length = Object.freeze({
  DEFAULT: 0,
  LEN_8: 8, LEN_16: 16, LEN_23: 23, LEN_29: 29, LEN_32: 32, LEN_47: 47,
  LEN_64: 64, LEN_70: 70, LEN_93: 93, LEN_128: 128, LEN_186: 186,
  LEN_256: 256, LEN_373: 373, LEN_512: 512
});

export const id57BitsByLength: Map<number, number> = new Map([
  [ID57Length.LEN_8, 8], [ID57Length.LEN_16, 16], [ID57Length.LEN_23, 23], [ID57Length.LEN_29, 29],
  [ID57Length.LEN_32, 32], [ID57Length.LEN_47, 47], [ID57Length.LEN_64, 64], [ID57Length.LEN_70, 70],
  [ID57Length.LEN_93, 93], [ID57Length.LEN_128, 128], [ID57Length.LEN_186, 186],
  [ID57Length.LEN_256, 256], [ID57Length.LEN_373, 373], [ID57Length.LEN_512, 512]
]);

export function resolveID57Length(length: number) {
  if (length === ID57Length.DEFAULT) return ID57Length.LEN_128;
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

export function id57Generate(input: ByteInput, length: number = ID57Length.DEFAULT) {
  const effectiveLength = resolveID57Length(length);
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
  const bits = id57BitsByLength.get(effectiveLength);
  const byteLength = Math.ceil(bits / 8);
  return { min: byteLength, max: encodedLength(byteLength) };
}

export function id57IsLength(id57String: string, length: number = ID57Length.DEFAULT) {
  const effectiveLength = resolveID57Length(length);
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
