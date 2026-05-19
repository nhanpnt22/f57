import {
  ID57Length,
  id57Generate,
  id57GenerateDefault,
  id57IsCanonical,
  id57IsValid,
  id57Verify,
  id57VerifyDefault
} from './id57.js';
import { HashFunction } from './h57.js';
import { newInvalidLengthEnumError } from './errors.js';

export const ID57ShortLength = Object.freeze({
  DEFAULT: 0,
  LEN_23: 23,
  LEN_29: 29,
  LEN_32: 32,
  LEN_47: 47,
  LEN_70: 70
});

const id57ShortToID57Length = new Map([
  [ID57ShortLength.LEN_23, ID57Length.LEN_23],
  [ID57ShortLength.LEN_29, ID57Length.LEN_29],
  [ID57ShortLength.LEN_32, ID57Length.LEN_32],
  [ID57ShortLength.LEN_47, ID57Length.LEN_47],
  [ID57ShortLength.LEN_70, ID57Length.LEN_70]
]);

export function resolveID57ShortLength(length) {
  if (length === ID57ShortLength.DEFAULT) {
    return ID57Length.LEN_47;
  }
  const effective = id57ShortToID57Length.get(length);
  if (!effective) {
    throw newInvalidLengthEnumError(length);
  }
  return effective;
}

export function id57ShortGenerate(input, hashFn, length) {
  const effective = resolveID57ShortLength(length);
  return id57Generate(input, hashFn, effective);
}

export function id57ShortGenerateDefault(input) {
  return id57ShortGenerate(input, HashFunction.BLAKE3, ID57ShortLength.DEFAULT);
}

export function id57ShortVerify(input, hashFn, id57String, length) {
  try {
    return id57ShortGenerate(input, hashFn, length) === id57String;
  } catch {
    return false;
  }
}

export function id57ShortVerifyDefault(input, id57String) {
  return id57ShortVerify(input, HashFunction.BLAKE3, id57String, ID57ShortLength.DEFAULT);
}

export function id57ShortIsValid(id57String) {
  return id57IsValid(id57String);
}

export function id57ShortIsCanonical(id57String) {
  return id57IsCanonical(id57String);
}

export {
  id57GenerateDefault,
  id57Verify,
  id57VerifyDefault
};
