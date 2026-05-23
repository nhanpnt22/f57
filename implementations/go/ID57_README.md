# ID57 Go Implementation

This package implements the current Go ID57 behavior on top of the B57 encoder.

Scope note:
- The attached ID57-related specs are not fully consistent with each other.
- This Go implementation follows the byte-level prefix truncation model used by the integration and short-profile documents.
- It does not currently expose a standalone `ID57_LEN_AUTO` mode from the standalone `id57-v0.1.0.txt` profile.

Specs used:
- [ID57 CORE API (MINDU)](../../spec/id57-core-api.txt)
- [id57-v0.1.0](../../spec/id57-v0.1.0.txt)
- [B57S-v0.1.0](../../spec/b57s-v0.1.0.txt)
- [B57 CORE API](../../spec/b57-core-api.txt)

## API

- `ID57Generate(input []byte, length ID57Length) (string, error)`
- `ID57GenerateDefault(input []byte) (string, error)`
- `ID57Verify(input []byte, id57String string, length ID57Length) bool`
- `ID57VerifyDefault(input []byte, id57String string) bool`
- `ID57IsValid(id57String string) bool`
- `ID57IsCanonical(id57String string) bool`

## One-Way Pipeline

ID57 generation follows:

`input -> HASH -> truncate bytes -> B57`

Rules:
- Input bytes are always hashed first.
- Truncation happens on hash bytes before B57 encoding.
- Prefix truncation is used deterministically.

This means the Go implementation matches the byte-truncation model, not the post-encoding prefix truncation language in the standalone `id57-v0.1.0.txt` profile.

## Hash Behavior

- This implementation uses BLAKE3 for ID57 output generation.

## Length Modes

- `ID57Default` (resolves to `ID57Len128`)
- Required thresholds: `ID57Len8`, `ID57Len16`, `ID57Len32`, `ID57Len64`, `ID57Len128`, `ID57Len256`, `ID57Len512`
- Informational: `ID57Len23`, `ID57Len29`, `ID57Len47`, `ID57Len70`, `ID57Len93`, `ID57Len186`, `ID57Len373`

Default profile:
- `ID57GenerateDefault` uses `ID57Default` (22-char baseline).

Compatibility note:
- The implementation provides `ID57Default`, not an explicit AUTO/full-hash enum.
- For full-hash representations, use H57 directly.

## Truncation Model

Truncation is applied to raw hash bytes before B57 encoding using deterministic prefix truncation.

For non-byte-aligned lengths (e.g., 23-bit), excess bits in the final byte are masked.

## Errors

- `ErrInvalidChar`
- `ErrNonCanonical`
- `ErrInvalidLengthEnum`

## Validation

```bash
cd implementations/go
go test -v ./...
go test -v -run "TestID57" ./...
go test -race ./...
go test -cover ./...
```
