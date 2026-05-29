import 'package:test/test.dart';
import 'package:f57/b57.dart';

void main() {
  S57 newS57() => S57(
        S57Config(
          serverSecretKey: 'S57_SERVER_SECRET_KEY_MUST_BE_LONG_1234567890'.codeUnits,
          environmentSalt: 'cov-v1'.codeUnits,
          keyId: 9,
        ),
      );

  test('constructor and resolveKeys branches', () {
    expect(
      () => S57(
        S57Config(
          serverSecretKey: 'short'.codeUnits,
          environmentSalt: 'x'.codeUnits,
        ),
      ),
      throwsA(isA<KeyInvalidError>()),
    );

    final s57 = newS57();
    final keys = s57.resolveKeys(3);
    expect(keys.keyId, 3);
  });

  test('hash/id invalid length branches', () {
    final s57 = newS57();
    expect(s57.hash('x'.codeUnits, H57Length.hashAuto).isNotEmpty, true);
    expect(() => s57.hash('x'.codeUnits, H57Length.len47), throwsA(isA<InvalidLengthEnumError>()));
    expect(() => s57.id('x'.codeUnits, ID57Length.len47), throwsA(isA<InvalidLengthEnumError>()));
  });

  test('randomHybrid empty source fails', () {
    final s57 = newS57();
    expect(() => s57.randomHybrid(const []), throwsA(isA<InvalidInputError>()));
  });

  test('decrypt envelope structural errors', () async {
    final s57 = newS57();

    expect(() => s57.decrypt('A'), throwsA(isA<InvalidInputError>()));

    final raw = <int>[s57Version, 9, ...List<int>.filled(12, 0), ...List<int>.filled(8, 1)];
    final malformed = encode(raw);
    expect(() => s57.decrypt(malformed), throwsA(isA<InvalidInputError>()));
  });
}
