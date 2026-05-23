# Changelog

All notable changes to the F57 specification family and its associated native implementations will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- TypeScript package release hardening in `implementations/ts`:
  - distributable build output (`dist/` with JS + `.d.ts`)
  - package export metadata (`main`, `types`, `exports`, `files`)
  - release rehearsal command (`npm run verify:all`) and successful `npm pack` packaging flow

### Changed
- Top-level release governance docs updated to include TypeScript package release posture and validation evidence.

## [0.1.1] - 2026-05-23

### Changed
- Repository rename alignment and documentation consistency updates for the F57 umbrella naming.
- Top-level release/assessment documents clarified to distinguish protocol release version (`v0.1.0`) from latest repository tag (`v0.1.1`).
- Documentation synchronized for finalized S57 release posture across all top-level governance and release documents.
- README/changelog language updated to reflect the current 7-layer stack model (including S57).

### Added
- Explicit reference to the S57 10000x5 benchmark release gate artifact:
  - `implementations/cross_language_records/s57-benchmark-10000x5-summary.json`

## [0.1.0] - 2026-05-20

### Added
- **Core Standard**: Finalized the `v0.1.0 FINAL` specification architecture acting directly beneath the `MINDU` design parameters.
- **Specification Suite**: Fully mapped the protocol stack in the `spec/` directory:
  - `b57-core-api.txt` (Base57 canonical encoding)
  - `h57-core-api.txt` (Hashed Base57)
  - `id57-core-api.txt` (128-bit Identity Generation)
  - `id57-short-profile.txt` (47-bit human-readable IDs)
  - `r57-core-api.txt` (Random generators)
  - `i57-core-api.txt` (Unified facade)
  - `s57-security-57.txt` (Secure composition profile)
- **Language Support**: Released completely native, zero-dependency (other than hashing/math primitives) implementations for:
  - Go
  - Rust
  - JavaScript/TypeScript
  - Dart
  - Python
- **Validation**: Added the `.10k UAT Parity Report` confirming 0 calculation variants across all 5 languages when computing truncations and generating IDs.
- **Governance**: Officially published `README.md`, `RELEASE.md`, `SECURITY.md`, and `BENCHMARKS.md` establishing the formal `v0.1.0` posture.
