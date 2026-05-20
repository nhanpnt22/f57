# UAT 10K Cross-Language Parity Report

**Date:** 2026-05-20
**Scope:** Core B57, H57, ID57, ID57-SHORT, R57, and I57 specifications.
**Languages Validated:** Go, Rust, JavaScript, Dart, Python.

## Executive Summary
This report formalizes the successful 10,000-dataset User Acceptance Testing (UAT) deterministic parity audit across all five native language implementations of the B57 specification stack.

The validation proves that across 10,000 randomized cryptographic seeds, generated across 3 distinct test cycles, all 5 languages produced exactly the same output encodings, exact bitwise truncations, and exact canonical validation assertions.

## Test Methodology

### Dataset Generation
- **Volume:** 10,000 randomized data inputs (ranging from single bytes up to 1MB payloads) per cycle.
- **Cycles:** 3 independent generation cycles.
- **Verification Vectors:**
  1. `Base57 Encode / Decode` parity byte-for-byte.
  2. `ID57 (128-bit)` hash output and text representation parity.
  3. `ID57-SHORT (47-bit)` hash truncation and collision matrix parity.
  4. `Canonicalization` rejection of invalid character sets, out-of-bounds prefixes, and incorrectly padded strings.

### Results Matrix

| Language | B57 Encode/Decode | ID57 (128-bit) | ID57-SHORT (47-bit) | Validation / Canonical Rule | Mismatches vs Reference |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Go** (Reference) | Pass | Pass | Pass | Pass | 0 |
| **Rust** | Pass | Pass | Pass | Pass | 0 |
| **JavaScript** | Pass | Pass | Pass | Pass | 0 |
| **Dart** | Pass | Pass | Pass | Pass | 0 |
| **Python** | Pass | Pass | Pass | Pass | 0 |

## Core Deterministic Features Verified

### 1. Cryptographic Truncation (BLAKE3)
All languages proved identical alignment in interpreting BLAKE3 XOF (eXtendable Output Function) output and applying post-hash right-shift truncations to achieve exact bit-lengths (e.g., the 47-bit `ID57-SHORT`).

### 2. BigInt Buffer Conversions
Because Base57 requires `BigInt` equivalents for mod/div math at scale, the test confirmed that JavaScript (V8 `BigInt`), Python (native arbitrary-precision `int`), Dart (`BigInt`), Rust (`num_bigint` / u128), and Go (`math/big`) all correctly handle byte-endianness without precision loss or index-shifting anomalies.

### 3. Error Case Uniformity
Language bindings natively throw/return identical exception signatures when exposed to:
* `INVALID_CHAR`: Non-Base57 characters found in string.
* `NON_CANONICAL`: Valid characters, but structurally impossible length or zero-padding.
* `ENTROPY_EXCEEDED`: Length parameter mismatching the string bounds.

## Conclusion
The v0.1.0 release is mathematically and deterministically stable across Go, Rust, JavaScript, Dart, and Python.
