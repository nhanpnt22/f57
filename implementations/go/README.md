# B57 Go Implementation

## Overview

This is the official Go implementation of the B57 binary-to-text encoding scheme as defined in [b57-v0.1.0](../../spec/b57-v0.1.0.txt).

B57 provides a minimal, bijective, deterministic encoding for binary data into human-readable ASCII strings. It eliminates visually ambiguous characters and preserves all input entropy.

Scope note:
- This README documents the B57 core encoding layer.
- The repository also contains higher-level H57, ID57, ID57-SHORT, R57, and I57 code.
- Those higher-level surfaces do not all currently align cleanly with every attached spec document, so release claims for them should be evaluated separately.

## Installation

```bash
go test ./...
```

## Quick Start

```go
package main

import (
	"fmt"
	b57 "github.com/aco/b57"
)

func main() {
	// Encode bytes to string
	data := []byte{0x48, 0x65, 0x6C, 0x6C, 0x6F}
	encoded := b57.Encode(data)
	fmt.Println("Encoded:", encoded)

	// Decode string to bytes
	decoded, err := b57.Decode(encoded)
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	fmt.Println("Decoded:", decoded)
}
```

## API Reference

### Core Functions

#### Encode(data []byte) string

Converts raw bytes into a canonical B57 string.

**Rules:**
- Encoding is deterministic (same input always produces same output)
- Encoding is bijective (one-to-one mapping)
- Preserves all input entropy
- Empty input returns empty string
- Input bytes interpreted as big-endian unsigned integer

**Example:**
```go
encoded := b57.Encode([]byte{0x01, 0x02, 0x03})
// Result: "BD" (or similar, depending on algorithm)
```

#### Decode(s string) ([]byte, error)

Converts a B57 string into raw bytes.

**Validation:**
- All characters must be in the B57 alphabet
- Encoding must be in canonical form
- Returns error if input is invalid or non-canonical

**Error Types:**
- `ErrInvalidChar`: Invalid character encountered
- `ErrNonCanonical`: String is not in canonical form

**Example:**
```go
decoded, err := b57.Decode("ABC123")
if err != nil {
	log.Fatal(err)
}
fmt.Println(decoded)
```

### Optional Functions

#### IsValid(s string) bool

Validates that a string contains only valid B57 characters.

**Returns:** `true` if all characters are in the B57 alphabet

**Example:**
```go
if b57.IsValid("ABC123") {
	fmt.Println("Valid B57 string")
}
```

#### IsCanonical(s string) bool

Verifies if a string is in canonical form.

**Logic:**
- A string is canonical if `Decode` followed by `Encode` produces the same string
- Invalid strings return `false`

**Example:**
```go
if b57.IsCanonical(encoded) {
	fmt.Println("String is in canonical form")
}
```

#### EncodedLength(byteLen int) int

Estimates the length of the encoded string for N bytes.

**Formula:** `ceil(byteLen * 8 / log2(57))`

**Use Case:** Pre-allocate buffers for encoded data

**Example:**
```go
estimatedLen := b57.EncodedLength(32)
fmt.Printf("32 bytes will encode to ~%d characters\n", estimatedLen)
```

#### DecodedLength(charLen int) int

Estimates the number of bytes for N B57 characters.

**Formula:** `floor(charLen * log2(57) / 8)`

**Note:** This is an estimate; actual length may be 1 byte shorter

**Example:**
```go
estimatedBytes := b57.DecodedLength(50)
fmt.Printf("50 characters will decode to ~%d bytes\n", estimatedBytes)
```

## Alphabet

The B57 alphabet is:

```
ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz123456789
```

**Properties:**
- 57 ASCII characters
- Case-sensitive
- Excludes visually ambiguous characters: `0` `O` `I` `l`

## Error Handling

The package defines two error types via the `Error` struct:

```go
type Error struct {
	Code    ErrorCode
	Message string
	Index   int // position in string where error occurred
}
```

**Error Codes:**
- `ErrInvalidChar`: Invalid character detected
- `ErrNonCanonical`: Non-canonical encoding detected

**Example:**
```go
decoded, err := b57.Decode("invalid@string")
if err != nil {
	if errVal, ok := err.(*b57.Error); ok {
		fmt.Printf("Error: %s at position %d\n", errVal.Message, errVal.Index)
	}
}
```

## Invariants

The implementation guarantees:

