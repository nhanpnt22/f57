library b57_errors;

class B57Error implements Exception {
  final String code;
  final String message;
  final int? index;

  B57Error({
    required this.code,
    required this.message,
    this.index,
  });

  @override
  String toString() {
    if (index != null) {
      return 'b57: $message at position $index';
    }
    return 'b57: $message';
  }
}

class InvalidCharError extends B57Error {
  InvalidCharError(int index, int charCode)
      : super(
          code: 'INVALID_CHAR',
          message: 'invalid character ${String.fromCharCode(charCode)}',
          index: index,
        );
}

class NonCanonicalError extends B57Error {
  NonCanonicalError()
      : super(
          code: 'NON_CANONICAL',
          message: 'non-canonical encoding',
        );
}

class InvalidLengthEnumError extends B57Error {
  InvalidLengthEnumError(int length)
      : super(
          code: 'INVALID_LENGTH_ENUM',
          message: 'invalid length enum $length',
        );
}

class EntropyExceededError extends B57Error {
  EntropyExceededError(int requested, int available)
      : super(
          code: 'ENTROPY_EXCEEDED',
          message:
              'requested entropy exceeds hash output ($requested bytes requested, $available available)',
        );
}

class InvalidHashFunctionError extends B57Error {
  InvalidHashFunctionError(String hashFn)
      : super(
          code: 'INVALID_HASH_FUNCTION',
          message: 'invalid hash function "$hashFn"',
        );
}

class InsufficientEntropyError extends B57Error {
  InsufficientEntropyError()
      : super(
          code: 'INSUFFICIENT_ENTROPY',
          message: 'insufficient entropy generated',
        );
}

class InvalidModeError extends B57Error {
  InvalidModeError(int mode)
      : super(
          code: 'INVALID_MODE',
          message: 'invalid random generation mode $mode',
        );
}

class InvalidInputError extends B57Error {
  InvalidInputError(String msg)
      : super(
          code: 'INVALID_INPUT',
          message: 'invalid input: $msg',
        );
}
