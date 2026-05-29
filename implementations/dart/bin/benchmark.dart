import 'dart:convert';
import 'package:f57/b57.dart';

void main() {
  const iterations = 100000;
  final data = List<int>.filled(32, 0);
  final encodedStrs = List<String>.filled(iterations, "");

  var start = DateTime.now();
  for (var i = 0; i < iterations; i++) {
    data[0] = i & 0xFF;
    data[1] = (i >> 8) & 0xFF;
    encodedStrs[i] = encode(data);
  }
  final encodeMs = DateTime.now().difference(start).inMilliseconds;

  start = DateTime.now();
  for (var i = 0; i < iterations; i++) {
    decode(encodedStrs[i]);
  }
  final decodeMs = DateTime.now().difference(start).inMilliseconds;

  start = DateTime.now();
  for (var i = 0; i < iterations; i++) {
    data[0] = i & 0xFF;
    data[1] = (i >> 8) & 0xFF;
    id57GenerateDefault(data);
  }
  final idMs = DateTime.now().difference(start).inMilliseconds;

  print(jsonEncode({
    "language": "Dart",
    "encode_ms": encodeMs,
    "decode_ms": decodeMs,
    "id57_ms": idMs,
    "iterations": iterations
  }));
}
