# I57 Go Implementation

This package implements I57 Core API on top of the MINDU stack.

Specs used:
- [I57 CORE API (MINDU)](../../spec/I57%20CORE%20API.txt)

## API

- `I57Encode(input []byte) string`
- `I57Decode(input string) ([]byte, error)`
- `I57Hash(input []byte, length H57Length) (string, error)`
- `I57Random(mode R57Mode) (string, error)`
- `I57Id(input []byte, length ID57Length) (string, error)`
- `I57IsValid(input string) bool`
- `I57IsCanonical(input string) bool`
- `I57ValidateIdentifier(input string) bool`
- `I57ValidateEntropy(input string) bool`

## Properties

I57 is an integration layer over B57, H57, R57, and ID57.

It enforces integration-level validation semantics required by the I57 contract:
- Empty strings are rejected by default in I57 validation mode.
- `I57ValidateIdentifier` enforces canonical B57 + 22-char baseline identifier checks.
- `I57ValidateEntropy` provides a non-security heuristic filter for obviously low-entropy-looking identifiers.

`I57ValidateEntropy` is informational only and MUST NOT be used for security decisions.

## Validation

```bash
cd implementations/go
go test -v ./...
go test -v -run "TestI57" ./...
go test -v -run "TestI57EndToEnd" ./...
go test -race ./...
go test -cover ./...
```
