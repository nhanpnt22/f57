import 'package:test/test.dart';
import 'package:f57/b57.dart';

S57 _createS57() {
  return S57(
    S57Config(
      serverSecretKey: 'S57_SERVER_SECRET_KEY_MUST_BE_LONG_1234567890'.codeUnits,
      environmentSalt: 'prod-v1'.codeUnits,
      keyId: 7,
    ),
  );
}

void main() {
  group('S57', () {
    test('key derivation outputs 32-byte keys', () {
      final s57 = _createS57();
      final keys = s57.resolveKeys();
      expect(keys.b57Aes256Key.length, 32);
      expect(keys.h57Key.length, 32);
      expect(keys.id57Key.length, 32);
      expect(keys.keyId, 7);
    });

    test('hash deterministic and canonical', () {
      final s57 = _createS57();
      final input = 'hello-s57-hash'.codeUnits;
      final a = s57.hash(input, H57Length.len256);
      final b = s57.hash(input, H57Length.len256);
      expect(a, b);
      expect(a.length, 44);
      expect(isValid(a), true);
      expect(isCanonical(a), true);
    });

    test('id deterministic and profile lengths', () {
      final s57 = _createS57();
      final input = 'hello-s57-id'.codeUnits;

      final v128 = s57.id(input, ID57Length.def);
      final v256 = s57.id(input, ID57Length.len256);
      final v512 = s57.id(input, ID57Length.len512);

      expect(v128.length, 22);
      expect(v256.length, 44);
      expect(v512.length, 88);

      // S57 restricts length_enum to {128, 256, 512}; other ID57-valid bit
      // lengths and all fixed widths (non-security) MUST be rejected.
      expect(() => s57.id(input, ID57Length.len8), throwsA(isA<InvalidLengthEnumError>()));
      expect(() => s57.id(input, ID57Length.fixed8), throwsA(isA<InvalidLengthEnumError>()));
    });

    test('random APIs produce canonical 22-char strings', () {
      final s57 = _createS57();
      final values = [
        s57.random(),
        s57.randomTime(),
        s57.randomCounter(42),
        s57.randomSession('session-secret'.codeUnits),
        s57.randomDevice('device-secret'.codeUnits),
        s57.randomDerived('master-secret'.codeUnits, 'u-1'.codeUnits),
        s57.randomHardened(),
        s57.randomHybrid([
          'a'.codeUnits,
          'b'.codeUnits,
          'c'.codeUnits,
        ]),
      ];

      for (final value in values) {
        expect(value.length, 22);
        expect(isValid(value), true);
        expect(isCanonical(value), true);
      }
    });

    test('randomDerived deterministic', () {
      final s57 = _createS57();
      final a = s57.randomDerived('master'.codeUnits, 'unique'.codeUnits);
      final b = s57.randomDerived('master'.codeUnits, 'unique'.codeUnits);
      expect(a, b);
    });

    test('encrypt/decrypt round trip', () async {
      final s57 = _createS57();
      final plaintext = 'secret payload'.codeUnits;
      final aad = 'aad-v1'.codeUnits;
      final sealed = await s57.encrypt(plaintext, aad);
      final opened = await s57.decrypt(sealed, aad);
      expect(opened, plaintext);
    });

    test('decrypt fails on wrong aad', () async {
      final s57 = _createS57();
      final sealed = await s57.encrypt('hello'.codeUnits, 'good-aad'.codeUnits);
      expect(
        () => s57.decrypt(sealed, 'bad-aad'.codeUnits),
        throwsA(isA<AuthFailureError>()),
      );
    });

    test('decrypt fails on wrong key_id', () async {
      final s57 = _createS57();
      final sealed = await s57.encrypt('hello'.codeUnits);
      expect(
        () => s57.decrypt(sealed, const <int>[], 1),
        throwsA(isA<KeyUnavailableError>()),
      );
    });

    test('decrypt fails on invalid version', () async {
      final s57 = _createS57();
      final sealed = await s57.encrypt('hello'.codeUnits);
      final raw = decode(sealed);
      raw[0] = 0xff;
      final tampered = encode(raw);
      expect(
        () => s57.decrypt(tampered),
        throwsA(isA<InvalidVersionError>()),
      );
    });
  });
}
