import 'package:test/test.dart';
import 'package:b57/b57.dart';

void main() {
  group('H57', () {
    test('deterministic hash', () {
      final a = h57Hash('hello-h57'.codeUnits, HashFunction.sha256, H57Length.hashAuto);
      final b = h57Hash('hello-h57'.codeUnits, HashFunction.sha256, H57Length.hashAuto);
      expect(a, b);
    });

    test('auto canonical lengths', () {
      final sha256Out = h57Hash('canonical'.codeUnits, HashFunction.sha256, H57Length.hashAuto);
      expect(sha256Out.length, 44);

      final sha512Out = h57Hash('canonical'.codeUnits, HashFunction.sha512, H57Length.hashAuto);
      expect(sha512Out.length, 88);
    });

    test('verify', () {
      final h = h57Hash('verify'.codeUnits, HashFunction.sha256, H57Length.len128);
      expect(h57Verify('verify'.codeUnits, h, HashFunction.sha256, H57Length.len128), true);
      expect(h57Verify('different'.codeUnits, h, HashFunction.sha256, H57Length.len128), false);
    });

    test('isValid and isCanonical', () {
      final h = h57Hash('test'.codeUnits, HashFunction.sha256, H57Length.len128);
      expect(h57IsValid(h), true);
      expect(h57IsCanonical(h), true);
    });
  });
}
