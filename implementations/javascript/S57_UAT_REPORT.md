# S57 JavaScript UAT Report

Date: 2026-05-21
Status: PASS (JavaScript S57 scope)

## Scope

- S57 constructor and key derivation
- S57 keyed hash and keyed identifier APIs
- S57 random API family
- S57 AES-256-GCM envelope encryption/decryption (`version|key_id|nonce|ciphertext|tag`)
- Deterministic validation on 1000 datasets, 3 runs (historical)
- Cross-language release validation on 10000 datasets, 5 languages

## Executed

- `node --test s57.test.js s57_e2e.test.js`
- `npm test`
- `npm run test:coverage`
- `npm run test:s57-cross-language-1000x3`
- `node scripts/s57-benchmark-10000x5.mjs`

## Acceptance Scenarios

1. Key derivation yields 32-byte domain-separated keys.
2. `hash()` and `id()` are deterministic and canonical for valid S57 profile lengths.
3. `random*` APIs return canonical 22-char B57 outputs.
4. `random_derived(master_secret, unique_input)` is deterministic for identical inputs.
5. `encrypt()/decrypt()` round-trip succeeds with matching AAD.
6. Decrypt fails closed on wrong AAD.
7. Decrypt rejects unknown `key_id` and invalid `version`.
8. 1000x3 determinism for JS core + S57 deterministic surfaces is zero-mismatch.
9. 10000x5 parity benchmark has zero mismatches across JS/Go/Rust/Dart/Python.

## Results

- Focused S57 tests: PASS (11 passed, 0 failed)
- Full JavaScript suite: PASS
- Coverage: Lines 95.08%, Branches 90.12%, Functions 96.70%
- 1000x3 runs (determinism):
  - JS core deterministic mismatch: 0/1000 each run
  - JS S57 deterministic mismatch: 0/1000 each run
- 10000x5 release parity run:
  - Determinism mismatches: JS=0, Go=0, Rust=0, Dart=0, Python=0
  - Cross vs JS mismatches: Go=0, Rust=0, Dart=0, Python=0
