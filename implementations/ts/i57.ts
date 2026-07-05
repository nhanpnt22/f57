import { encode, decode, isValid, isCanonical } from './b57.js';
import { h57Hash, H57Length } from './h57.js';
import { id57Generate, id57Range, id57IsLength, id57BitsByLength, resolveID57Length, ID57Length } from './id57.js';
import { r57Generate } from './r57.js';

type ByteInput = Uint8Array | Buffer | ArrayBuffer;

export function i57Encode(input: ByteInput) { return encode(input); }
export function i57Decode(s: string) { return decode(s); }
export function i57Hash(input: ByteInput, length: number = H57Length.HASH_AUTO) { return h57Hash(input, length); }
export function i57Random(mode: number) { return r57Generate(mode); }
export function i57Id(input: ByteInput, length: number = ID57Length.DEFAULT) { return id57Generate(input, length); }

export function i57IsValid(s: string) {
  if (typeof s !== 'string' || s.length === 0) return false;
  return isValid(s);
}

export function i57IsCanonical(s: string) {
  if (typeof s !== 'string' || s.length === 0) return false;
  return isCanonical(s);
}

// length_enum's sign selects the check (mirrors id57_generate/id57_range/id57_is_length):
// fixed widths (negative) delegate to id57IsLength; bit lengths (positive/DEFAULT) validate
// via canonical decode + byte-length/mask check directly, since id57IsLength is fixed-only.
export function i57ValidateIdentifier(s: string, length: number = ID57Length.DEFAULT) {
  if (typeof s !== 'string' || s.length === 0) return false;

  const effectiveLength = resolveID57Length(length);

  if (effectiveLength < 0) {
    return id57IsLength(s, effectiveLength);
  }

  const bits = id57BitsByLength.get(effectiveLength);
  const byteLength = Math.ceil(bits / 8);
  const { min, max } = id57Range(effectiveLength);

  if (s.length < min || s.length > max) return false;
  if (!isCanonical(s)) return false;

  const decoded = decode(s);
  if (decoded.length !== byteLength) return false;

  const excessBits = byteLength * 8 - bits;
  if (excessBits > 0) {
    const mask = (1 << excessBits) - 1;
    if ((decoded[byteLength - 1] & mask) !== 0) return false;
  }

  return true;
}

export function i57ValidateEntropy(s: string) {
  if (!i57ValidateIdentifier(s)) return false;
  if (!passesCharacterDiversity(s)) return false;
  if (hasRepeatedHalfPattern(s)) return false;
  return !isSingleRepeatedPattern(s.toLowerCase());
}

function passesCharacterDiversity(s: string) {
  const unique = new Set();
  for (const ch of s) unique.add(ch);
  const maxRun = longestRunLength(s);
  if (unique.size < 4) return false;
  return maxRun <= Math.floor(s.length / 2);
}

function longestRunLength(s: string) {
  if (!s) return 0;
  const runs = s.match(/(.)\1*/g) ?? [];
  return Math.max(0, ...runs.map((run) => run.length));
}

function hasRepeatedHalfPattern(s: string) {
  if (s.length % 2 !== 0) return false;
  const half = s.length / 2;
  return s.slice(0, half) === s.slice(half);
}

function isSingleRepeatedPattern(s: string) {
  if (!s) return false;
  return s === s[0].repeat(s.length);
}
