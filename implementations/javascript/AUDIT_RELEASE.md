# JavaScript Release Audit

Date: 2026-05-19
Status: PASS

## Conformance Summary
- B57 CORE API: PASS
- H57 CORE API: PASS
- I57 CORE API (MINDU): PASS
- ID57 CORE API (MINDU): PASS
- ID57-SHORT PROFILE: PASS
- R57 CORE API (MINDU): PASS
- B57S stack constraints: PASS

## Notes
- Truncation is applied on raw hash bytes before B57 encoding.
- Supported hash functions: BLAKE3, SHA-256, SHA-512.
- Error model distinguishes INVALID_CHAR, NON_CANONICAL, INVALID_LENGTH_ENUM, ENTROPY_EXCEEDED, INVALID_HASH_FUNCTION.
- Validation includes I57 integration helper surface and R57 mode coverage.

## Scoped Artifacts
- `I57_AUDIT_RELEASE.md`
- `R57_AUDIT_RELEASE.md`

## Cross-Language Evidence
- Deterministic parity artifacts: `../cross_language_records/summary.json`, `../cross_language_records/summary.md`
- Result: PASS (Go and JavaScript deterministic surfaces aligned for 10,000 datasets x 3 runs)

Release Decision: APPROVED
