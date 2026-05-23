import { encode, decode, isValid, isCanonical } from './b57.js';
import { h57Hash, H57Length } from './h57.js';
import { id57Generate, ID57Length } from './id57.js';
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

export function i57ValidateIdentifier(s: string) {
  if (typeof s !== 'string' || s.length !== 22) return false;
  return i57IsValid(s) && i57IsCanonical(s);
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
