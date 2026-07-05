library b57_i57;

import 'dart:math';
import 'b57.dart' as b57;
import 'h57.dart';
import 'id57.dart';

String i57Encode(List<int> input) => b57.encode(input);
List<int> i57Decode(String input) => b57.decode(input);

String i57Hash(List<int> input, H57Length length) =>
    h57Hash(input, length);

String i57Random(int bytes) {
  final rand = Random.secure();
  final data = List<int>.generate(bytes, (_) => rand.nextInt(256));
  return b57.encode(data);
}

String i57Id(List<int> input, [int length = ID57Length.def]) =>
    id57Generate(input, length);

bool i57IsValid(String input) => b57.isValid(input);
bool i57IsCanonical(String input) => b57.isCanonical(input);

/// i57_validate_identifier (I57 Core API 5.3).
///
/// length_enum's SIGN selects the check, mirroring ID57 Core API 7.3/
/// 11.4/11.5:
///
/// - negative (FIXED width): delegates entirely to [id57IsLength] - valid
///   B57 AND exact length == -length. MUST NOT decode/canonicalize (fixed
///   widths are bignum prefixes, not canonical B57).
/// - positive/DEFAULT (bit length): [id57IsLength] does not apply, so the
///   bound + canonical + decoded-byte-length + excess-bits check is
///   implemented directly here.
bool i57ValidateIdentifier(String input, [int length = ID57Length.def]) {
  final effective = resolveID57Length(length);

  if (effective < 0) {
    return id57IsLength(input, effective);
  }

  final bits = effective;
  final byteLength = (bits + 7) ~/ 8;
  final range = id57Range(effective);

  if (input.length < range.min || input.length > range.max) {
    return false;
  }
  if (!id57IsCanonical(input)) {
    return false;
  }

  final decoded = b57.decode(input);
  if (decoded.length != byteLength) {
    return false;
  }

  final excessBits = byteLength * 8 - bits;
  if (excessBits > 0) {
    final lastByte = decoded[byteLength - 1];
    final mask = (1 << excessBits) - 1;
    if ((lastByte & mask) != 0) {
      return false;
    }
  }

  return true;
}
