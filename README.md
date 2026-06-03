# F57 - 57 Family

**Tagline:** A unified family of secure, deterministic 57-series encodings.

**Description:** F57 is the umbrella architecture for the 57-series standards and implementations (B57, H57, I57, ID57, ID57-SHORT, R57, S57) delivered across Go, Rust, JavaScript/Node.js, TypeScript/Node.js, Dart, and Python.

**Purpose:** Provide one canonical, cross-language foundation for readable encoding, deterministic identifiers, secure random generation, and security composition, with release-grade parity guarantees.

---

## 🌍 Multi-Language Repository Structure

This repository uses **language-specific branches** to keep clones focused and lightweight:

### Quick Start by Language

| Language | Branch | Clone Command |
|----------|--------|---------------|
| **Dart** | `dart` | `git clone --branch dart https://github.com/your-org/f57.git` |
| **Go** | `go` | `git clone --branch go https://github.com/your-org/f57.git` |
| **JavaScript** | `javascript` | `git clone --branch javascript https://github.com/your-org/f57.git` |
| **Python** | `python` | `git clone --branch python https://github.com/your-org/f57.git` |
| **Rust** | `rust` | `git clone --branch rust https://github.com/your-org/f57.git` |
| **TypeScript** | `ts` | `git clone --branch ts https://github.com/your-org/f57.git` |
| **All Languages** | `main` | `git clone https://github.com/your-org/f57.git` |

### Branch Information

- **Language Branches** (`dart`, `go`, `javascript`, `python`, `rust`, `ts`): Each contains only that language's implementation, plus shared specs and documentation
- **Release Branches** (`release/{language}-v{version}`): Version-specific branches for each language
- **Main Branch** (`main`): Contains all 6 language implementations
- **Documentation**: See [LANGUAGE_BRANCHES.md](LANGUAGE_BRANCHES.md) for complete branching strategy

Each language branch includes:
- ✅ Language-specific implementation code
- ✅ Language-specific README
- ✅ Shared F57 specifications (`spec/`)
- ✅ Common documentation (LICENSE, CONTRIBUTING, SECURITY, etc.)
- ❌ **NO** other language implementations
- ❌ **NO** cross-language benchmarks or multi-language test data

---

## B57 Protocol Stack (Base Layer)

**Canonical Binary-to-Text and Identifier Architecture**
**Version:** v0.1.0 FINAL
**Status:** Official Release (Production-Ready, repository tag v0.1.1)
**Date:** May 2026

