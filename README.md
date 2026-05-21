============================================================
B57 PROTOCOL STACK
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

B57 is a canonical, ASCII-safe binary-to-text encoding 
scheme. It is specifically designed for human-readability, 
compact data representation, and unambiguous transcription.

The B57S System defines the unified, layered architecture
rounding out the B57 ecosystem. It establishes a rigorous 
pipeline for canonical data normalization: 
  input → HASH → truncate → B57 → string

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

Key properties:
- Bijective & Deterministic: 100% parity across distributed 
  systems.
- Entropy-Preserving: Never truncates, pads, or biases raw
  input at the encoding layer.
- Canonical Form: Ensures exactly one valid output 
  representation for any given input sequence.

============================================================
2. THE B57S STACK
============================================================

The protocol is divided into a 6-layer architecture:

1. [B57 Core](spec/B57%20CORE%20API.txt) (Encoding Layer)
   The canonical binary-to-text exact mathematical 
   primitives (bytes ↔ B57 string).

2. [H57](spec/H57%20CORE%20API.txt) (Hash Representation)
   Wraps arbitrary payloads into deterministic hash outputs, 
   preserving full internal entropy.
   (input → BLAKE3 → bytes → B57)

3. [ID57](spec/ID57%20CORE%20API.txt) (Identity Profile)
   Generates global identifiers (e.g., 128-bit / 22 chars) 
   offering extreme collision resistance with intentionally 
   controlled entropy reduction.

4. [ID57-SHORT](spec/ID57-SHORT%20PROFILE.txt) (Ultra-Compact)
   Generates local identifiers (e.g., 47-bit / 8 chars). 
   Optimized strictly for QR codes, URLs, and UI brevity.

5. [R57](spec/R57%20CORE%20API.txt) (Random Profile)
   Generates high-entropy 128-bit deterministic or CSPRNG 
   identifiers safely placed into the B57 namespace.

6. [I57](spec/I57%20CORE%20API.txt) (Integration Layer)
   The top-level facade interface unifying all underlying 
   profiles into a seamless developer API.

============================================================
3. NATIVE IMPLEMENTATIONS
============================================================

The v0.1.0 release provides fully native implementations.
All implementations process native BigInt arrays natively.

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
