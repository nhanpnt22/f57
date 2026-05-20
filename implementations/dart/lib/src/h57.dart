library b57_h57;

import 'dart:typed_data';
import 'package:blake3_dart/blake3_dart.dart';
import 'errors.dart';
import 'b57.dart' as b57;

enum H57Length {
  hashAuto(-1),
  len8(8),
  len16(16),
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
  len512(512),
  hash256(10256),
  hash512(10512);

  final int value;
  const H57Length(this.value);
}

String h57Hash(List<int> input, H57Length length) {
  if (length == H57Length.hashAuto) {
    final hashBytes = _computeHashBlake3Xof(input, 32);
    return b57.encode(hashBytes);
  }
  
  final effective = _resolveEffectiveLength(length);
  final bits = _bitsByLength(effective);
  final requested = (bits + 7) ~/ 8;
  final hashBytes = _computeHashBlake3Xof(input, requested);
  return b57.encode(hashBytes);
}

bool h57Verify(List<int> input, String h57String, H57Length length) {
  try {
    return h57Hash(input, length) == h57String;
  } catch (_) {
    return false;
  }
}

bool h57IsValid(String h57String) => b57.isValid(h57String);
bool h57IsCanonical(String h57String) => b57.isCanonical(h57String);

List<int> _computeHashBlake3Xof(List<int> input, int requestedBytes) {
  if (requestedBytes <= 0) return [];
  return blake3(Uint8List.fromList(input), requestedBytes).toList();
}

H57Length _resolveEffectiveLength(H57Length length) {
  switch (length) {
    case H57Length.hashAuto:
      return H57Length.len256;
    case H57Length.hash256:
      return H57Length.len256;
    case H57Length.hash512:
      return H57Length.len512;
    default:
      return length;
  }
}

int _bitsByLength(H57Length length) {
  const bits = {
    H57Length.len8: 8,
    H57Length.len16: 16,
    H57Length.len23: 23,
    H57Length.len29: 29,
    H57Length.len32: 32,
    H57Length.len47: 47,
    H57Length.len64: 64,
    H57Length.len70: 70,
    H57Length.len93: 93,
    H57Length.len128: 128,
    H57Length.len186: 186,
    H57Length.len256: 256,
    H57Length.len373: 373,
    H57Length.len512: 512,
  };
  if (!bits.containsKey(length)) {
    throw InvalidLengthEnumError(length.value);
  }
  return bits[length]!;
}
