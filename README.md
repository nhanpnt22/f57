# F57 - Dart Implementation

**F57 for Dart**

This branch contains the Dart implementation of the F57 (57-Series) encoding family, including B57, H57, I57, ID57 (incl. fixed-width lengths), R57, and S57.

## Quick Start

```bash
# Get dependencies
pubspec get

# Run all tests
dart test

# Build (if applicable)
dart run
```

## Project Structure

```
dart/
├── lib/
│   ├── b57.dart           # B57 encoding (main export)
│   └── src/
│       ├── b57.dart       # Core B57 implementation
│       ├── h57.dart       # H57 hash representation
│       ├── i57.dart       # I57 identifiers
│       ├── id57.dart      # ID57 profiles
│       ├── r57.dart       # R57 random generation
│       ├── s57.dart       # S57 security composition
│       └── errors.dart    # Error types
├── test/
│   ├── b57_test.dart
│   ├── h57_test.dart
│   ├── i57_test.dart
│   ├── id57_test.dart
│   ├── r57_test.dart
│   ├── s57_e2e_test.dart
│   ├── e2e_test.dart
│   └── [other tests]
├── bin/
│   ├── benchmark.dart          # B57/H57/ID57 benchmarks
│   ├── s57_crosslang_records.dart
│   └── crosslang_records.dart
├── pubspec.yaml
├── pubspec.lock
└── README.md
```

## Key Files

- **[pubspec.yaml](pubspec.yaml)** - Package manifest and dependencies
- **[lib/b57.dart](lib/b57.dart)** - Main B57 module (public API)
- **[lib/src/s57.dart](lib/src/s57.dart)** - S57 security layer
- **[test/b57_test.dart](test/b57_test.dart)** - B57 unit tests
- **[test/s57_e2e_test.dart](test/s57_e2e_test.dart)** - End-to-end tests

## API Overview

### B57 - Binary-to-Text Encoding

```dart
import 'package:f57/b57.dart';

// Encode bytes to B57 string
final bytes = [1, 2, 3, 4];
final encoded = B57.encode(bytes);
print(encoded); // B57 string

// Decode B57 string to bytes
final decoded = B57.decode(encoded);
assert(decoded == bytes);
```

### H57 - Hash Representation

```dart
// Hash input to full-length B57 representation
final input = [1, 2, 3];
final hash = H57.hash(input); // 44-character B57 string (256-bit)
```

### ID57 - Identifiers

```dart
// Generate deterministic identifier (16-22 chars; length is a bound, not fixed)
final id = ID57.id([1, 2, 3]); // ID57Length.DEFAULT

// Fixed-width identifiers use a NEGATIVE length_enum - the magnitude is the
// exact character count (a prefix cut of the LEN_128 id), not a bound
final shortId = ID57.id([1, 2, 3], ID57Length.FIXED_8); // always exactly 8 chars
```

### R57 - Random Generation

```dart
// Generate cryptographically secure random identifier
final random = R57.random(); // 128-bit random string
```

### S57 - Security Composition

```dart
import 'package:f57/src/s57.dart';

final s57 = S57(
  serverSecretKey: utf8.encode('SECRET_KEY_LONG_ENOUGH_32_BYTES'),
  environmentSalt: utf8.encode('prod-v1'),
  keyId: 7,
);

// Hash with S57
final hash = s57.hash([1, 2, 3], H57Length.len256);

// ID with S57
final id = s57.id([1, 2, 3], ID57Length.default_);

// Encryption/Decryption
final aad = utf8.encode('additional data');
final encrypted = s57.encrypt([1, 2, 3], aad);
final decrypted = s57.decrypt(encrypted, aad);
```

## Running Tests

```bash
# All tests
dart test

# Specific test file
dart test test/b57_test.dart

# With coverage
dart pub global activate coverage
dart pub run coverage:format_coverage --packages=.packages --report-on=lib

# E2E tests
dart test test/s57_e2e_test.dart

# Benchmarks
dart run bin/benchmark.dart
```

## Dependencies

- **crypto** - BLAKE3 hashing
- **pointycastle** - For AES-256-GCM encryption (S57)

See [pubspec.yaml](pubspec.yaml) for complete dependency list.

## Specification References

- **B57 Encoding:** [spec/b57-core-api.txt](../spec/b57-core-api.txt)
- **H57 Hash:** [spec/h57-core-api.txt](../spec/h57-core-api.txt)
- **ID57 Identifiers:** [spec/id57-core-api.txt](../spec/id57-core-api.txt)
- **R57 Random:** [spec/r57-core-api.txt](../spec/r57-core-api.txt)
- **S57 Security:** [spec/s57-security-57.txt](../spec/s57-security-57.txt)

## Branch Information

- **Branch:** `dart` (Dart-only implementation)
- **Version:** v0.2.0
- **Release Branch:** `release/dart-v0.2.0`
- **Status:** Production Ready
- **Last Updated:** June 2026

## Multi-Language Support

This repository provides implementations in multiple languages with **guaranteed cross-language parity**:

- **Dart** (this branch)
- **Go** - [View `go` branch](../../../tree/go)
- **Rust** - [View `rust` branch](../../../tree/rust)
- **JavaScript** - [View `javascript` branch](../../../tree/javascript)
- **TypeScript** - [View `ts` branch](../../../tree/ts)
- **Python** - [View `python` branch](../../../tree/python)
- **All** - [View `main` branch](../../../tree/main)

Clone only this language:
```bash
git clone --branch dart https://github.com/your-org/f57.git
```

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## Security

See [SECURITY.md](../../SECURITY.md) for vulnerability reporting and security policies.

## License

Internal Restricted - See [LICENSE](../../LICENSE) and [LICENSE.md](../../LICENSE.md)

---

**Version:** v0.2.0  
**Last Updated:** June 2026
