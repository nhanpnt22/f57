import 'package:test/test.dart';
import 'package:f57/b57.dart';

const List<int> _bitLengths = [
  ID57Length.len8,
  ID57Length.len16,
  ID57Length.len32,
  ID57Length.len64,
  ID57Length.len128,
  ID57Length.len256,
  ID57Length.len512,
];

const List<int> _fixedLengths = [
  ID57Length.fixed2,
  ID57Length.fixed3,
  ID57Length.fixed4,
  ID57Length.fixed5,
  ID57Length.fixed6,
  ID57Length.fixed7,
  ID57Length.fixed8,
  ID57Length.fixed9,
  ID57Length.fixed10,
  ID57Length.fixed11,
  ID57Length.fixed12,
];

void main() {
  group('ID57', () {
    test('deterministic generation', () {
      final a = id57Generate('id57'.codeUnits, ID57Length.len256);
      final b = id57Generate('id57'.codeUnits, ID57Length.len256);
      expect(a, b);
    });

    test('default uses len128', () {
      final d = id57Generate('x'.codeUnits, ID57Length.def);
      final p = id57Generate('x'.codeUnits, ID57Length.len128);
      expect(d, p);
      final range = id57Range(ID57Length.def);
      expect(range.min, 16);
      expect(range.max, 22);
      expect(d.length >= range.min && d.length <= range.max, true);
    });

    test('verify paths', () {
      final s = id57Generate('abc'.codeUnits, ID57Length.def);
      expect(id57Verify('abc'.codeUnits, s, ID57Length.def), true);
      expect(id57Verify('abcx'.codeUnits, s, ID57Length.def), false);
    });

    test('isValid and isCanonical', () {
      final s = id57Generate('test'.codeUnits, ID57Length.def);
      expect(id57IsValid(s), true);
      expect(id57IsCanonical(s), true);
    });

    test('id57GenerateDefault/id57VerifyDefault convenience wrappers', () {
      final s = id57GenerateDefault('convenience'.codeUnits);
      expect(s, id57Generate('convenience'.codeUnits, ID57Length.def));
      expect(id57VerifyDefault('convenience'.codeUnits, s), true);
      expect(id57VerifyDefault('other'.codeUnits, s), false);
    });

    group('bit lengths (7.1) - bound, not fixed', () {
      for (final length in _bitLengths) {
        test('length $length: generate/verify/range/isLength-throws', () {
          final input = 'bit-length-input-$length'.codeUnits;
          final out = id57Generate(input, length);

          expect(id57Verify(input, out, length), true);
          expect(id57IsValid(out), true);
          expect(id57IsCanonical(out), true);

          final range = id57Range(length);
          expect(out.length >= range.min && out.length <= range.max, true);

          // id57_is_length no longer applies to bit lengths (11.5, v0.3.1).
          expect(
            () => id57IsLength(out, length),
            throwsA(isA<InvalidLengthEnumError>()),
          );
        });
      }

      test('DEFAULT also throws in id57IsLength', () {
        final out = id57Generate('default-throws'.codeUnits, ID57Length.def);
        expect(
          () => id57IsLength(out, ID57Length.def),
          throwsA(isA<InvalidLengthEnumError>()),
        );
      });
    });

    group('fixed widths (7.2) - exact, non-security', () {
      for (final length in _fixedLengths) {
        final k = -length;
        test('FIXED_$k: exactly $k chars, range(k,k), isLength true', () {
          final input = 'fixed-width-input-$k'.codeUnits;
          final out = id57Generate(input, length);

          expect(out.length, k);

          final range = id57Range(length);
          expect(range.min, k);
          expect(range.max, k);

          expect(id57IsLength(out, length), true);
          expect(id57Verify(input, out, length), true);
        });
      }
    });

    test('cut/prefix invariant: FIXED_k == LEN_128 prefix, and FIXED_j is a prefix of FIXED_k for j<k', () {
      final input = 'cut-invariant-input'.codeUnits;
      final full = id57Generate(input, ID57Length.len128);

      for (final length in _fixedLengths) {
        final k = -length;
        final out = id57Generate(input, length);
        expect(out, full.substring(0, k));
      }

      for (var j = 0; j < _fixedLengths.length; j++) {
        for (var k = j + 1; k < _fixedLengths.length; k++) {
          final smaller = id57Generate(input, _fixedLengths[j]);
          final larger = id57Generate(input, _fixedLengths[k]);
          expect(larger.startsWith(smaller), true);
        }
      }
    });

    group('id57IsLength checks BOTH conditions independently', () {
      test('wrong length -> false even with valid chars', () {
        // "AAA" is valid B57 (3 chars) but FIXED_4 requires exactly 4.
        expect(id57IsLength('AAA', ID57Length.fixed4), false);
      });

      test('invalid chars -> false even with correct length', () {
        // '0' and 'O'/'I'/'l' are not in the B57 alphabet.
        expect(id57IsLength('AA0A', ID57Length.fixed4), false);
      });

      test('a literal, non-generated string validates true without decoding', () {
        // "AAAA" is 4 valid B57 chars, not derived from any real
        // generation. It MUST validate true for FIXED_4 - proving
        // id57IsLength does not try to decode/canonicalize (an all-'A'
        // string of this length would not necessarily be a canonical
        // encoding of anything meaningful).
        expect(id57IsLength('AAAA', ID57Length.fixed4), true);
      });
    });

    test('invalid/unknown lengths are rejected', () {
      // -9 (FIXED_9) is now valid - no gaps in 2..12.
      expect(id57IsLength('123456789', ID57Length.fixed9), true);

      // Out-of-range negatives MUST throw INVALID_LENGTH_ENUM. Note: Dart's
      // `int` has no distinct negative zero, so "-0" is indistinguishable
      // from ID57Length.def (0) and is therefore valid, not an error.
      for (final bad in [-1, -13, -14, -100]) {
        expect(
          () => id57Generate('x'.codeUnits, bad),
          throwsA(isA<InvalidLengthEnumError>()),
        );
        expect(
          () => id57Range(bad),
          throwsA(isA<InvalidLengthEnumError>()),
        );
      }

      // Undefined positive lengths still throw too.
      expect(
        () => id57Generate('x'.codeUnits, 999),
        throwsA(isA<InvalidLengthEnumError>()),
      );
    });

    test('id57Verify returns false (not throw) for invalid length', () {
      expect(id57Verify('x'.codeUnits, 'anything', -13), false);
    });
  });
}
