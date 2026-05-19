import 'package:test/test.dart';
import 'package:b57/b57.dart';

void main() {
  group('I57', () {
    test('encode/decode', () {
      final input = 'hello world'.codeUnits;
      final enc = i57Encode(input);
      final dec = i57Decode(enc);
      expect(dec, input);
    });

    test('hash and id', () {
      final h = i57Hash('x'.codeUnits, HashFunction.sha256, H57Length.len128);
      expect(h.isNotEmpty, true);

      final id = i57Id('x'.codeUnits, HashFunction.sha256, ID57Length.len128);
      expect(id.isNotEmpty, true);
    });

    test('validation', () {
      final enc = i57Encode('hello'.codeUnits);
      expect(i57IsValid(enc), true);
      expect(i57IsCanonical(enc), true);
      expect(i57IsValid(''), false);
    });

    test('entropy heuristics', () {
      final id = i57Random(R57Mode.csprng);
      expect(i57ValidateIdentifier(id), true);
      expect(i57ValidateEntropy(id), true);
      expect(i57ValidateEntropy('AAAAAAAAAAAAAAAAAAAAAA'), false);
      expect(i57ValidateEntropy('ABABABABABABABABABABAB'), false);
    });
  });
}
