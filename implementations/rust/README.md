# B57 Rust Implementation

This folder contains the Rust implementation of:

- B57
- H57
- ID57
- ID57-SHORT
- I57
- R57

## Test Coverage Scope

Implemented test layers:

- Unit tests across core modules in `src/*.rs`
- End-to-end integration test in `tests/e2e_test.rs`
- Cross-language deterministic parity test with Go in `tests/cross_language_10000_test.rs`

Cross-language parity test details:

- Dataset size: 10,000
- Comparison source: `../go/cmd/crosslang/main.go`
- Assertion model: field-by-field deterministic parity

## Run

```bash
cd implementations/rust
cargo test
```

Latest run result:

- 28 passed, 0 failed
- Includes unit + E2E + 10,000-dataset Go parity integration test

## Coverage (Target >90%)

If `cargo-llvm-cov` is not installed:

```bash
cargo install cargo-llvm-cov
```

Environment note:

- On this workspace, `cargo-llvm-cov` had to be pinned to `0.6.21` due rustc version constraints.
- Coverage execution still requires `llvm-tools-preview` (not currently available in this environment).

Then run:

```bash
cd implementations/rust
cargo llvm-cov --summary-only
```

Use this report as the canonical verification for the >90% unit coverage target.

## Export Cross-Language Records

Generate Rust run artifacts against Go reference records:

```bash
cd implementations/rust
cargo run --bin crosslang_records
```

Outputs:

- `../cross_language_records/rust-run-1.json`
- `../cross_language_records/rust-run-2.json`
- `../cross_language_records/rust-run-3.json`
- `../cross_language_records/rust-summary.json`
- `../cross_language_records/rust-summary.md`
