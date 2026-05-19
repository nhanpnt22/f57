import 'package:test/test.dart';
import 'package:b57/b57.dart';

void main() {
  group('B57 Core', () {
    test('encode/decode roundtrip', () {
      final input = 'hello world'.codeUnits;
      final encoded = encode(input);
      final decoded = decode(encoded);
      expect(decoded, input);
    });

    test('leading zeros preserved', () {
      final data = [0, 0, 1, 2, 3];
      final encoded = encode(data);
      expect(encoded, startsWith('AA'));
      expect(decode(encoded), data);
    });

    test('all zeros', () {
      expect(encode([0, 0, 0]), 'AAA');
      expect(decode('AAA'), [0, 0, 0]);
    });

    test('isValid and isCanonical', () {
      final e = encode('abc'.codeUnits);
      expect(isValid(e), true);
      expect(isCanonical(e), true);
      expect(isValid('A0'), false);
    });

    test('encoded/decoded length helpers', () {
      expect(encodedLength(0), 0);
      expect(decodedLength(0), 0);
      expect(encodedLength(16) > 0, true);
      expect(decodedLength(22) > 0, true);
    });
  });
}
