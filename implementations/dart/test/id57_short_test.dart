import 'package:test/test.dart';
import 'package:b57/b57.dart';

void main() {
  group('ID57-SHORT', () {
    test('default and verify', () {
      final s = id57ShortGenerate('abc'.codeUnits, ID57ShortLength.def);
      expect(id57ShortVerify('abc'.codeUnits, s, ID57ShortLength.def), true);
    });

    test('isValid and isCanonical', () {
      final s = id57ShortGenerate('test'.codeUnits, ID57ShortLength.def);
                });
  });
}
