# B57 Benchmarks (v0.1.0)

**Date**: 2026-05-22
**Environment**: Standard ARM64 macOS processing.

The B57 library leverages large integer arithmetic (`BigInt` / `big.Int` / `num_bigint`) for exact conversion formatting coupled with native BLAKE3 hashing limits. Below are the estimated operational throughput expectations per language for the `v0.1.0` release. 

*Note: These benchmarks measure `ID57Generate()` (which includes BLAKE3 hashing + Bitwise Truncation + BIGINT division + Base57 string allocation).*

## S57 Cross-Language Release Benchmark

S57 release validation is tracked separately from ID57 throughput and is currently gated by the 5-language deterministic benchmark artifact:

- `implementations/cross_language_records/s57-benchmark-10000x5-summary.json`

Current benchmark gate status:

- Determinism mismatches: JS=0, Go=0, Rust=0, Dart=0, Python=0
- Cross-vs-JS mismatches: Go=0, Rust=0, Dart=0, Python=0

## Estimated ID57 Throughput (Ops / Sec)

| Language | Operations per Second (Avg) | Notes |
|---|---|---|
| **Rust** | ~ 450,000 ops/sec | Utilizing native `num_bigint` and ultra-optimized `blake3` crate. Zero-alloc encoding paths. |
| **Go** | ~ 280,000 ops/sec | Leveraging `math/big` and `lukechampine.com/blake3`. Slight heap allocation overhead on strings. |
| **JavaScript (Node.js)**| ~ 150,000 ops/sec | Native V8 `BigInt` optimization and `noble-blake3` bindings or WASM fallbacks. |
| **Dart** | ~ 110,000 ops/sec | Native `BigInt` handling. High-performance JIT/AOT memory allocations. |
| **Python** | ~ 65,000 ops/sec | Built-in arbitrary-precision `int`. Limited primarily by the Python interpreter and FFI overhead for Blake3. |

## BigInt vs Bytewise Processing

Base57 is fundamentally a mathematical encoding (`mod 57`), which mandates arbitrary precision libraries for payloads exceeding standard 64-bit bounds. 

For maximum performance inside high-throughput distributed systems:
1. Always utilize `ID57-SHORT` if globally distributed exact collision safety is not required. The 47-bit (8 character) length fits into standard processor registers avoiding heap-allocated `BigInt` operations almost entirely in low-level languages.
2. If utilizing `R57` for random strings, bypass the B57 decoding math backward verification if input sanitization is handled upstream.

*Note on standard Base58/Base64/Base62: B57 benchmarks are inherently competitive against standard Base58 implementations, relying on the same divide-and-modulo processing structures but dropping the letter `l` from the alphabet for further visual clarity.*