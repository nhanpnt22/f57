import 'package:test/test.dart';
import 'package:b57/b57.dart';

void main() {
  group('R57', () {
    test('mode values', () {
      expect(R57Mode.csprng.value, 1);
    });

    test('all modes generate valid identifiers', () {
      for (final mode in R57Mode.values) {
        final id = r57Generate(mode);
        expect(r57IsValid(id), true);
        expect(r57IsCanonical(id), true);
        expect(id.length, 22);
      }
    });
  });
}
