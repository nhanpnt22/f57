library b57_s57;

import 'dart:math';
import 'dart:typed_data';

import 'package:blake3_dart/blake3_dart.dart';
import 'package:cryptography/cryptography.dart';

import 'b57.dart' as b57;
import 'errors.dart';
import 'h57.dart';
import 'id57.dart';

const int s57Version = 0x01;

class S57Config {
  final List<int> serverSecretKey;
  final List<int> environmentSalt;
  final int keyId;

  S57Config({
    required this.serverSecretKey,
    required this.environmentSalt,
    this.keyId = 1,
  });
}

class S57Keys {
  final List<int> b57Aes256Key;
  final List<int> h57Key;
  final List<int> id57Key;
  final int keyId;

  S57Keys({
    required this.b57Aes256Key,
    required this.h57Key,
    required this.id57Key,
    required this.keyId,
  });
}

class S57 {
  final List<int> _serverSecret;
  final List<int> _envSalt;
  final S57Keys keys;

  S57._(this._serverSecret, this._envSalt, this.keys);

  factory S57(S57Config config) {
    if (config.serverSecretKey.length < 32 || config.environmentSalt.isEmpty) {
      throw KeyInvalidError();
    }

    final serverSecret = List<int>.from(config.serverSecretKey);
    final envSalt = List<int>.from(config.environmentSalt);
    final keyId = config.keyId == 0 ? 1 : (config.keyId & 0xff);

    final seed = Uint8List.fromList([...serverSecret, ...envSalt]);
    final keys = S57Keys(
      b57Aes256Key: blake3DeriveKey(
        context: 'S57/B57_AES_256/v1',
        keyMaterial: seed,
        outputLength: 32,
      ),
      h57Key: blake3DeriveKey(
        context: 'S57/H57_KEY/v1',
        keyMaterial: seed,
        outputLength: 32,
      ),
      id57Key: blake3DeriveKey(
        context: 'S57/ID57_KEY/v1',
        keyMaterial: seed,
        outputLength: 32,
      ),
      keyId: keyId,
    );

    return S57._(serverSecret, envSalt, keys);
  }

  S57Keys resolveKeys([int? keyId]) {
    final effective = keyId == null ? keys.keyId : (keyId & 0xff);
    final seed = Uint8List.fromList([..._serverSecret, ..._envSalt]);
    return S57Keys(
      b57Aes256Key: blake3DeriveKey(
        context: 'S57/B57_AES_256/v1',
        keyMaterial: seed,
        outputLength: 32,
      ),
      h57Key: blake3DeriveKey(
        context: 'S57/H57_KEY/v1',
        keyMaterial: seed,
        outputLength: 32,
      ),
      id57Key: blake3DeriveKey(
        context: 'S57/ID57_KEY/v1',
        keyMaterial: seed,
        outputLength: 32,
      ),
      keyId: effective,
    );
  }

  String hash(List<int> data, [H57Length length = H57Length.len256]) {
    final bits = _resolveS57H57Bits(length);
    final requested = (bits + 7) ~/ 8;
    final out = blake3Keyed(
      Uint8List.fromList(keys.h57Key),
      Uint8List.fromList(data),
      requested,
    );
    _maskExcessBits(out, bits);
    return b57.encode(out);
  }

  String id(List<int> data, [ID57Length length = ID57Length.def]) {
    final effective = length == ID57Length.def ? ID57Length.len128 : length;
    final bits = _bitsByLength(effective);
    if (bits != 128 && bits != 256 && bits != 512) {
      throw InvalidLengthEnumError(length.value);
    }

    final requested = (bits + 7) ~/ 8;
    final out = blake3Keyed(
      Uint8List.fromList(keys.id57Key),
      Uint8List.fromList(data),
      requested,
    );
    _maskExcessBits(out, bits);
    return b57.encode(out);
  }

  String random() => _encodeR57128(_readEntropyBytes(16));

  String randomTime() {
    final nowSecs = DateTime.now().millisecondsSinceEpoch ~/ 1000;
    final timeBytes = ByteData(4)..setUint32(0, nowSecs & 0xffffffff, Endian.big);
    final random = _readEntropyBytes(12);
    final mixed = blake3(Uint8List.fromList([...timeBytes.buffer.asUint8List(), ...random]), 16);
    return _encodeR57128(mixed);
  }

  String randomCounter(int counter) {
    final c = ByteData(4)..setUint32(0, counter & 0xffffffff, Endian.big);
    final random = _readEntropyBytes(12);
    final mixed = blake3(Uint8List.fromList([...c.buffer.asUint8List(), ...random]), 16);
    return _encodeR57128(mixed);
  }

  String randomSession(List<int> sessionSecret) {
    final nonce = _readEntropyBytes(16);
    final key = blake3DeriveKey(
      context: 'S57/R57_SESSION/v1',
      keyMaterial: Uint8List.fromList(sessionSecret),
      outputLength: 32,
    );
    final mixed = blake3Keyed(Uint8List.fromList(key), Uint8List.fromList(nonce), 16);
    return _encodeR57128(mixed);
  }

