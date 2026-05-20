library b57_id57;

import 'dart:typed_data';
import 'package:blake3_dart/blake3_dart.dart';
import 'b57.dart' as b57;
import 'errors.dart';

enum ID57Length {
  def(-1),
  len23(23),
  len29(29),
  len32(32),
  len47(47),
  len64(64),
  len70(70),
  len93(93),
  len128(128),
  len186(186),
  len256(256),
  len373(373),
  len512(512);

  final int value;
  const ID57Length(this.value);
}

String id57Generate(List<int> input, ID57Length length) {
  if (length == ID57Length.def) {
    return id57Generate(input, ID57Length.len128);
  }

  final bits = _bitsByLength(length);
  final requested = (bits + 7) ~/ 8;

  final hashBytes = blake3(Uint8List.fromList(input), requested).toList();

  final b57String = b57.encode(hashBytes);
  return b57String;
}

bool id57Verify(List<int> input, String id57String, ID57Length length) {
  

  if (length == ID57Length.def) {
    return id57Verify(input, id57String, ID57Length.len128);
  }

  try {
    final expected = id57Generate(input, length);
    return id57String == expected;
  } catch (_) {
    return false;
  }
}

int _bitsByLength(ID57Length length) {
  const bits = {
    ID57Length.len23: 23,
    ID57Length.len29: 29,
    ID57Length.len32: 32,
    ID57Length.len47: 47,
    ID57Length.len64: 64,
    ID57Length.len70: 70,
    ID57Length.len93: 93,
    ID57Length.len128: 128,
    ID57Length.len186: 186,
    ID57Length.len256: 256,
    ID57Length.len373: 373,
    ID57Length.len512: 512,
  };
  if (!bits.containsKey(length)) {
    throw InvalidLengthEnumError(length.value);
  }
  return bits[length]!;
}
