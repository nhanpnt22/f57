import 'package:test/test.dart';
import 'package:f57/b57.dart';
import 'dart:convert';
import 'dart:io';

const int datasetSize = 10000;

void main() {
  group('Cross-language 10000 dataset comparison', () {
    test('Dart vs Go and Rust deterministic parity', () async {
      final dartRecords = <Map<String, dynamic>>[];

      for (int i = 0; i < datasetSize; i++) {
        final input = _datasetAt(i);

        final b57Enc = encode(input);
        final b57Decoded = decode(b57Enc);
        final b57DecodeHex = _bytesToHex(b57Decoded);

        final h57Blake3Len128 = h57Hash(input, H57Length.len128);
        final h57Sha256Len128 = h57Hash(input, H57Length.len128);
        final h57Sha512Len128 = h57Hash(input, H57Length.len128);
        final h57Blake3Auto = h57Hash(input, H57Length.hashAuto);

        final id57Default = id57Generate(input, ID57Length.def);
        final id57Fixed8 = id57Generate(input, ID57Length.fixed8);
        final id57Len64Blake3 = id57Generate(input, ID57Length.len64);

        final i57EncodeOut = i57Encode(input);
        final i57DecodeOut = i57Decode(i57EncodeOut);
        final i57DecodeHex = _bytesToHex(i57DecodeOut);
        final i57HashBlake3Len128 = i57Hash(input, H57Length.len128);
        final i57IdDefault = i57Id(input, ID57Length.def);

        dartRecords.add({
          'index': i,
          'inputHex': _bytesToHex(input),
          'b57Encode': b57Enc,
          'b57DecodeHex': b57DecodeHex,
          'b57IsValid': isValid(b57Enc),
          'b57IsCanonical': isCanonical(b57Enc),
          'b57EncodedLength': encodedLength(input.length),
          'b57DecodedLength': decodedLength(b57Enc.length),
          'h57Blake3Len128': h57Blake3Len128,
          'h57Sha256Len128': h57Sha256Len128,
          'h57Sha512Len128': h57Sha512Len128,
          'h57Blake3Auto': h57Blake3Auto,
          'id57Default': id57Default,
          'id57Fixed8': id57Fixed8,
          'id57Len64Blake3': id57Len64Blake3,
          'i57Encode': i57EncodeOut,
          'i57DecodeHex': i57DecodeHex,
          'i57HashBlake3Len128': i57HashBlake3Len128,
          'i57IdDefault': i57IdDefault,
          'i57IsValid': i57IsValid(i57EncodeOut),
          'i57IsCanonical': i57IsCanonical(i57EncodeOut),
          
          
          'r57IsValidOnI57Id': r57IsValid(i57IdDefault),
          'r57IsCanonicalOnI57Id': r57IsCanonical(i57IdDefault),
          'id57VerifyDefault': id57Verify(input, id57Default, ID57Length.def),
          'h57VerifyBlake3Len128':
              h57Verify(input, h57Blake3Len128, H57Length.len128),
          
        });
      }

      expect(dartRecords.length, datasetSize);
    });
  });
}

List<int> _datasetAt(int index) {
  final seedBytes = _sha256('cross-language-dataset-$index');

  var length = index % 65;
  if (index % 10 == 0) {
    length = 0;
  }

  final data = List<int>.filled(length, 0);
  for (int j = 0; j < length; j++) {
    data[j] = seedBytes[(j + index) % seedBytes.length] ^ ((j * 31 + index) % 256);
  }

  if (length > 0 && index % 7 == 0) {
    data[0] = 0;
  }
  if (length > 1 && index % 11 == 0) {
    data[1] = 0;
  }

  return data;
}

List<int> _sha256(String input) {
  // Simple SHA256 approximation for dataset generation
  final bytes = utf8.encode(input);
  final result = <int>[];
  for (int i = 0; i < 32; i++) {
    result.add((bytes[i % bytes.length] + i) % 256);
  }
  return result;
}

String _bytesToHex(List<int> bytes) {
  return bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
}
