library b57_i57;

import 'dart:math';
import 'b57.dart' as b57;
import 'h57.dart';
import 'id57.dart';
import 'r57.dart';

String i57Encode(List<int> input) => b57.encode(input);

List<int> i57Decode(String input) => b57.decode(input);

String i57Hash(List<int> input, HashFunction hashFn, H57Length length) =>
    h57Hash(input, hashFn, length);

String i57Random(R57Mode mode) => r57Generate(mode);

String i57Id(List<int> input, HashFunction? hashFn, ID57Length length) =>
    id57Generate(input, hashFn, length);

bool i57IsValid(String input) => input.isNotEmpty && b57.isValid(input);
bool i57IsCanonical(String input) => input.isNotEmpty && b57.isCanonical(input);

bool i57ValidateIdentifier(String input) =>
    input.length == 22 && i57IsValid(input) && i57IsCanonical(input);

bool i57ValidateEntropy(String input) {
  if (!i57ValidateIdentifier(input)) return false;
  if (!_passesCharacterDiversity(input)) return false;
  if (_hasRepeatedHalfPattern(input)) return false;
  return !_isSingleRepeatedPattern(input.toLowerCase());
}

bool _passesCharacterDiversity(String input) {
  final unique = input.codeUnits.toSet();
  final maxRun = _longestRunLength(input);
  return unique.length >= 4 && maxRun <= input.length ~/ 2;
}

int _longestRunLength(String input) {
  if (input.isEmpty) return 0;
  int maxRun = 1, current = 1;
  for (int i = 1; i < input.length; i++) {
    if (input.codeUnitAt(i) == input.codeUnitAt(i - 1)) {
      current++;
      maxRun = max(maxRun, current);
    } else {
      current = 1;
    }
  }
  return maxRun;
}

bool _hasRepeatedHalfPattern(String input) {
  if (input.length % 2 != 0) return false;
  final half = input.length ~/ 2;
  return input.substring(0, half) == input.substring(half);
}

bool _isSingleRepeatedPattern(String input) {
  if (input.isEmpty) return false;
  final first = input[0];
  return input.codeUnits.every((c) => c == first.codeUnitAt(0));
}
