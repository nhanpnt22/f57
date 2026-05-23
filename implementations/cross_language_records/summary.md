# Cross-Language E2E Records

Date: 2026-05-23T15:18:02.032Z
Dataset size: 10000
Runs per language: 3

Deterministic scope:
- encode/decode/isValid/isCanonical/length helpers
- h57 hash/verify
- id57 and id57-short generate/verify
- i57 encode/decode/hash/id/validation
- r57 validators on deterministic identifier input

Excluded as nondeterministic:
- r57Generate
- i57Random

Run results:
- Run 1: JS deterministic mismatches=0, Go deterministic mismatches=0, Cross-language mismatches=0
- Run 2: JS deterministic mismatches=0, Go deterministic mismatches=0, Cross-language mismatches=0
- Run 3: JS deterministic mismatches=0, Go deterministic mismatches=0, Cross-language mismatches=0
