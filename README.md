# B57 Protocol Stack (MINDU)

[![Version](https://img.shields.io/badge/version-v0.1.0_FINAL-blue.svg)](CHANGELOG.md)
[![Status](https://img.shields.io/badge/status-Production_Ready-success.svg)](PROJECT_ASSESS_RELEASE.md)
[![Parity](https://img.shields.io/badge/Cross--Language_Parity-10k_Datasets_Passed-success.svg)](UAT_10K_PARITY_REPORT.md)

B57 is a high-performance, cryptographically secure identifier and encoding protocol. It provides a highly optimized **Base57** alphabet (removing visually ambiguous characters) and a deterministic identifier generation system powered by **BLAKE3 XOF**. 

Most importantly, the B57 stack guarantees **100% deterministic parity** across distributed systems—meaning an ID generated on a Rust backend will byte-for-byte match an ID generated on a mobile Dart client or a JavaScript frontend natively.

## 🧠 The Big Picture: The MINDU Architecture

The protocol is divided into a 6-layer architecture (codenamed MINDU) ensuring strict conceptual boundaries between encoding, hashing, and integration:

1. **[B57 Core](spec/B57%20CORE%20API.txt)** (Base Encoding): The canonical Base57 encoding and decoding math primitives.
2. **[H57](spec/H57%20CORE%20API.txt)** (Hashed Base57): Wraps arbitrary data payloads into deterministic truncated hashes.
3. **[ID57](spec/ID57%20CORE%20API.txt)** (Identity): Generates 128-bit global identifiers (22 characters) offering extreme collision resistance.
4. **[ID57-SHORT](spec/ID57-SHORT%20PROFILE.txt)**: Generates 47-bit local identifiers (8 characters) optimized for human-readable, context-bound references (e.g., short URLs, receipts).
5. **[R57](spec/R57%20CORE%20API.txt)** (Random): Fallback interface for high-entropy non-deterministic string generation.
6. **[I57](spec/I57%20CORE%20API.txt)** (Integration): The top-level facade combining all underlying profiles into a single, seamless developer-friendly API.

## 🌍 Native Implementations

The v0.1.0 release provides fully native implementations. All implementations process native `BigInt` arrays without external bloat.

* 🐹 **[Go](implementations/go)**
* 🦀 **[Rust](implementations/rust)** 
* 💛 **[JavaScript / TypeScript](implementations/javascript)**
* 🎯 **[Dart](implementations/dart)**
* 🐍 **[Python](implementations/python)**

All implementations have passed the **[10,000 Dataset Cross-Language Parity Audit](UAT_10K_PARITY_REPORT.md)** proving absolutely zero deviation in output behavior across cryptographic seeds.

## 🚀 Official Documentation

* **[UAT 10K Parity Report](UAT_10K_PARITY_REPORT.md)**: Proof of absolute deterministic data alignment.
* **[Benchmarks](BENCHMARKS.md)**: ID processing ops/second across Rust, Go, JS, Dart, and Python.
* **[Security Policy](SECURITY.md)**: Collision domains, BLAKE3 entropy discussions, and vulnerability reporting.
* **[Changelog](CHANGELOG.md)**: Semantic version tracking.

## 🚦 Getting Started & Testing

You can verify the deterministic compliance of any language implementation locally:

```bash
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
```

## 🔐 Governance & Releases

This repository acts as the central standard for the B57 specification. 
* Current Status: **`v0.1.0 FINAL`** (Repository-wide UNQUALIFIED READY).
* For detailed maintainer release assessment gates, see [PROJECT_ASSESS_RELEASE.md](PROJECT_ASSESS_RELEASE.md).
* License: Internal Restricted via [LICENSE](LICENSE) and [LICENSE.md](LICENSE.md).

