import 'package:test/test.dart';
import 'package:f57/b57.dart';

void main() {
  test('S57 e2e secure composition flow', () async {
    final s57 = S57(
      S57Config(
        serverSecretKey: 'S57_SERVER_SECRET_KEY_MUST_BE_LONG_1234567890'.codeUnits,
        environmentSalt: 'staging-v1'.codeUnits,
        keyId: 12,
      ),
    );

    final payload = 'e2e-s57-payload'.codeUnits;

    final id = s57.id(payload, ID57Length.def);
    final hash = s57.hash(payload, H57Length.len256);
    final random = s57.random();

    expect(id.length, 22);
    expect(hash.length, 44);
    expect(random.length, 22);

    final aad = 's57-e2e'.codeUnits;
    final sealed = await s57.encrypt(payload, aad);
    final opened = await s57.decrypt(sealed, aad);

    expect(String.fromCharCodes(opened), 'e2e-s57-payload');
  });
}
