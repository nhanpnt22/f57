library b57_id57_short;

import 'dart:typed_data';
import 'package:blake3_dart/blake3_dart.dart';
import 'b57.dart' as b57;
import 'errors.dart';

enum ID57ShortLength {
  def(-1),
  len23(23),
  len29(29),
  len32(32),
  len47(47),
  len64(64);

  final int value;
  const ID57ShortLength(this.value);
}

String id57ShortGenerate(List<int> input, ID57ShortLength length) {
  if (length == ID57ShortLength.def) {
    return id57ShortGenerate(input, ID57ShortLength.len47);
  }

  final bits = _bitsByLength(length);
  final requested = (bits + 7) ~/ 8;

  final hashBytes = blake3(Uint8List.fromList(input), requested).toList();

  final b57String = b57.encode(hashBytes);
  return b57String;
}

bool id57ShortVerify(List<int> input, String id57String, ID57ShortLength length) {
  

  if (length == ID57ShortLength.def) {
    return id57ShortVerify(input, id57String, ID57ShortLength.len47);
  }

  try {
    final expected = id57ShortGenerate(input, length);
    return id57String == expected;
  } catch (_) {
    return false;
  }
}

int _bitsByLength(ID57ShortLength length) {
  const bits = {
    ID57ShortLength.len23: 23,
    ID57ShortLength.len29: 29,
    ID57ShortLength.len32: 32,
    ID57ShortLength.len47: 47,
    ID57ShortLength.len64: 64,
  };
  if (!bits.containsKey(length)) {
    throw InvalidLengthEnumError(length.value);
  }
  return bits[length]!;
}
