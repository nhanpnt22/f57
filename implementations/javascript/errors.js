export class B57Error extends Error {
  constructor(code, message) {
    super(`b57: ${message}`);
    this.name = 'B57Error';
    this.code = code;
    this.rawMessage = message;
    this.index = -1;
  }
}

export const ErrorCode = Object.freeze({
  INVALID_CHAR: 'INVALID_CHAR',
  NON_CANONICAL: 'NON_CANONICAL',
  INVALID_LENGTH_ENUM: 'INVALID_LENGTH_ENUM',
  ENTROPY_EXCEEDED: 'ENTROPY_EXCEEDED',
  INVALID_MODE: 'INVALID_MODE'
});

export class InvalidCharError extends B57Error {
  constructor(char, index = -1) {
    super(ErrorCode.INVALID_CHAR, `invalid character '${char}'${index >= 0 ? ` at index ${index}` : ''}`);
    this.char = char;
    this.index = index;
  }
}

export class NonCanonicalError extends B57Error {
  constructor() {
    super(ErrorCode.NON_CANONICAL, 'string contains non-canonical encoding');
  }
}

export class InvalidLengthEnumError extends B57Error {
  constructor(lengthValue) {
    super(ErrorCode.INVALID_LENGTH_ENUM, `invalid length enum ${lengthValue}`);
  }
}

export class EntropyExceededError extends B57Error {
  constructor(requested, available) {
    super(ErrorCode.ENTROPY_EXCEEDED, `requested ${requested} bytes of entropy but only ${available} available`);
  }
}

export class InvalidModeError extends B57Error {
  constructor(mode) {
    super(ErrorCode.INVALID_MODE, `invalid r57 mode ${mode}`);
  }
}

export function newInvalidCharError(char, index = -1) {
  return new InvalidCharError(char, index);
}

export function newNonCanonicalError() {
  return new NonCanonicalError();
}

export function newInvalidLengthEnumError(lengthValue) {
  return new InvalidLengthEnumError(lengthValue);
}

export function newEntropyExceededError(requested, available) {
  return new EntropyExceededError(requested, available);
}

export function newInvalidR57ModeError(mode) {
  return new InvalidModeError(mode);
}
