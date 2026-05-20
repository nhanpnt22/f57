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

String i57Id(List<int> input, ID57Length length) =>
    id57Generate(input, length);

bool i57IsValid(String input) => b57.isValid(input);
bool i57IsCanonical(String input) => b57.isCanonical(input);
