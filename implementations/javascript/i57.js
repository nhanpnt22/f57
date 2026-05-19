import { encode, decode, isValid, isCanonical } from './b57.js';
import { h57Hash } from './h57.js';
import { id57Generate } from './id57.js';
import { r57Generate } from './r57.js';

/**
 * i57Encode wraps b57 encode.
 * @param {Uint8Array} input
 * @returns {string}
 */
export function i57Encode(input) {
  return encode(input);
}

/**
 * i57Decode wraps b57 decode.
 * @param {string} s
 * @returns {Uint8Array}
 */
export function i57Decode(s) {
  return decode(s);
}

/**
 * i57Hash wraps h57Hash.
 * @param {Uint8Array} input
 * @param {string} hashFn
 * @param {number} length
 * @returns {string}
 */
export function i57Hash(input, hashFn, length) {
  return h57Hash(input, hashFn, length);
}

/**
 * i57Random wraps r57Generate.
 * @param {number} mode
 * @returns {string}
 */
export function i57Random(mode) {
  return r57Generate(mode);
}

/**
 * i57Id wraps id57Generate.
 * @param {Uint8Array} input
 * @param {string} hashFn
 * @param {number} length
 * @returns {string}
 */
export function i57Id(input, hashFn, length) {
  return id57Generate(input, hashFn, length);
}

/**
 * i57IsValid checks if a string is a valid B57 value under integration-layer rules.
 * The integration layer rejects empty strings by default.
 * @param {string} s
 * @returns {boolean}
 */
export function i57IsValid(s) {
  if (typeof s !== 'string' || s.length === 0) {
    return false;
  }
  return isValid(s);
}

/**
 * i57IsCanonical checks if a string is canonically encoded in B57.
 * The integration layer rejects empty strings by default.
 * @param {string} s
 * @returns {boolean}
 */
export function i57IsCanonical(s) {
  if (typeof s !== 'string' || s.length === 0) {
    return false;
  }
  return isCanonical(s);
}

/**
 * Validates canonical 22-char integration identifiers.
 * @param {string} s
 * @returns {boolean}
 */
export function i57ValidateIdentifier(s) {
  if (typeof s !== 'string' || s.length !== 22) {
    return false;
  }
  return i57IsValid(s) && i57IsCanonical(s);
}

/**
 * Heuristic entropy check for obvious low-entropy patterns.
 * Not for security decisions.
 * @param {string} s
 * @returns {boolean}
 */
export function i57ValidateEntropy(s) {
  if (!i57ValidateIdentifier(s)) {
    return false;
  }
  if (!passesCharacterDiversity(s)) {
    return false;
  }
  if (hasRepeatedHalfPattern(s)) {
    return false;
  }
  return !isSingleRepeatedPattern(s.toLowerCase());
}

function passesCharacterDiversity(s) {
  const unique = new Set();

  for (const ch of s) {
    unique.add(ch);
  }

  const maxRun = longestRunLength(s);

  if (unique.size < 4) {
    return false;
  }
  return maxRun <= Math.floor(s.length / 2);
}

function longestRunLength(s) {
  if (!s) {
    return 0;
  }

  const runs = s.match(/(.)\1*/g) ?? [];
  return Math.max(0, ...runs.map((run) => run.length));
}

function hasRepeatedHalfPattern(s) {
  if (s.length % 2 !== 0) {
    return false;
  }
  const half = s.length / 2;
  return s.slice(0, half) === s.slice(half);
}

function isSingleRepeatedPattern(s) {
  if (!s) {
    return false;
  }
  return s === s[0].repeat(s.length);
}
