library b57_h57;

import 'dart:typed_data';
import 'package:crypto/crypto.dart';
import 'package:blake3_dart/blake3_dart.dart';
import 'errors.dart';
import 'b57.dart' as b57;

enum HashFunction { blake3, sha256, sha512 }

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

String h57Hash(List<int> input, HashFunction hashFn, H57Length length) {
  final effectiveHashFn = hashFn; // assume hashFn is not null because dart enums
  
  if (effectiveHashFn == HashFunction.blake3) {
    if (length == H57Length.hashAuto) {
      final hashBytes = _computeHash(input, effectiveHashFn);
      return b57.encode(hashBytes);
    }
    
    final effective = _resolveEffectiveLength(length, effectiveHashFn);
    final bits = _bitsByLength(effective);
    final requested = (bits + 7) ~/ 8;
    final hashBytes = _computeHashBlake3Xof(input, requested);
    return b57.encode(hashBytes);
  }

  final hashBytes = _computeHash(input, effectiveHashFn);
  final selected = _selectEffectiveBytes(hashBytes, length, effectiveHashFn);
  return b57.encode(selected);
}

bool h57Verify(List<int> input, String h57String, HashFunction hashFn, H57Length length) {
  try {
    return h57Hash(input, hashFn, length) == h57String;
  } catch (_) {
    return false;
  }
}

bool h57IsValid(String h57String) => b57.isValid(h57String);
bool h57IsCanonical(String h57String) => b57.isCanonical(h57String);

List<int> _computeHash(List<int> input, HashFunction hashFn) {
  switch (hashFn) {
    case HashFunction.sha256:
      return sha256.convert(input).bytes.toList();
    case HashFunction.sha512:
      return sha512.convert(input).bytes.toList();
    case HashFunction.blake3:
      return blake3(Uint8List.fromList(input), 32).toList();
  }
}

List<int> _computeHashBlake3Xof(List<int> input, int requestedBytes) {
  if (requestedBytes <= 0) return [];
  return blake3(Uint8List.fromList(input), requestedBytes).toList();
}

List<int> _selectEffectiveBytes(List<int> hashBytes, H57Length length, HashFunction hashFn) {
  final effective = _resolveEffectiveLength(length, hashFn);
  final bits = _bitsByLength(effective);
  final requested = (bits + 7) ~/ 8;
  if (requested > hashBytes.length) {
    throw EntropyExceededError(requested, hashBytes.length);
  }
  return hashBytes.sublist(0, requested);
}

H57Length _resolveEffectiveLength(H57Length length, HashFunction hashFn) {
  switch (length) {
    case H57Length.hashAuto:
      // Auto-select based on hash function output length
      return hashFn == HashFunction.sha512 ? H57Length.len512 : H57Length.len256;
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
