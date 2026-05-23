import {
  ID57Length, id57Generate, id57GenerateDefault,
  id57IsCanonical, id57IsValid, id57Verify, id57VerifyDefault
} from './id57.js';
import { newInvalidLengthEnumError } from './errors.js';

type ByteInput = Uint8Array | Buffer | ArrayBuffer;

export const ID57ShortLength = Object.freeze({
  DEFAULT: 0, LEN_23: 23, LEN_29: 29, LEN_32: 32, LEN_47: 47, LEN_70: 70
});

const id57ShortToID57Length: Map<number, number> = new Map([
  [ID57ShortLength.LEN_23, ID57Length.LEN_23],
  [ID57ShortLength.LEN_29, ID57Length.LEN_29],
  [ID57ShortLength.LEN_32, ID57Length.LEN_32],
  [ID57ShortLength.LEN_47, ID57Length.LEN_47],
  [ID57ShortLength.LEN_70, ID57Length.LEN_70]
]);

export function resolveID57ShortLength(length: number) {
  if (length === ID57ShortLength.DEFAULT) return ID57Length.LEN_47;
  const effective = id57ShortToID57Length.get(length);
  if (!effective) throw newInvalidLengthEnumError(length);
  return effective;
}

export function id57ShortGenerate(input: ByteInput, length: number = ID57ShortLength.DEFAULT) {
  const effective = resolveID57ShortLength(length);
  return id57Generate(input, effective);
}

export function id57ShortGenerateDefault(input: ByteInput) {
  return id57ShortGenerate(input, ID57ShortLength.DEFAULT);
}

export function id57ShortVerify(input: ByteInput, id57String: string, length: number = ID57ShortLength.DEFAULT) {
  try {
    return id57ShortGenerate(input, length) === id57String;
  } catch {
    return false;
  }
}

export function id57ShortVerifyDefault(input: ByteInput, id57String: string) {
  return id57ShortVerify(input, id57String, ID57ShortLength.DEFAULT);
}

export function id57ShortIsValid(id57String: string) {
  return id57IsValid(id57String);
}

export function id57ShortIsCanonical(id57String: string) {
  return id57IsCanonical(id57String);
}

export { id57GenerateDefault, id57Verify, id57VerifyDefault };
