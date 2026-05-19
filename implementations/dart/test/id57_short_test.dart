import 'package:test/test.dart';
import 'package:b57/b57.dart';

void main() {
  group('ID57-SHORT', () {
    test('default and verify', () {
      final s = id57ShortGenerateDefault('abc'.codeUnits);
      expect(id57ShortVerifyDefault('abc'.codeUnits, s), true);
    });

    test('isValid and isCanonical', () {
      final s = id57ShortGenerateDefault('test'.codeUnits);
      expect(id57ShortIsValid(s), true);
      expect(id57ShortIsCanonical(s), true);
    });
  });
}
