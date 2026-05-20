import 'package:test/test.dart';
import 'package:b57/b57.dart';

void main() {
  group('H57', () {
    test('deterministic hash', () {
      final a = h57Hash('hello-h57'.codeUnits, H57Length.hashAuto);
      final b = h57Hash('hello-h57'.codeUnits, H57Length.hashAuto);
      expect(a, b);
    });

    

    test('verify', () {
      final h = h57Hash('verify'.codeUnits, H57Length.len128);
      expect(h57Verify('verify'.codeUnits, h, H57Length.len128), true);
      expect(h57Verify('different'.codeUnits, h, H57Length.len128), false);
    });

    test('isValid and isCanonical', () {
      final h = h57Hash('test'.codeUnits, H57Length.len128);
      expect(h57IsValid(h), true);
      expect(h57IsCanonical(h), true);
    });
  });
}
