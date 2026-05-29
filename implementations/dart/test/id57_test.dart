import 'package:test/test.dart';
import 'package:f57/b57.dart';

void main() {
  group('ID57', () {
    test('deterministic generation', () {
      final a = id57Generate('id57'.codeUnits, ID57Length.len256);
      final b = id57Generate('id57'.codeUnits, ID57Length.len256);
      expect(a, b);
    });

    test('default uses len128', () {
      final d = id57Generate('x'.codeUnits, ID57Length.def);
      final p = id57Generate('x'.codeUnits, ID57Length.def);
      expect(d, p);
      expect(d.length, 22);
    });

    test('verify paths', () {
      final s = id57Generate('abc'.codeUnits, ID57Length.def);
      expect(id57Verify('abc'.codeUnits, s, ID57Length.def), true);
      expect(id57Verify('abcx'.codeUnits, s, ID57Length.def), false);
    });

    test('isValid and isCanonical', () {
      final s = id57Generate('test'.codeUnits, ID57Length.def);
                });
  });
}
