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
      expect(id.length, 22);

      final idShort = id57ShortGenerate(input, ID57ShortLength.def);
      expect(idShort.isNotEmpty, true);

      final i57Enc = i57Encode(input);
      final i57Dec = i57Decode(i57Enc);
      expect(i57Dec, input);

      final i57HashOut = i57Hash(input, H57Length.len128);
      expect(i57HashOut.isNotEmpty, true);

      final i57IdOut = i57Id(input, ID57Length.def);
      expect(i57IdOut.length, 22);

      final r57 = r57Generate(R57Mode.csprng);
      expect(r57.length, 22);

      final i57Rand = i57Random(22);
      expect(i57Rand.length == 30 || i57Rand.length == 31, true);
    });
  });
}
