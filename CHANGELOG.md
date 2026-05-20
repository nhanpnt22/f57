# Changelog

All notable changes to the B57 specification stack and its associated native implementations will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-05-20

### Added
- **Core Standard**: Finalized the `v0.1.0 FINAL` specification architecture acting directly beneath the `MINDU` design parameters.
- **Specification Suite**: Fully mapped the 6-layer protocol stack in the `spec/` directory:
  - `B57 CORE API.txt` (Base57 canonical encoding)
  - `H57 CORE API.txt` (Hashed Base57)
  - `ID57 CORE API (MINDU).txt` (128-bit Identity Generation)
  - `ID57-SHORT PROFILE.txt` (47-bit human-readable IDs)
  - `R57 CORE API (MINDU).txt` (Random generators)
  - `I57 - INTEGRATION.txt` (Unified facade)
- **Language Support**: Released completely native, zero-dependency (other than hashing/math primitives) implementations for:
  - Go
  - Rust
  - JavaScript / TypeScript
  - Dart
  - Python
- **Validation**: Added the `.10k UAT Parity Report` confirming 0 calculation variants across all 5 languages when computing truncations and generating IDs.
- **Governance**: Officially published `README.md`, `RELEASE.md`, `SECURITY.md`, and `BENCHMARKS.md` establishing the formal `v0.1.0` posture.