[![Version](https://img.shields.io/badge/version-v0.1.0_FINAL-blue.svg)](CHANGELOG.md)
[![Status](https://img.shields.io/badge/status-Production_Ready-success.svg)](PROJECT_ASSESS_RELEASE.md)
[![Parity](https://img.shields.io/badge/Cross--Language_Parity-10k_Datasets_Passed-success.svg)](UAT_10K_PARITY_REPORT.md)

## Abstract

The B57 Protocol Stack defines a unified,
layered architecture for binary encoding, hash representation,
random identification, secure composition, and identifier generation.

At its core, B57 provides a canonical, ASCII-safe binary-to-text encoding scheme designed for human readability and unambiguous transcription, enforcing a strict 57-character alphabet that excludes visually ambiguous symbols.

Building upon B57, the protocol stack establishes a rigorous pipeline for canonical data normalization:
`input → HASH → prefix truncate → B57 → string`

## Status of This Memo

This repository acts as the central standard for the B57 specification and its native reference implementations.

**Current Status:** Official protocol release v0.1.0 (repository release tag: v0.1.1). All implementations are verified, formally assessed, and production-ready.

## 1. Overview

Most identifiers and text-encodings (like Base64 or standard Base58) suffer from visually ambiguous characters or platform-specific determinism issues.

The B57 protocol eliminates this by enforcing a strict 57-character alphabet:
`ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz123456789`

(Excluded 5 visually ambiguous characters: `0`, `o`, `O`, `I`, `l`)

### Key System Properties:
- **Bijective & Deterministic:** 100% parity across distributed systems. Exactly one valid output exists per input.
- **Entropy-Preserving:** Never truncates, pads, or biases raw input at the base encoding layer.
- **One-Way Hash Transformation:** Employs BLAKE3 by default to produce secure cryptographic identifiers.

## 2. The F57 Stack Architecture

The protocol is composed of a 7-layer architecture with strict conceptual boundaries:

### 2.1 B57 (Encoding Layer)
* **Specification:** [B57 Core](spec/b57-core-api.txt)
* The canonical binary-to-text mathematical primitives.
* **Pipeline:** `bytes ↔ B57 string`
* **Properties:** bijective, unambiguous, exact byte representation.

### 2.2 H57 (Hash Representation Layer)
* **Specification:** [H57 Core](spec/h57-core-api.txt)
* Canonical representation of full cryptographic hash outputs.
* **Pipeline:** `input → BLAKE3 → bytes → B57 string`
* **Properties:** full entropy preservation (e.g., 256-bit hash → 44 chars), no truncation, ideal for content integrity.

### 2.3 ID57 (Identifier Profile)
* **Specification:** [ID57 Core](spec/id57-core-api.txt)
* Generates fixed-length, human-readable identifiers through controlled entropy reduction.
* **Pipeline:** `input → HASH → prefix truncate → B57 string`
* **Properties:** Default 128-bit (22 chars). Ensures prefix-level byte truncation prior to encoding.

### 2.4 ID57-SHORT (Ultra-Compact Profile)
* **Specification:** [ID57-SHORT](spec/id57-short-profile.txt)
* Generates heavily truncated local identifiers (e.g., 47-bit / 8 chars).
* **Properties:** Optimized strictly for QR codes, UI brevity, and temporary IDs. Requires safe namespace sizing.

### 2.5 R57 (Random Generation Profile)
* **Specification:** [R57 Core](spec/r57-core-api.txt)
* Generates high-entropy 128-bit random identifiers securely.
* **Pipeline:** `entropy_source (128-bit) → B57 string`
* **Properties:** Mandates CSPRNG, KDF, or Hybrid generation modes to ensure unpredictable, collision-resistant outputs.

### 2.6 I57 (Integration Interface)
* **Specification:** [I57 Core](spec/i57-core-api.txt)
* The top-level facade interface unifying all underlying profiles into a seamless developer API.
* Ensures correct composition and safe parameter passing.

### 2.7 S57 (Security Composition Layer)
* **Specification:** [S57 Security 57](spec/s57-security-57.txt)
* Secure composition profile over B57/H57/ID57/R57 with domain-separated key derivation and envelope encryption.
* **Pipeline:** `data -> keyed hash/id/random profile -> optional AES-256-GCM envelope -> B57 string`
* **Properties:** deterministic keyed surfaces where required, fail-closed decrypt behavior, cross-language parity validated for release.

## 3. Native Implementations

The v0.1.0 release provides fully native implementations. All implementations process arrays using native BigInt arithmetic.
S57 is implemented and release-validated across Go, Rust, JavaScript/Node.js, TypeScript/Node.js, Dart, and Python.

### 3.1 Available on Main Branch (This Branch)

Each language implementation is maintained in its own separate branch and included here on `main`:

- **Go**: [implementations/go](implementations/go) — [View `go` branch](https://github.com/your-org/f57/tree/go)
- **Rust**: [implementations/rust](implementations/rust) — [View `rust` branch](https://github.com/your-org/f57/tree/rust)
- **JavaScript**: [implementations/javascript](implementations/javascript) — [View `javascript` branch](https://github.com/your-org/f57/tree/javascript)
- **TypeScript (npm-ready package)**: [implementations/ts](implementations/ts) — [View `ts` branch](https://github.com/your-org/f57/tree/ts)
- **Dart**: [implementations/dart](implementations/dart) — [View `dart` branch](https://github.com/your-org/f57/tree/dart)
- **Python**: [implementations/python](implementations/python) — [View `python` branch](https://github.com/your-org/f57/tree/python)

### 3.2 For Language-Specific Work

If you only need one language, clone its dedicated branch instead:

```bash
# Work on only Dart
git clone --branch dart https://github.com/your-org/f57.git f57-dart

# Work on only Go
git clone --branch go https://github.com/your-org/f57.git f57-go

# etc. for python, rust, typescript, javascript
```

All passed the [10,000 Dataset Cross-Language Parity Audit](UAT_10K_PARITY_REPORT.md) proving zero deviation across execution environments.
S57 release gating also passed with zero mismatches in the 5-language benchmark summary at [implementations/cross_language_records/s57-benchmark-10000x5-summary.json](implementations/cross_language_records/s57-benchmark-10000x5-summary.json).

## 4. Recommended System Patterns

The stack encourages standard integration patterns:

- **Dual-Layer Identity:** Produce a full `H57(data)` internally for database deduplication, while exposing a targeted `ID57(data, 128-bit)` externally via APIs.
- **Storage vs. Exposure:** Use `ID57-SHORT` for printable offline receipts or tiny URLs, mapped safely to a heavily collision-resistant `H57` hash stored remotely.
- **Tamper Detection & Content Routing:** Execute exact hash matching without truncation using native length 44-character `H57` outputs.
- **Confidential Payload Transport:** Use `S57` envelope encryption (`encrypt`/`decrypt`) for authenticated payload exchange where transport-safe B57 strings are required.

## 5. Official Documentation

- [F57 Overview](F57.md) - Umbrella family definition, architecture, and versioning policy.
- [Language Branches Guide](LANGUAGE_BRANCHES.md) - Detailed branching strategy and per-language quickstart.
- [Branch Setup Summary](BRANCH_SETUP_SUMMARY.md) - Complete branch structure documentation.
- [Final Release Assessment](FINAL_RELEASE_ASSESSMENT.md) - Official v0.1.0 release sign-off and validation posture.
- [UAT 10K Parity Report](UAT_10K_PARITY_REPORT.md) - Proof of absolute deterministic data alignment.
- [S57 Final Release Report (All Languages)](implementations/FINAL_RELEASE_REPORT_S57_ALL_LANGUAGES.md) - S57 release validation across Go, Rust, Dart, Python, JavaScript/Node.js, and TypeScript/Node.js.
- [Benchmarks](BENCHMARKS.md) - ID processing ops/second across languages.
- [Security Policy](SECURITY.md) - Collision domains and vulnerability reporting.
- [Changelog](CHANGELOG.md) - Semantic version tracking.

### 5.1 Legacy Draft Specifications

Original v0.1.0 working drafts, retained for reference:
- [B57 Core Suite Framework](spec/b57-cs-v0.1.0.txt)
- [B57 Encoding Draft](spec/b57-v0.1.0.txt)
- [H57 Draft](spec/h57-v0.1.0.txt)
- [ID57 Draft](spec/id57-v0.1.0.txt)
- [R57 Draft](spec/r57-v0.1.0.txt)

## 6. Getting Started & Testing

### 6.1 Clone and Run on Main Branch (All Languages)

```bash
git clone https://github.com/your-org/f57.git f57
cd f57

# Go
cd implementations/go && go test ./...

# JavaScript
cd ../javascript && npm test

# TypeScript package verification
cd ../ts && npm run verify:all

# Rust
cd ../rust && cargo test

# Dart
cd ../dart && dart test

# Python
cd ../python && pytest
```

### 6.2 Clone and Run on Language Branch (Single Language)

```bash
# Example: Dart only
git clone --branch dart https://github.com/your-org/f57.git f57-dart
cd f57-dart/implementations/dart
pubspec get
dart test
```

### 6.3 S57 5-language Parity Benchmark

```bash
cd implementations/javascript && node scripts/s57-benchmark-10000x5.mjs
```

### 6.4 S57 Quick Start (Node.js)

```javascript
import { S57, H57Length, ID57Length } from './implementations/javascript/index.js';

const s57 = new S57({
	server_secret_key: new TextEncoder().encode('S57_SERVER_SECRET_KEY_MUST_BE_LONG_1234567890'),
	environment_salt: new TextEncoder().encode('prod-v1'),
	key_id: 7
});

const input = new TextEncoder().encode('hello-b57-s57');

const h = s57.hash(input, H57Length.LEN_256);
const id = s57.id(input, ID57Length.DEFAULT);
const rd = s57.random_derived(
	new TextEncoder().encode('master-secret'),
	new TextEncoder().encode('u-1')
);

const aad = new TextEncoder().encode('ctx:v1');
const token = s57.encrypt(input, aad);
const plain = s57.decrypt(token, aad);

console.log({ h, id, rd, token, plain: new TextDecoder().decode(plain) });
```

For full release-grade validation evidence, see:
- [implementations/FINAL_RELEASE_REPORT_S57_ALL_LANGUAGES.md](implementations/FINAL_RELEASE_REPORT_S57_ALL_LANGUAGES.md)
- [implementations/cross_language_records/s57-benchmark-10000x5-summary.json](implementations/cross_language_records/s57-benchmark-10000x5-summary.json)

## 7. Governance

For detailed maintainer release assessment gates, see [PROJECT_ASSESS_RELEASE.md](PROJECT_ASSESS_RELEASE.md).

**License:** Internal Restricted via [LICENSE](LICENSE) and [LICENSE.md](LICENSE.md).

---

**Current Version:** v0.2.0  
**Last Updated:** June 2026
