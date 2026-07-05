import 'package:test/test.dart';
import 'package:f57/b57.dart';

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
      expect(id.isNotEmpty, true);
    });

    group('i57ValidateIdentifier', () {
      test('bit-length branch: accepts a valid identifier, rejects corruption', () {
        final input = 'i57-validate-bitlength'.codeUnits;
        final id = i57Id(input, ID57Length.len128);

        expect(i57ValidateIdentifier(id, ID57Length.len128), true);
        // Default parameter also resolves to LEN_128.
        expect(i57ValidateIdentifier(id), true);

        // Truncated/corrupted string: too short for LEN_128's bound.
        final truncated = id.substring(0, 5);
        expect(i57ValidateIdentifier(truncated, ID57Length.len128), false);

        // Wrong bit length entirely.
        expect(i57ValidateIdentifier(id, ID57Length.len256), false);
      });

      test('fixed-width branch: accepts a valid identifier, rejects corruption', () {
        final input = 'i57-validate-fixedwidth'.codeUnits;
        final id = i57Id(input, ID57Length.fixed8);

        expect(id.length, 8);
        expect(i57ValidateIdentifier(id, ID57Length.fixed8), true);

        // Truncated/corrupted string: wrong length for FIXED_8.
        final truncated = id.substring(0, 4);
        expect(i57ValidateIdentifier(truncated, ID57Length.fixed8), false);

        // Corrupted character (invalid B57 alphabet char).
        final corrupted = '${id.substring(0, 7)}0';
        expect(i57ValidateIdentifier(corrupted, ID57Length.fixed8), false);
      });

      test('bit-length branch checks decoded byte length, not just char count', () {
        // 'A' * 22 is within LEN_128's [16,22] char bound and is valid,
        // canonical B57 - but it decodes to 22 zero bytes, not the 16
        // bytes LEN_128 requires. The byte-length check must reject it;
        // being in the char bound is not sufficient.
        expect(i57ValidateIdentifier('A' * 22, ID57Length.len128), false);
      });

      test('throws for undefined length_enum values', () {
        expect(
          () => i57ValidateIdentifier('x', -13),
          throwsA(isA<InvalidLengthEnumError>()),
        );
      });
    });
  });
}
