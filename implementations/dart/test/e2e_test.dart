import 'package:test/test.dart';
import 'package:f57/b57.dart';

void main() {
  group('E2E', () {
    test('all profiles roundtrip', () {
      final input = 'dart-e2e-input'.codeUnits;

      final b57Out = encode(input);
      final b57Decoded = decode(b57Out);
      expect(b57Decoded, input);

      final h57Out = h57Hash(input, H57Length.len128);
      expect(h57Out.isNotEmpty, true);

      final id = id57Generate(input, ID57Length.def);
      final idRange = id57Range(ID57Length.def);
      expect(id.length >= idRange.min && id.length <= idRange.max, true);

      final idFixed8 = id57Generate(input, ID57Length.fixed8);
      expect(idFixed8.length, 8);
      expect(id57IsLength(idFixed8, ID57Length.fixed8), true);

      final i57Enc = i57Encode(input);
      final i57Dec = i57Decode(i57Enc);
      expect(i57Dec, input);

      final i57HashOut = i57Hash(input, H57Length.len128);
      expect(i57HashOut.isNotEmpty, true);

      final i57IdOut = i57Id(input, ID57Length.def);
      expect(i57IdOut.length >= idRange.min && i57IdOut.length <= idRange.max, true);
      expect(i57ValidateIdentifier(i57IdOut, ID57Length.def), true);

      final r57 = r57Generate(R57Mode.csprng);
      expect(r57.length, 22);

      final i57Rand = i57Random(22);
      expect(i57Rand.length == 30 || i57Rand.length == 31, true);
    });
  });
}
