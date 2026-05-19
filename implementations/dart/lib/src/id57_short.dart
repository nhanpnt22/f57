library b57_id57_short;

import 'id57.dart';
import 'h57.dart';
import 'errors.dart';

enum ID57ShortLength {
  def(0),
  len23(23),
  len29(29),
  len32(32),
  len47(47),
  len70(70);

  final int value;
  const ID57ShortLength(this.value);
}

String id57ShortGenerate(List<int> input, HashFunction? hashFn, ID57ShortLength length) {
  final effective = _resolveShortLength(length);
  return id57Generate(input, hashFn, effective);
}

String id57ShortGenerateDefault(List<int> input) =>
    id57ShortGenerate(input, HashFunction.sha256, ID57ShortLength.def);

bool id57ShortVerify(
    List<int> input, HashFunction? hashFn, String id57String, ID57ShortLength length) {
  try {
    return id57ShortGenerate(input, hashFn, length) == id57String;
  } catch (_) {
    return false;
  }
}

bool id57ShortVerifyDefault(List<int> input, String id57String) =>
    id57ShortVerify(input, HashFunction.sha256, id57String, ID57ShortLength.def);

bool id57ShortIsValid(String id57String) => id57IsValid(id57String);
bool id57ShortIsCanonical(String id57String) => id57IsCanonical(id57String);

ID57Length _resolveShortLength(ID57ShortLength length) {
  switch (length) {
    case ID57ShortLength.def:
      return ID57Length.len47;
    case ID57ShortLength.len23:
      return ID57Length.len23;
    case ID57ShortLength.len29:
      return ID57Length.len29;
    case ID57ShortLength.len32:
      return ID57Length.len32;
    case ID57ShortLength.len47:
      return ID57Length.len47;
    case ID57ShortLength.len70:
      return ID57Length.len70;
  }
}
