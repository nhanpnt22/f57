# ID57 UAT Report

Date: 2026-05-19
Status: PASS

## Scope
- ID57 core identifier generation behavior
- One-way hash-first pipeline conformance
- Optional verification and validation APIs
- Length enum behavior and hash/length compatibility checks
- End-to-end deterministic and canonical output checks

## Executed
- `go test -v -run "TestID57" ./...`
- `go test -v ./...`
- `go test -race ./...`
- `go test -cover ./...`
- `go test -coverprofile=coverage_b57.out .`
- `go tool cover -func=coverage_b57.out`

## Acceptance Scenarios
1. `ID57Generate(input, length)` is deterministic for same parameters.
2. `ID57GenerateDefault` resolves to `ID57Len128` and yields 22-char baseline for 128-bit inputs.
3. ID57 output is one-way and does not equal raw `Encode(input)` for the same input.
4. Invalid length enum -> `ErrInvalidLengthEnum`.
5. Verify/valid/canonical helpers return expected results.
6. End-to-end suite passes across required and informational enums.

## Result
UAT decision: ACCEPT

Coverage evidence (package `github.com/aco/f57`):
- Total statements covered: **97.3%**
