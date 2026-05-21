============================================================
B57 PROTOCOL STACK (MINDU)
Canonical Binary-to-Text and Identifier Architecture
Version: v0.1.0 FINAL
Status: Informational (RFC-Grade, Production-Ready)
Date: May 2026
============================================================

[![Version](https://img.shields.io/badge/version-v0.1.0_FINAL-blue.svg)](CHANGELOG.md)
[![Status](https://img.shields.io/badge/status-Production_Ready-success.svg)](PROJECT_ASSESS_RELEASE.md)
[![Parity](https://img.shields.io/badge/Cross--Language_Parity-10k_Datasets_Passed-success.svg)](UAT_10K_PARITY_REPORT.md)

============================================================
ABSTRACT
============================================================

The B57 Protocol Stack (codenamed MINDU) defines a unified, 
layered architecture for binary encoding, hash representation, 
random identification, and identifier generation.

At its core, B57 provides a canonical, ASCII-safe binary-to-
text encoding scheme designed for human readability and 
unambiguous transcription, enforcing a strict 57-character 
alphabet that excludes visually ambiguous symbols.

Building upon B57, the MINDU stack establishes a rigorous 
pipeline for canonical data normalization: 
 input → HASH → prefix truncate → B57 → string

============================================================
STATUS OF THIS MEMO
============================================================

This repository acts as the central standard for the B57 
specification and its native reference implementations.

Current Status: v0.1.0 FINAL (Repository-wide READY).

============================================================
1. OVERVIEW
============================================================

Most identifiers and text-encodings (like Base64 or standard 
Base58) suffer from visually ambiguous characters or 
platform-specific determinism issues. 

The B57 protocol eliminates this by enforcing a strict 
57-character alphabet:
 ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz123456789

(Excluded visually ambiguous characters: 0, O, I, l)

Key System Properties:
- Bijective & Deterministic: 100% parity across distributed 
  systems. Exactly one valid output exists per input.
- Entropy-Preserving: Never truncates, pads, or biases raw
  input at the base encoding layer.
- One-Way Hash Transformation: Employs BLAKE3 by default 
  to produce secure cryptographic identifiers.

============================================================
2. THE B57S STACK ARCHITECTURE
============================================================

The protocol is composed of a 6-layer architecture with 
strict conceptual boundaries:

------------------------------------------------------------
2.1 B57 (Encoding Layer)
------------------------------------------------------------
Specification: [B57 Core](spec/B57%20CORE%20API.txt)
The canonical binary-to-text mathematical primitives.
Pipeline: bytes ↔ B57 string
Properties: bijective, unambiguous, exact byte representation.

------------------------------------------------------------
2.2 H57 (Hash Representation Layer)
------------------------------------------------------------
Specification: [H57 Core](spec/H57%20CORE%20API.txt)
Canonical representation of full cryptographic hash outputs.
Pipeline: input → BLAKE3 → bytes → B57 string
Properties: full entropy preservation (e.g., 256-bit hash → 
44 chars), no truncation, ideal for content integrity.

------------------------------------------------------------
2.3 ID57 (Identifier Profile)
------------------------------------------------------------
Specification: [ID57 Core](spec/ID57%20CORE%20API.txt)
Generates fixed-length, human-readable identifiers through 
controlled entropy reduction.
Pipeline: input → HASH → prefix truncate → B57 string
Properties: Default 128-bit (22 chars). Ensures prefix-level 
byte truncation prior to encoding.

------------------------------------------------------------
2.4 ID57-SHORT (Ultra-Compact Profile)
------------------------------------------------------------
Specification: [ID57-SHORT](spec/ID57-SHORT%20PROFILE.txt)
Generates heavily truncated local identifiers (e.g., 
47-bit / 8 chars).
Properties: Optimized strictly for QR codes, UI brevity, and 
temporary IDs. Requires safe namespace sizing.

------------------------------------------------------------
2.5 R57 (Random Generation Profile)
------------------------------------------------------------
Specification: [R57 Core](spec/R57%20CORE%20API.txt)
Generates high-entropy 128-bit random identifiers securely.
Pipeline: entropy_source (128-bit) → B57 string
Properties: Mandates CSPRNG, KDF, or Hybrid generation 
modes to ensure unpredictable, collision-resistant outputs.

------------------------------------------------------------
2.6 I57 (Integration Interface)
------------------------------------------------------------
Specification: [I57 Core](spec/I57%20CORE%20API.txt)
The top-level facade interface unifying all underlying 
profiles into a seamless developer API.
Ensures correct composition and safe parameter passing.

============================================================
3. NATIVE IMPLEMENTATIONS
============================================================

The v0.1.0 release provides fully native implementations.
All implementations process arrays using native BigInt 
arithmetic.

- Go: [implementations/go](implementations/go)
- Rust: [implementations/rust](implementations/rust)
- JavaScript / TypeScript: [implementations/javascript](implementations/javascript)
- Dart: [implementations/dart](implementations/dart)
- Python: [implementations/python](implementations/python)

All passed the [10,000 Dataset Cross-Language Parity Audit](UAT_10K_PARITY_REPORT.md)
proving zero deviation across execution environments.

============================================================
4. RECOMMENDED SYSTEM PATTERNS
============================================================

The stack encourages standard integration patterns:

- Dual-Layer Identity: Produce a full H57(data) internally 
  for database deduplication, while exposing a targeted 
  ID57(data, 128-bit) externally via APIs.

- Storage vs. Exposure: Use ID57-SHORT for printable offline 
  receipts or tiny URLs, mapped safely to a heavily 
  collision-resistant H57 hash stored remotely.

- Tamper Detection & Content Routing: Execute exact hash 
  matching without truncation using native length 
  44-character H57 outputs.

============================================================
5. OFFICIAL DOCUMENTATION
============================================================

- [UAT 10K Parity Report](UAT_10K_PARITY_REPORT.md)
  Proof of absolute deterministic data alignment.
- [Benchmarks](BENCHMARKS.md)
  ID processing ops/second across languages.
- [Security Policy](SECURITY.md)
  Collision domains and vulnerability reporting.
- [Changelog](CHANGELOG.md)
  Semantic version tracking.

------------------------------------------------------------
5.1 LEGACY DRAFT SPECIFICATIONS
------------------------------------------------------------

Original v0.1.0 working drafts, retained for reference:
- [B57 Core Suite Framework](spec/b57-cs-v0.1.0.txt)
- [B57 Encoding Draft](spec/b57-v0.1.0.txt)
- [H57 Draft](spec/h57-v0.1.0.txt)
- [ID57 Draft](spec/id57-v0.1.0.txt)
- [R57 Draft](spec/R57-v0.1.0.txt)

============================================================
6. GETTING STARTED & TESTING
============================================================

Verify deterministic compliance locally using standard 
test runners:

  # Go
  cd implementations/go && go test ./...

  # JavaScript
  cd implementations/javascript && npm test

  # Rust 
  cd implementations/rust && cargo test

  # Dart
  cd implementations/dart && dart test

  # Python
  cd implementations/python && pytest

============================================================
7. GOVERNANCE
============================================================

For detailed maintainer release assessment gates, see 
[PROJECT_ASSESS_RELEASE.md](PROJECT_ASSESS_RELEASE.md).

License: Internal Restricted via [LICENSE](LICENSE) and 
[LICENSE.md](LICENSE.md).

============================================================
END
============================================================
