# ID57 Release Audit

Date: 2026-05-19
Status: READY

## Checklist
- ID57 API implemented in Go: PASS
- One-way HASH -> truncate -> B57 pipeline: PASS
- Determinism: PASS
- Canonical B57 output: PASS
- Byte-level prefix truncation before encoding: PASS
- Unit tests and e2e tests passing: PASS
- Race checks passing: PASS
- Clean conformance to all attached ID57 docs: FAIL

## Evidence
- `go test -v -run "TestID57" ./...`
- `go test -v ./...`
- `go test -race ./...`
- `go test -cover ./...`
- `go test -coverprofile=coverage_b57.out .`
- `go tool cover -func=coverage_b57.out`
- `id57_e2e_test.go` scenarios pass

Coverage evidence (package `github.com/aco/f57`):
- Total statements covered: **97.3%**

## Notes
- ID57 always hashes input before B57 encoding.
- `ID57Default` resolves to `ID57Len128`.
- ID57 generation uses BLAKE3 for hash material.
- The Go implementation uses byte-level prefix truncation before encoding.
- The standalone `spec/id57-v0.1.0.txt` document describes post-encoding truncation and explicit AUTO behavior that this implementation does not expose.
- The current code is closer to the integration and ID57-SHORT documents than to the standalone ID57 profile.

## Recommendation
Do not claim unqualified ID57 spec conformance in a release tag until the ID57 documents are reconciled.

Safe claim today:
- the Go implementation is mechanically validated,
- deterministic and canonical on its implemented byte-truncation model,
- but not cleanly aligned with the entire attached ID57 spec set.
