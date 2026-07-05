# F57 - Rust Implementation

**F57 for Rust**

This branch contains the Rust implementation of the F57 (57-Series) encoding family, including B57, H57, I57, ID57 (incl. fixed-width lengths), R57, and S57.

## Quick Start

```bash
# Build library
cargo build

# Run all tests
cargo test

# Run with verbose output
cargo test -- --nocapture

# Run benchmarks
cargo bench

# Generate documentation
cargo doc --open
```

## Project Structure

```
rust/
├── src/
│   ├── lib.rs           # Main library export
│   ├── b57.rs           # B57 encoding
│   ├── h57.rs           # H57 hash representation
│   ├── i57.rs           # I57 identifiers
│   ├── id57.rs          # ID57 profiles
│   ├── r57.rs           # R57 random generation
│   ├── s57.rs           # S57 security composition
│   └── errors.rs        # Error types
├── tests/
│   ├── b57_tests.rs
│   ├── h57_tests.rs
│   ├── i57_tests.rs
│   ├── id57_tests.rs
│   ├── r57_tests.rs
│   ├── s57_tests.rs
│   └── e2e_tests.rs
├── benches/
│   └── benchmarks.rs
├── Cargo.toml
├── Cargo.lock
└── README.md
```

## Key Files

- **[Cargo.toml](Cargo.toml)** - Package manifest and dependencies
- **[src/lib.rs](src/lib.rs)** - Main B57 module (public API)
- **[src/s57.rs](src/s57.rs)** - S57 security layer
- **[tests/b57_tests.rs](tests/b57_tests.rs)** - B57 unit tests
- **[tests/e2e_tests.rs](tests/e2e_tests.rs)** - End-to-end tests

## API Overview

### B57 - Binary-to-Text Encoding

```rust
use f57::B57;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Encode bytes to B57 string
    let bytes = vec![1u8, 2, 3, 4];
    let encoded = B57::encode(&bytes);
    println!("{}", encoded); // B57 string
    
    // Decode B57 string to bytes
    let decoded = B57::decode(&encoded)?;
    assert_eq!(decoded, bytes);
    Ok(())
}
```

### H57 - Hash Representation

```rust
// Hash input to full-length B57 representation
let input = vec![1u8, 2, 3];
let hash = H57::hash(&input); // 44-character B57 string (256-bit)
println!("{}", hash);
```

### ID57 - Identifiers

```rust
// Generate deterministic identifier (16-22 chars; length is a bound, not fixed)
let id = ID57::id(&input, ID57Length::DEFAULT);
println!("{}", id); // B57 string

// Fixed-width identifiers use a NEGATIVE length_enum - the magnitude is the
// exact character count (a prefix cut of the LEN_128 id), not a bound
let short_id = ID57::id(&input, ID57Length::Fixed8); // always exactly 8 chars
println!("{}", short_id);
```

### R57 - Random Generation

```rust
// Generate cryptographically secure random identifier
let random = R57::random()?;
println!("{}", random); // 128-bit random string
```

### S57 - Security Composition

```rust
use f57::{S57, H57Length, ID57Length};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let s57 = S57::new(
        b"SECRET_KEY_LONG_ENOUGH_32_BYTES",
        b"prod-v1",
        7,
    )?;

    // Hash with S57
    let hash = s57.hash(&[1u8, 2, 3], H57Length::Len256);

    // ID with S57
    let id = s57.id(&[1u8, 2, 3], ID57Length::Default);

    // Encryption/Decryption
    let aad = b"additional data";
    let encrypted = s57.encrypt(&[1u8, 2, 3], aad)?;
    let decrypted = s57.decrypt(&encrypted, aad)?;

    println!("{:?}", (hash, id, encrypted, decrypted));
    Ok(())
}
```

## Running Tests

```bash
# All tests
cargo test

# Specific test
cargo test b57::tests::

# Verbose output
cargo test -- --nocapture

# With backtrace
RUST_BACKTRACE=1 cargo test

# Benchmarks
cargo bench

# Specific benchmark
cargo bench b57_encode

# Coverage
cargo tarpaulin --out Html
```

## Building

```bash
# Debug build
cargo build

# Release build (optimized)
cargo build --release

# Documentation
cargo doc --open
```

## Dependencies

- **blake3** - BLAKE3 hashing
- **aes-gcm** - AES-256-GCM encryption (S57)
- **rand** - Random number generation
- Development: **criterion** (benchmarks)

See [Cargo.toml](Cargo.toml) for complete dependency list.

## Specification References

- **B57 Encoding:** [spec/b57-core-api.txt](../spec/b57-core-api.txt)
- **H57 Hash:** [spec/h57-core-api.txt](../spec/h57-core-api.txt)
- **ID57 Identifiers:** [spec/id57-core-api.txt](../spec/id57-core-api.txt)
- **R57 Random:** [spec/r57-core-api.txt](../spec/r57-core-api.txt)
- **S57 Security:** [spec/s57-security-57.txt](../spec/s57-security-57.txt)

## Branch Information

- **Branch:** `rust` (Rust-only implementation)
- **Version:** v0.2.0
- **Release Branch:** `release/rust-v0.2.0`
- **Status:** Production Ready
- **Last Updated:** June 2026

## Multi-Language Support

This repository provides implementations in multiple languages with **guaranteed cross-language parity**:

- **Rust** (this branch)
- **Go** - [View `go` branch](../../../tree/go)
- **JavaScript** - [View `javascript` branch](../../../tree/javascript)
- **Dart** - [View `dart` branch](../../../tree/dart)
- **TypeScript** - [View `ts` branch](../../../tree/ts)
- **Python** - [View `python` branch](../../../tree/python)
- **All** - [View `main` branch](../../../tree/main)

Clone only this language:
```bash
git clone --branch rust https://github.com/your-org/f57.git
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
