# H57 UAT Report

Date: 2026-05-19
Status: PASS

## Scope
- H57 core hash representation behavior
- Optional verification and validation APIs
- Length enum behavior and entropy boundary checks
- End-to-end deterministic and canonical output checks

## Executed
- go test -v ./...
- go test -race ./...
- go test -coverprofile=coverage.out ./...

## Acceptance Scenarios
1. `H57Hash` deterministic output for same input/hash/length.
2. `H57HashAuto` full entropy lengths:
   - SHA-256 -> 44 chars
   - SHA-512 -> 88 chars
3. Hash-aligned enums equal AUTO for matching hash width.
4. Invalid length enum -> `ErrInvalidLengthEnum`.
5. Entropy exceeded (e.g., SHA-256 with H57Len512) -> `ErrEntropyExceeded`.
6. Verify/valid/canonical helpers return expected results.
7. End-to-end suite passes for SHA-256/SHA-512 and multiple enums.

## Result
UAT decision: ACCEPT
