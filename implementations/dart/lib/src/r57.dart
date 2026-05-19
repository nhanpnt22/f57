library b57_r57;

import 'dart:math';
import 'dart:typed_data';
import 'package:crypto/crypto.dart';
import 'b57.dart' as b57;

enum R57Mode {
  csprng(1),
  hashEntropy(2),
  kdfDerived(3),
  counterKdf(4),
  timestampKdf(5),
  hardwareRng(6),
  uuidV4Compat(7),
  hybridEntropy(8);

  final int value;
  const R57Mode(this.value);
}

String r57Generate(R57Mode mode) {
  final raw = _generateEntropy(mode);
  return _encodeR57_128(raw);
}

bool r57IsValid(String s) => s.length == 22 && b57.isValid(s);
bool r57IsCanonical(String s) => s.length == 22 && b57.isCanonical(s);

List<int> _generateEntropy(R57Mode mode) {
  switch (mode) {
    case R57Mode.csprng:
    case R57Mode.hardwareRng:
      return _readEntropyBytes(16);
    case R57Mode.hashEntropy:
      final seed = _readEntropyBytes(16);
      return _mixEntropy([seed]);
    case R57Mode.kdfDerived:
      final context = _readEntropyBytes(16);
      return _mixEntropy([context]);
    case R57Mode.counterKdf:
      final random = _readEntropyBytes(12);
      return _mixEntropy([random]);
    case R57Mode.timestampKdf:
      final random = _readEntropyBytes(12);
      return _mixEntropy([random]);
    case R57Mode.uuidV4Compat:
      final raw = _readEntropyBytes(16);
      raw[6] = (raw[6] & 0x0F) | 0x40;
      raw[8] = (raw[8] & 0x3F) | 0x80;
      return raw;
    case R57Mode.hybridEntropy:
      final seed = _readEntropyBytes(16);
      return _mixEntropy([seed]);
  }
}

List<int> _readEntropyBytes(int length) {
  final random = Random.secure();
  return List<int>.generate(length, (_) => random.nextInt(256));
}

List<int> _mixEntropy(List<List<int>> parts) {
  final data = <int>[];
  for (final part in parts) {
    data.addAll(part);
  }
  final hash = sha256.convert(data).bytes.toList();
  return hash.sublist(0, 16);
}

String _encodeR57_128(List<int> raw) {
  var encoded = b57.encode(raw);
  if (encoded.length == 22) return encoded;

  var derived = raw;
  while (encoded.length < 22) {
    derived = _mixEntropy([derived, [0x57]]);
    encoded = b57.encode(derived);
  }
  return encoded;
}
