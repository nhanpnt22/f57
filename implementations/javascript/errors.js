export const ErrorCode = Object.freeze({
  INVALID_CHAR: 'INVALID_CHAR',
  NON_CANONICAL: 'NON_CANONICAL',
  INVALID_LENGTH_ENUM: 'INVALID_LENGTH_ENUM',
  ENTROPY_EXCEEDED: 'ENTROPY_EXCEEDED',
  INVALID_HASH_FUNCTION: 'INVALID_HASH_FUNCTION',
  INVALID_R57_MODE: 'INVALID_R57_MODE',
});

export class B57Error extends Error {
  constructor(code, message, index = -1) {
    const fullMessage = index >= 0 ? `b57: ${message} at position ${index}` : `b57: ${message}`;
    super(fullMessage);
    this.name = 'B57Error';
    this.code = code;
    this.rawMessage = message;
    this.index = index;
  }
}

export function newInvalidCharError(index, charCode) {
  const char = String.fromCharCode(charCode);
  return new B57Error(ErrorCode.INVALID_CHAR, `invalid character ${JSON.stringify(char)}`, index);
}

export function newNonCanonicalError() {
  return new B57Error(ErrorCode.NON_CANONICAL, 'non-canonical encoding');
}

export function newInvalidLengthEnumError(lengthEnum) {
  return new B57Error(ErrorCode.INVALID_LENGTH_ENUM, `invalid length enum ${lengthEnum}`);
}

export function newEntropyExceededError(requestedBytes, availableBytes) {
  return new B57Error(
    ErrorCode.ENTROPY_EXCEEDED,
    `requested entropy exceeds hash output (${requestedBytes} bytes requested, ${availableBytes} available)`
  );
}

export function newInvalidHashFunctionError(hashFn) {
  return new B57Error(ErrorCode.INVALID_HASH_FUNCTION, `invalid hash function ${JSON.stringify(hashFn)}`);
}

export function newInvalidR57ModeError(mode) {
  return new B57Error(ErrorCode.INVALID_R57_MODE, `invalid r57 mode ${mode}`);
}
