library b57_id57;

import 'dart:typed_data';
import 'package:blake3_dart/blake3_dart.dart';
import 'package:crypto/crypto.dart';
import 'errors.dart';
import 'b57.dart' as b57;
import 'h57.dart';

enum ID57Length {
  def(0),
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
  len512(512);

  final int value;
  const ID57Length(this.value);
}

String id57Generate(List<int> input, HashFunction? hashFn, ID57Length length) {
  final effective = _resolveLength(length);
  final bits = _bitsByLength(effective);
  final requested = (bits + 7) ~/ 8;
  
  final effectiveHashFn = hashFn ?? HashFunction.blake3;
  List<int> hashBytes;
  if (effectiveHashFn == HashFunction.blake3) {
    hashBytes = blake3(Uint8List.fromList(input), requested).toList();
  } else {
    hashBytes = _computeHash(input, effectiveHashFn, requested);
  }
  
  final effectiveBytes = hashBytes.sublist(0, requested);
  _maskExcessBits(effectiveBytes, bits);
  return b57.encode(effectiveBytes);
}

String id57GenerateDefault(List<int> input) =>
    id57Generate(input, HashFunction.blake3, ID57Length.def);

bool id57Verify(List<int> input, HashFunction? hashFn, String id57String,
    ID57Length length) {
  try {
    return id57Generate(input, hashFn, length) == id57String;
  } catch (_) {
    return false;
  }
}

bool id57VerifyDefault(List<int> input, String id57String) =>
    id57Verify(input, HashFunction.blake3, id57String, ID57Length.def);

bool id57IsValid(String id57String) => b57.isValid(id57String);
bool id57IsCanonical(String id57String) => b57.isCanonical(id57String);

ID57Length _resolveLength(ID57Length length) {
  if (length == ID57Length.def) return ID57Length.len128;
  _bitsByLength(length); // Validate
  return length;
}

List<int> _computeHash(
    List<int> input, HashFunction hashFn, int requestedBytes) {
  List<int> hash;
  if (hashFn == HashFunction.sha512) {
    hash = sha512.convert(input).bytes.toList();
  } else {
    hash = sha256.convert(input).bytes.toList();
  }
  
  if (requestedBytes > hash.length) {
    throw EntropyExceededError(requestedBytes, hash.length);
  }
  return hash;
}

int _bitsByLength(ID57Length length) {
  const bits = {
    ID57Length.len8: 8,
    ID57Length.len16: 16,
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

void _maskExcessBits(List<int> bytes, int bitLength) {
  if (bytes.isEmpty) return;
  final excess = bytes.length * 8 - bitLength;
  if (excess <= 0) return;
  final mask = 0xFF << excess;
  bytes[bytes.length - 1] &= mask;
}
