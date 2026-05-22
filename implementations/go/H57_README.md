# H57 Go Implementation

This package implements H57 Core API on top of the B57 encoder.

Specs used:
- [H57 CORE API](../../spec/H57%20CORE%20API.txt)
- [h57-v0.1.0](../../spec/h57-v0.1.0.txt)
- [B57 CORE API](../../spec/B57%20CORE%20API.txt)

## API

- `H57Hash(input []byte, length H57Length) (string, error)`
- `H57Verify(input []byte, h57String string, length H57Length) bool`
- `H57IsValid(h57String string) bool`
- `H57IsCanonical(h57String string) bool`

## Hash Behavior

- This implementation uses BLAKE3 for H57 output generation.

## Length Modes

- `H57HashAuto` (full entropy)
- Required security thresholds: `H57Len8`, `H57Len16`, `H57Len32`, `H57Len64`, `H57Len128`, `H57Len256`, `H57Len512`
- Hash-aligned: `H57Hash256`, `H57Hash512`
- Informational: `H57Len23`, `H57Len29`, `H57Len47`, `H57Len70`, `H57Len93`, `H57Len186`, `H57Len373`

Truncation occurs at byte level before B57 encoding using deterministic prefix truncation.

## Errors

- `ErrInvalidChar`
- `ErrNonCanonical`
- `ErrInvalidLengthEnum`

## Validation

```bash
cd implementations/go
go test -v ./...
go test -race ./...
go test -coverprofile=coverage.out ./...
```
