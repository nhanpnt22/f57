import 'package:test/test.dart';
import 'package:b57/b57.dart';

void main() {
  test('error constructors and messages', () {
    final invalidChar = InvalidCharError(1, 'x'.codeUnitAt(0));
    expect(invalidChar.code, 'INVALID_CHAR');
    expect(invalidChar.toString().contains('position 1'), true);

    final nonCanonical = NonCanonicalError();
    expect(nonCanonical.code, 'NON_CANONICAL');
    expect(nonCanonical.toString().contains('non-canonical'), true);

    final invalidLen = InvalidLengthEnumError(999);
    expect(invalidLen.code, 'INVALID_LENGTH_ENUM');

    final entropy = EntropyExceededError(10, 5);
    expect(entropy.code, 'ENTROPY_EXCEEDED');

    final insufficient = InsufficientEntropyError();
    expect(insufficient.code, 'INSUFFICIENT_ENTROPY');

    final invalidMode = InvalidModeError(77);
    expect(invalidMode.code, 'INVALID_MODE');

    final invalidInput = InvalidInputError('oops');
    expect(invalidInput.code, 'INVALID_INPUT');

    final invalidVersion = InvalidVersionError(255);
    expect(invalidVersion.code, 'INVALID_VERSION');

    final authFailure = AuthFailureError();
    expect(authFailure.code, 'AUTH_FAILURE');

    final keyInvalid = KeyInvalidError();
    expect(keyInvalid.code, 'KEY_INVALID');

    final keyUnavailable = KeyUnavailableError(7);
    expect(keyUnavailable.code, 'KEY_UNAVAILABLE');
  });
}
