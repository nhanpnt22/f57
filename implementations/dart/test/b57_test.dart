import 'package:test/test.dart';
import 'package:f57/b57.dart';

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

    test('encodedLength matches ceil(byteLen*8/log2(57)) for the ID57 bit lengths', () {
      // Regression test: encodedLength previously divided by the bit-width
      // of the number 57 (6) instead of log2(57) (~5.83), which happened
      // to match the ID57 7.1 table for small byte lengths but undercounted
      // max_chars at byte_length 32 and 64 (43 instead of 44, 86 instead
      // of 88).
      expect(encodedLength(1), 2); // ID57_LEN_8  -> 1-2 chars
      expect(encodedLength(2), 3); // ID57_LEN_16 -> 2-3 chars
      expect(encodedLength(4), 6); // ID57_LEN_32 -> 4-6 chars
      expect(encodedLength(8), 11); // ID57_LEN_64 -> 8-11 chars
      expect(encodedLength(16), 22); // ID57_LEN_128 -> 16-22 chars
      expect(encodedLength(32), 44); // ID57_LEN_256 -> 32-44 chars
      expect(encodedLength(64), 88); // ID57_LEN_512 -> 64-88 chars
    });
  });
}
