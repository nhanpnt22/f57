import 'package:test/test.dart';
import 'package:b57/b57.dart';

void main() {
  group('ID57', () {
    test('deterministic generation', () {
      final a = id57Generate('id57'.codeUnits, HashFunction.sha256, ID57Length.len256);
      final b = id57Generate('id57'.codeUnits, HashFunction.sha256, ID57Length.len256);
      expect(a, b);
    });

    test('default uses len128', () {
      final d = id57GenerateDefault('x'.codeUnits);
      final p = id57Generate('x'.codeUnits, HashFunction.blake3, ID57Length.def);
      expect(d, p);
      expect(d.length, 22);
    });

    test('verify paths', () {
      final s = id57GenerateDefault('abc'.codeUnits);
      expect(id57VerifyDefault('abc'.codeUnits, s), true);
      expect(id57VerifyDefault('abcx'.codeUnits, s), false);
    });

    test('isValid and isCanonical', () {
      final s = id57GenerateDefault('test'.codeUnits);
      expect(id57IsValid(s), true);
      expect(id57IsCanonical(s), true);
    });
  });
}