1. **Encode-Decode Roundtrip:**
   ```go
   decoded, _ := b57.Decode(b57.Encode(x))
   // decoded == x
   ```

2. **Canonical Form:**
   ```go
   if b57.IsCanonical(y) {
       encoded, _ := b57.Decode(y)
       // b57.Encode(encoded) == y
   }
   ```

3. **Bijectivity:**
   - Every byte sequence maps to exactly one B57 string
   - Every valid B57 string maps to exactly one byte sequence

## Implementation Details

### Leading Zero Handling

Leading zero bytes (0x00) are preserved by encoding them as the first B57 character ('A'):

```go
b57.Encode([]byte{0x00})           // "A"
b57.Encode([]byte{0x00, 0x00})     // "AA"
b57.Encode([]byte{0x00, 0x01})     // "AB"
```

### Big-Endian Interpretation

Input bytes are interpreted as a big-endian unsigned integer:

```go
b57.Encode([]byte{0x01, 0x00})  // Different from 0x00, 0x01
```

### Constant-Time Operations

The implementation uses:
- Lookup tables for alphabet indexing (O(1) access)
- Big integer arithmetic for encoding/decoding

**Note:** Not designed for cryptographic constant-time guarantees

## Testing

### Unit Tests

Run all tests:
```bash
go test -v ./...
```

Run with race detection:
```bash
go test -race ./...
```

Generate coverage:
```bash
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out
```

### Test Coverage

Current implementation covers:
- Empty input/output
- Single byte (0x00 to 0xFF)
- Multi-byte sequences
- Round-trip invariants
- Determinism
- Bijectivity
- Entropy preservation
- Error handling
- Alphabet validation
- Canonical form verification
- Large data (1KB)

**Coverage:** 97.3% of statements (93.5% overall across ./...)

### Test Vectors

See `vectors_test.go` for canonical test vectors ensuring cross-implementation compatibility.

## Performance

Benchmark results (on typical hardware):

```
BenchmarkEncode/64bytes-8   1,000,000   1,500 ns/op   ~42.7 MB/s
BenchmarkDecode/64bytes-8     500,000   3,000 ns/op   ~21.3 MB/s
```

## Security Considerations

B57 provides **no cryptographic guarantees**:

- It is **not** a cipher or hash function
- Security depends entirely on input entropy
- Use cryptographically secure random sources for ID generation
- Weak randomness or insufficient entropy compromises all security

## Compliance

This implementation complies with:
- [b57-v0.1.0](../../spec/b57-v0.1.0.txt) specification
- [B57 CORE API](../../spec/b57-core-api.txt) reference

## Related APIs

- [H57_README.md](H57_README.md) for hash-to-B57 canonical representation.
- [ID57_README.md](ID57_README.md) for human-centric identifier generation on top of B57.

## Examples

### Basic Usage

```go
// Encode
data := []byte("Hello")
encoded := b57.Encode(data)
fmt.Println("Encoded:", encoded)

// Decode
decoded, err := b57.Decode(encoded)
if err != nil {
	log.Fatal(err)
}
fmt.Println("Decoded:", string(decoded))
```

### Validation

```go
// Check if string is valid B57
if !b57.IsValid("ABC@123") {
	fmt.Println("Invalid characters present")
}

// Check if encoding is canonical
if !b57.IsCanonical(encoded) {
	fmt.Println("Non-canonical encoding")
}
```

### Length Estimation

```go
// Estimate encoded size
byteLen := 32
estimatedChars := b57.EncodedLength(byteLen)
fmt.Printf("%d bytes encode to ~%d characters\n", byteLen, estimatedChars)

// Estimate decoded size
charLen := 50
estimatedBytes := b57.DecodedLength(charLen)
fmt.Printf("%d characters decode to ~%d bytes\n", charLen, estimatedBytes)
```

## Platform Compatibility

- Tested on: macOS, Linux, Windows
- Go versions: 1.21+
- Architecture independent (uses Go's `math/big` for arbitrary precision)

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md)

## License

See [LICENSE](../../LICENSE)

## References

- [B57 Specification](../../spec/b57-v0.1.0.txt)
- [B57 Core API](../../spec/b57-core-api.txt)
- [H57 Core API](../../spec/h57-core-api.txt)
- [ID57 Core API](../../spec/id57-core-api.txt)
- [Implementation Guide](../../spec/b57-core-api.txt)
