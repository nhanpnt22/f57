# F57 - Go Implementation

**F57 for Go**

This branch contains the Go implementation of the F57 (57-Series) encoding family, including B57, H57, I57, ID57 (incl. fixed-width lengths), R57, and S57.

## Quick Start

```bash
# Download dependencies
go mod download

# Run all tests
go test ./...

# Run with verbose output
go test -v ./...

# Run benchmarks
go test -bench=. -benchmem ./...
```

## Project Structure

```
go/
├── b57.go               # B57 encoding (main module)
├── h57.go               # H57 hash representation
├── i57.go               # I57 identifiers
├── id57.go              # ID57 profiles
├── r57.go               # R57 random generation
├── s57.go               # S57 security composition
├── errors.go            # Error types and handling
├── go.mod               # Module manifest
├── go.sum               # Dependency checksums
├── *_test.go            # Unit tests
├── examples_test.go     # Example usage
└── crosslang/           # Cross-language test records
```

## Key Files

- **[go.mod](go.mod)** - Module manifest
- **[b57.go](b57.go)** - Main B57 module (public API)
- **[s57.go](s57.go)** - S57 security layer
- **[b57_test.go](b57_test.go)** - B57 unit tests
- **[e2e_test.go](e2e_test.go)** - End-to-end tests

## API Overview

### B57 - Binary-to-Text Encoding

```go
package main

import (
    "fmt"
    f57 "your-org/f57/implementations/go"
)

func main() {
    // Encode bytes to B57 string
    bytes := []byte{1, 2, 3, 4}
    encoded := f57.Encode(bytes)
    fmt.Println(encoded) // B57 string
    
    // Decode B57 string to bytes
    decoded, err := f57.Decode(encoded)
    if err != nil {
        panic(err)
    }
}
```

### H57 - Hash Representation

```go
// Hash input to full-length B57 representation
input := []byte{1, 2, 3}
hash := f57.Hash(input) // 44-character B57 string (256-bit)
fmt.Println(hash)
```

### ID57 - Identifiers

```go
// Generate deterministic identifier (16-22 chars; length is a bound, not fixed)
id := f57.ID(input, f57.ID57DefaultLength)
fmt.Println(id) // B57 string

// Fixed-width identifiers use a NEGATIVE length_enum - the magnitude is the
// exact character count (a prefix cut of the LEN_128 id), not a bound
shortID := f57.ID(input, f57.ID57Fixed8) // always exactly 8 chars
fmt.Println(shortID)
```

### R57 - Random Generation

```go
// Generate cryptographically secure random identifier
random, err := f57.Random()
if err != nil {
    panic(err)
}
fmt.Println(random) // 128-bit random string
```

### S57 - Security Composition

```go
s57, err := f57.NewS57(
    []byte("SECRET_KEY_LONG_ENOUGH_32_BYTES"),
    []byte("prod-v1"),
    7,
)
if err != nil {
    panic(err)
}

// Hash with S57
hash := s57.Hash([]byte{1, 2, 3}, f57.H57Length256)

// ID with S57
id := s57.ID([]byte{1, 2, 3}, f57.ID57DefaultLength)

// Encryption/Decryption
aad := []byte("additional data")
encrypted, err := s57.Encrypt([]byte{1, 2, 3}, aad)
if err != nil {
    panic(err)
}

decrypted, err := s57.Decrypt(encrypted, aad)
if err != nil {
    panic(err)
}
```

## Running Tests

```bash
# All tests
go test ./...

# Specific test
go test -run TestEncode ./...

# With verbose output
go test -v ./...

# With race detector
go test -race ./...

# Coverage
go test -cover ./...

# Generate coverage report
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out

# Benchmarks
go test -bench=. -benchmem ./...

# Specific benchmark
go test -bench=BenchmarkB57Encode -benchmem
```

## Dependencies

- **blake3** - BLAKE3 hashing (go.mod)
- **golang.org/x/crypto** - AES-256-GCM encryption (S57)

See [go.mod](go.mod) for complete dependency list.

## Building

```bash
# Standard Go build
go build ./...

# Cross-platform builds
GOOS=linux GOARCH=amd64 go build -o b57-linux
GOOS=darwin GOARCH=arm64 go build -o b57-macos
GOOS=windows GOARCH=amd64 go build -o b57.exe
```

## Specification References

- **B57 Encoding:** [spec/b57-core-api.txt](../spec/b57-core-api.txt)
- **H57 Hash:** [spec/h57-core-api.txt](../spec/h57-core-api.txt)
- **ID57 Identifiers:** [spec/id57-core-api.txt](../spec/id57-core-api.txt)
- **R57 Random:** [spec/r57-core-api.txt](../spec/r57-core-api.txt)
- **S57 Security:** [spec/s57-security-57.txt](../spec/s57-security-57.txt)

## Branch Information

- **Branch:** `go` (Go-only implementation)
- **Version:** v0.2.0
- **Release Branch:** `release/go-v0.2.0`
- **Status:** Production Ready
- **Last Updated:** June 2026

## Multi-Language Support

This repository provides implementations in multiple languages with **guaranteed cross-language parity**:

- **Go** (this branch)
- **Dart** - [View `dart` branch](../../../tree/dart)
- **Rust** - [View `rust` branch](../../../tree/rust)
- **JavaScript** - [View `javascript` branch](../../../tree/javascript)
- **TypeScript** - [View `ts` branch](../../../tree/ts)
- **Python** - [View `python` branch](../../../tree/python)
- **All** - [View `main` branch](../../../tree/main)

Clone only this language:
```bash
git clone --branch go https://github.com/your-org/f57.git
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
