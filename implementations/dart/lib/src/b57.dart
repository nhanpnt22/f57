library b57_core;

import 'dart:math' as math;
import 'errors.dart';

const String alphabet =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz123456789';
const int base = 57;

/// log2(57), used to derive B57's bignum-encoded character bounds.
final double _log2Base = math.log(base) / math.log(2);

final List<int> _alphaIndex = _buildAlphaIndex();

List<int> _buildAlphaIndex() {
  final index = List<int>.filled(256, -1);
  for (int i = 0; i < alphabet.length; i++) {
    index[alphabet.codeUnitAt(i)] = i;
  }
  return index;
}

String encode(List<int> data) {
  if (data.isEmpty) return '';

  int leadingZeros = 0;
  while (leadingZeros < data.length && data[leadingZeros] == 0) {
    leadingZeros++;
  }

  if (leadingZeros == data.length) {
    return 'A' * data.length;
  }

  // BigInt handling
  BigInt num = BigInt.zero;
  for (int i = leadingZeros; i < data.length; i++) {
    num = num * BigInt.from(256) + BigInt.from(data[i]);
  }

  final baseBig = BigInt.from(base);
  List<int> out = [];

  while (num > BigInt.zero) {
    final rem = (num % baseBig).toInt();
    num = num ~/ baseBig;
    out.add(alphabet.codeUnitAt(rem));
  }

  out = out.reversed.toList();
  final result = StringBuffer('A' * leadingZeros);
  for (final code in out) {
    result.writeCharCode(code);
  }
  return result.toString();
}

List<int> decode(String s) {
  if (s.isEmpty) return [];

  for (int i = 0; i < s.length; i++) {
    final code = s.codeUnitAt(i);
    if (_alphaIndex[code] < 0) {
      throw InvalidCharError(i, code);
    }
  }

  int leadingZeros = 0;
  while (leadingZeros < s.length && _alphaIndex[s.codeUnitAt(leadingZeros)] == 0) {
    leadingZeros++;
  }

  if (leadingZeros == s.length) {
    _verifyCanonical(s, List<int>.filled(s.length, 0));
    return List<int>.filled(s.length, 0);
  }

  BigInt num = BigInt.zero;
  final baseBig = BigInt.from(base);
  for (int i = leadingZeros; i < s.length; i++) {
    final idx = _alphaIndex[s.codeUnitAt(i)];
    num = num * baseBig + BigInt.from(idx);
  }

  final numBytes = num.toRadixString(16);
  final padded = '0' * ((numBytes.length % 2) != 0 ? 1 : 0) + numBytes;
  List<int> decoded = [];
  for (int i = 0; i < padded.length; i += 2) {
    decoded.add(int.parse(padded.substring(i, i + 2), radix: 16));
  }

  final result = List<int>.filled(leadingZeros + decoded.length, 0);
  result.setRange(leadingZeros, leadingZeros + decoded.length, decoded);

  _verifyCanonical(s, result);
  return result;
}

bool isValid(String s) {
  return s.isEmpty || s.codeUnits.every((c) => _alphaIndex[c] >= 0);
}

bool isCanonical(String s) {
  if (s.isEmpty) return true;
  if (!isValid(s)) return false;
  try {
    return encode(decode(s)) == s;
  } catch (_) {
    return false;
  }
}

/// Maximum B57 character count for [byteLen] raw bytes:
/// ceil(byteLen * 8 / log2(57)). B57 is a bignum-style positional
/// encoding, so this is an upper BOUND on encoded length, not a fixed
/// value (ID57 Core API 7.3 / 11.4).
int encodedLength(int byteLen) {
  if (byteLen == 0) return 0;
  return (byteLen * 8 / _log2Base).ceil();
}

int decodedLength(int charLen) {
  if (charLen == 0) return 0;
  return (charLen * _log2Base / 8).floor();
}

void _verifyCanonical(String original, List<int> decoded) {
  if (encode(decoded) != original) {
    throw NonCanonicalError();
  }
}

class InvalidCharError extends B57Error {
  InvalidCharError(int index, int charCode)
      : super(
          code: 'INVALID_CHAR',
          message: 'invalid character ${String.fromCharCode(charCode)}',
          index: index,
        );
}

class NonCanonicalError extends B57Error {
  NonCanonicalError()
      : super(
          code: 'NON_CANONICAL',
          message: 'non-canonical encoding',
        );
}

