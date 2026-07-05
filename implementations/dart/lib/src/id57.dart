library b57_id57;

import 'dart:typed_data';
import 'package:blake3_dart/blake3_dart.dart';
import 'b57.dart' as b57;
import 'errors.dart';

/// ID57 length selector (ID57 Core API v0.3.1, section 7).
///
/// [def] (0) resolves to [len128].
///
/// The SIGN selects the generation mode:
///
/// - POSITIVE values select a BIT LENGTH (7.1, security model). Character
///   width is a [min_chars, max_chars] BOUND, never fixed - B57 is a
///   bignum-style positional encoding, so exact width depends on the
///   numeric value of the truncated hash.
/// - NEGATIVE values select a FIXED character WIDTH (7.2, non-security).
///   The magnitude is the exact output width, always. Produced by cutting
///   the [len128] identifier of the same input to that many characters
///   (5.2) - not by truncating fewer hash bits, which cannot guarantee an
///   exact width under B57's bignum encoding.
///
/// There is no separate short-identifier type or function prefix; the
/// former ID57-SHORT companion profile is fully merged here (10).
class ID57Length {
  ID57Length._();

  static const int def = 0;

  // Bit lengths (security model, REQUIRED, 7.1). Bound, not fixed, width.
  static const int len8 = 8;
  static const int len16 = 16;
  static const int len32 = 32;
  static const int len64 = 64;
  static const int len128 = 128; // DEFAULT
  static const int len256 = 256;
  static const int len512 = 512;

  // Fixed widths (non-security, 7.2). Magnitude = exact character count.
  static const int fixed2 = -2;
  static const int fixed3 = -3;
  static const int fixed4 = -4;
  static const int fixed5 = -5;
  static const int fixed6 = -6;
  static const int fixed7 = -7;
  static const int fixed8 = -8;
  static const int fixed9 = -9;
  static const int fixed10 = -10;
  static const int fixed11 = -11;
  static const int fixed12 = -12;
}

const Set<int> _bitLengths = {
  ID57Length.len8,
  ID57Length.len16,
  ID57Length.len32,
  ID57Length.len64,
  ID57Length.len128,
  ID57Length.len256,
  ID57Length.len512,
};

const Set<int> _fixedWidths = {2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12};

/// Resolves [ID57Length.def] to [ID57Length.len128] and validates
/// [length]:
///
/// - positive values MUST be one of the defined bit lengths (7.1)
/// - negative values MUST have a magnitude in the defined FIXED_k set (7.2)
///
/// Throws [InvalidLengthEnumError] otherwise. The returned value keeps its
/// sign: positive means "bit length" (and the value itself is the bit
/// count), negative means "fixed width" (magnitude is the exact char
/// count).
int resolveID57Length(int length) {
  if (length == ID57Length.def) {
    return ID57Length.len128;
  }
  if (length < 0) {
    if (!_fixedWidths.contains(-length)) {
      throw InvalidLengthEnumError(length);
    }
    return length;
  }
  if (!_bitLengths.contains(length)) {
    throw InvalidLengthEnumError(length);
  }
  return length;
}

/// Zeroes bits beyond [bitLength] in the final byte of [bytes], in place
/// (ID57 Core API 8: excess bits MUST be truncated, not rounded).
void maskExcessBits(List<int> bytes, int bitLength) {
  if (bytes.isEmpty) return;
  final excess = bytes.length * 8 - bitLength;
  if (excess <= 0) return;
  final mask = (0xff << excess) & 0xff;
  bytes[bytes.length - 1] &= mask;
}

/// id57_generate (ID57 Core API 5.1/5.2).
///
/// `input -> HASH -> truncate -> B57` for positive/DEFAULT [length] (bit
/// length mode, unchanged pipeline). For negative [length] (FIXED_k, k =
/// -length), returns the first k characters of the LEN_128 identifier of
/// the same input - the sole permitted post-encoding truncation (8, 14).
String id57Generate(List<int> input, [int length = ID57Length.def]) {
  final effective = resolveID57Length(length);

  if (effective < 0) {
    // Fixed width (5.2): prefix-cut the LEN_128 identifier. LEN_128 output
    // is always >= 16 chars and every FIXED_k has k <= 12, so the cut
    // always yields exactly k characters.
    final k = -effective;
    final full = id57Generate(input, ID57Length.len128);
    return full.substring(0, k);
  }

  // Bit length (5.1/7.1): variable width within [min_chars, max_chars] (7.3).
  final bits = effective;
  final requested = (bits + 7) ~/ 8;
  final hashBytes = blake3(Uint8List.fromList(input), requested).toList();
  maskExcessBits(hashBytes, bits);
  return b57.encode(hashBytes);
}

/// Convenience wrapper for [id57Generate] with [ID57Length.def].
String id57GenerateDefault(List<int> input) =>
    id57Generate(input, ID57Length.def);

/// id57_verify (ID57 Core API 11.1).
bool id57Verify(List<int> input, String id57String,
    [int length = ID57Length.def]) {
  try {
    final expected = id57Generate(input, length);
    return id57String == expected;
  } catch (_) {
    return false;
  }
}

/// Convenience wrapper for [id57Verify] with [ID57Length.def].
bool id57VerifyDefault(List<int> input, String id57String) =>
    id57Verify(input, id57String, ID57Length.def);

/// id57_is_valid (ID57 Core API 11.2).
bool id57IsValid(String id57String) => b57.isValid(id57String);

/// id57_is_canonical (ID57 Core API 11.3).
bool id57IsCanonical(String id57String) => b57.isCanonical(id57String);

/// id57_range (ID57 Core API 11.4) -> (min_chars, max_chars).
///
/// For a fixed width (negative [length]), min == max == k. For a bit
/// length (positive/DEFAULT), returns the [min_chars, max_chars] bound
/// (7.3) - never a fixed width.
({int min, int max}) id57Range([int length = ID57Length.def]) {
  final effective = resolveID57Length(length);

  if (effective < 0) {
    final k = -effective;
    return (min: k, max: k);
  }

  final bits = effective;
  final byteLength = (bits + 7) ~/ 8;
  return (min: byteLength, max: b57.encodedLength(byteLength));
}

/// id57_is_length (ID57 Core API 11.5).
///
/// Defined ONLY for fixed widths (negative [length], 7.2); throws
/// [InvalidLengthEnumError] for any positive/bit-length value or DEFAULT -
/// it is not a general bit-length validator. For bit lengths, use
/// [id57Range] for the bound and [id57IsCanonical]/[id57Verify] for
/// validation instead.
///
/// Checks exactly two things: the string is valid B57 (alphabet) and it is
/// exactly k characters. It MUST NOT decode or check canonical form -
/// fixed-width output is a PREFIX of a bignum encoding, not a canonical B57
/// string, so decoding it is meaningless.
bool id57IsLength(String id57String, int length) {
  final effective = resolveID57Length(length);
  if (effective >= 0) {
    throw InvalidLengthEnumError(length);
  }

  final k = -effective;
  return id57String.length == k && id57IsValid(id57String);
}
