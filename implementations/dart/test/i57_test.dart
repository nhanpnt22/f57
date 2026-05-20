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
      final h = i57Hash('x'.codeUnits, H57Length.len128);
      expect(h.isNotEmpty, true);

      final id = i57Id('x'.codeUnits, ID57Length.len128);
      expect(id.isNotEmpty, true);
    });

    

    test('entropy heuristics', () {
      final id = i57Random(22);
                            });
  });
}