  String randomDevice(List<int> deviceSecret) {
    final nonce = _readEntropyBytes(16);
    final key = blake3DeriveKey(
      context: 'S57/R57_DEVICE/v1',
      keyMaterial: Uint8List.fromList(deviceSecret),
      outputLength: 32,
    );
    final mixed = blake3Keyed(Uint8List.fromList(key), Uint8List.fromList(nonce), 16);
    return _encodeR57128(mixed);
  }

  String randomDerived(List<int> masterSecret, List<int> uniqueInput) {
    final key = blake3DeriveKey(
      context: 'S57/R57_DERIVED/v1',
      keyMaterial: Uint8List.fromList(masterSecret),
      outputLength: 32,
    );
    final mixed = blake3Keyed(Uint8List.fromList(key), Uint8List.fromList(uniqueInput), 16);
    return _encodeR57128(mixed);
  }

  String randomHardened() {
    final entropy = _readEntropyBytes(16);
    return _encodeR57128(blake3(Uint8List.fromList(entropy), 16));
  }

  String randomHybrid(List<List<int>> sources) {
    if (sources.isEmpty) {
      throw InvalidInputError('random_hybrid requires at least one source');
    }
    final merged = <int>[];
    for (final source in sources) {
      merged.addAll(source);
    }
    return _encodeR57128(blake3(Uint8List.fromList(merged), 16));
  }

  Future<String> encrypt(List<int> plaintext, [List<int>? aad]) async {
    if (keys.b57Aes256Key.length != 32) {
      throw KeyInvalidError();
    }

    final nonce = _readEntropyBytes(12);
    final algorithm = AesGcm.with256bits();
    final secretKey = SecretKey(keys.b57Aes256Key);
    final box = await algorithm.encrypt(
      plaintext,
      secretKey: secretKey,
      nonce: nonce,
      aad: aad ?? const <int>[],
    );

    final envelope = <int>[
      s57Version,
      keys.keyId,
      ...nonce,
      ...box.cipherText,
      ...box.mac.bytes,
    ];
    return b57.encode(envelope);
  }

  Future<List<int>> decrypt(String encodedEnvelope, [List<int>? aad, int? expectedKeyId]) async {
    final env = b57.decode(encodedEnvelope);
    if (env.length < 30) {
      throw InvalidInputError('invalid envelope length');
    }

    final version = env[0];
    if (version != s57Version) {
      throw InvalidVersionError(version);
    }

    final keyId = env[1];
    if (expectedKeyId != null && keyId != (expectedKeyId & 0xff)) {
      throw KeyUnavailableError(keyId);
    }
    if (keyId != keys.keyId) {
      throw KeyUnavailableError(keyId);
    }

    final nonce = env.sublist(2, 14);
    final ciphertextWithTag = env.sublist(14);
    if (ciphertextWithTag.length < 16) {
      throw InvalidInputError('invalid envelope length');
    }

    final ciphertext = ciphertextWithTag.sublist(0, ciphertextWithTag.length - 16);
    final mac = Mac(ciphertextWithTag.sublist(ciphertextWithTag.length - 16));

    final algorithm = AesGcm.with256bits();
    final secretKey = SecretKey(keys.b57Aes256Key);
    try {
      return await algorithm.decrypt(
        SecretBox(ciphertext, nonce: nonce, mac: mac),
        secretKey: secretKey,
        aad: aad ?? const <int>[],
      );
    } catch (_) {
      throw AuthFailureError();
    }
  }
}

int _resolveS57H57Bits(H57Length length) {
  if (length == H57Length.hashAuto) {
    return 256;
  }
  if (length == H57Length.len128) return 128;
  if (length == H57Length.len256) return 256;
  if (length == H57Length.len512) return 512;
  throw InvalidLengthEnumError(length.value);
}

List<int> _readEntropyBytes(int length) {
  final random = Random.secure();
  return List<int>.generate(length, (_) => random.nextInt(256));
}

String _encodeR57128(List<int> raw) {
  var encoded = b57.encode(raw);
  if (encoded.length == 22) {
    return encoded;
  }

  var derived = List<int>.from(raw);
  while (encoded.length < 22) {
    derived = blake3(Uint8List.fromList([...derived, 0x57]), 16).toList();
    encoded = b57.encode(derived);
  }
  return encoded;
}

int _bitsByLength(ID57Length length) {
  const bits = {
    ID57Length.len23: 23,
    ID57Length.len29: 29,
    ID57Length.len32: 32,
    ID57Length.len47: 47,
    ID57Length.len64: 64,
    ID57Length.len70: 70,
    ID57Length.len93: 93,
    ID57Length.len128: 128,
    ID57Length.len186: 186,
    ID57Length.len256: 256,
    ID57Length.len373: 373,
    ID57Length.len512: 512,
  };
  if (!bits.containsKey(length)) {
    throw InvalidLengthEnumError(length.value);
  }
  return bits[length]!;
}

void _maskExcessBits(List<int> bytes, int bitLength) {
  if (bytes.isEmpty) {
    return;
  }
  final excess = bytes.length * 8 - bitLength;
  if (excess <= 0) {
    return;
  }
  final mask = (0xff << excess) & 0xff;
  bytes[bytes.length - 1] &= mask;
}
