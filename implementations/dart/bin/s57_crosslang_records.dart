import 'dart:io';
import 'dart:convert';

import 'package:b57/b57.dart';
import 'package:crypto/crypto.dart';

final int datasetSize = _datasetSizeFromEnv(1000);

void main() {
  final s57 = S57(
    S57Config(
      serverSecretKey: 'S57_SERVER_SECRET_KEY_MUST_BE_LONG_1234567890'.codeUnits,
      environmentSalt: 'prod-v1'.codeUnits,
      keyId: 7,
    ),
  );

  final hashes = <String>[];
  for (int i = 0; i < datasetSize; i++) {
    final input = _datasetAt(i);
    final inputHex = _hex(input);

    final h = s57.hash(input, H57Length.len256);
    final id128 = s57.id(input, ID57Length.def);
    final id256 = s57.id(input, ID57Length.len256);
    final id512 = s57.id(input, ID57Length.len512);
    final rd = s57.randomDerived('master-secret'.codeUnits, 'u-$i'.codeUnits);

    final row = '$i|$inputHex|$h|$id128|$id256|$id512|$rd';
    hashes.add(sha256.convert(utf8.encode(row)).toString());
  }

  final out = {
    'datasetSize': datasetSize,
    'hashes': hashes,
  };
  print(jsonEncode(out));
}

List<int> _datasetAt(int index) {
  final seed = sha256.convert(utf8.encode('cross-language-dataset-$index')).bytes;

  var length = index % 65;
  if (index % 10 == 0) {
    length = 0;
  }

  final data = List<int>.filled(length, 0);
  for (int j = 0; j < length; j++) {
    data[j] = seed[(j + index) % seed.length] ^ ((j * 31 + index) & 0xff);
  }

  if (length > 0 && index % 7 == 0) {
    data[0] = 0;
  }
  if (length > 1 && index % 11 == 0) {
    data[1] = 0;
  }

  return data;
}

int _datasetSizeFromEnv(int defaultValue) {
  final raw = Platform.environment['DATASET_SIZE'] ?? '';
  if (raw.isEmpty) {
    return defaultValue;
  }
  final parsed = int.tryParse(raw);
  if (parsed == null || parsed <= 0) {
    return defaultValue;
  }
  return parsed;
}

String _hex(List<int> bytes) => bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
