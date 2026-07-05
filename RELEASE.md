# Release Guide

**F57:** A unified family of secure, deterministic 57-series encodings.

**Description:** F57 is the umbrella architecture for the 57-series standards and implementations (B57, H57, I57, ID57 (incl. fixed-width lengths), R57, S57) across Go, Rust, JavaScript/Node.js, TypeScript/Node.js, Dart, and Python.

**Purpose:** Provide one canonical, cross-language foundation for readable encoding, deterministic identifiers, secure random generation, and security composition, with release-grade parity guarantees.

**Base Layer Note:** B57 remains the canonical base encoding layer within F57.

This document defines repository-level release decisions and safe release flow.

## Current Release Posture (2026-07-05)

**Scope of this release:** ID57-SHORT removed and merged into ID57 Core API;
ID57's non-security lengths replaced by a sign-based model (`FIXED_2`..`FIXED_12`,
negative `length_enum` = exact character width, cut from `ID57_LEN_128`);
`id57_is_length`/`i57_validate_identifier` corrected to match. See
`CHANGELOG.md` [0.3.0] for the full breaking-change list.

- Repository-wide unqualified release: **v0.3.0** (all seven branches -
  `ts`, `main`, `go`, `rust`, `dart`, `javascript`, `python`)
- Go scoped release (`v0.3.0-go`): tests pass (`go test ./...`)
- JavaScript scoped release (`v0.3.0-javascript`): tests pass (`npm test`, 62/62)
- TypeScript package (`implementations/ts`, `v0.3.0`): tests pass (59/59), typecheck
  clean, `npm run build` clean - **`npm run verify:all` / `npm pack` were NOT
  re-rehearsed for this release** (unlike the v0.1.1 execution below)
- Rust scoped release (`v0.3.0-rust`): `cargo test --lib` passes (28/28) - full
  `cargo test` (including cross-language/e2e binaries) was not re-run
- Dart scoped release (`v0.3.0-dart`): `dart test` passes (65/65)
- Python scoped release (`v0.3.0-python`): `pytest -q` passes (78/78)

**Parity evidence for this release is a targeted spot-check, not the full
evidentiary bar below.** A shared test input was run through `id57_generate`
for `LEN_128`, `LEN_32`, and `FIXED_2/4/8/9/12` across all six languages and
compared byte-for-byte - all identical, confirming the `FIXED_j` ⊂ `FIXED_k`
prefix-nesting invariant holds across implementations. This is NOT a re-run
of the 10,000-dataset cross-language benchmark suite that `UAT_10K_PARITY_REPORT.md`
and `s57-benchmark-10000x5-summary.json` document for prior releases - re-run
that suite before publishing if the same rigor as the v0.1.1 release below is
required.

## Release Posture History

### v0.1.1 (2026-05-23)

- Repository-wide unqualified release: **READY (protocol v0.1.0, latest repository tag v0.1.1)**
- Go scoped release (`v0.1.0-go`): READY
- JavaScript scoped release (`v0.1.0-js`): READY
- TypeScript package (`implementations/ts`): READY (package build, verify, and pack rehearsals passed)
- Rust scoped release (`v0.1.0-rust`): READY
- Dart scoped release (`v0.1.0-dart`): READY
- Python scoped release (`v0.1.0-python`): READY

Exact published release tags:

| Tag | Scope | Target |
| --- | --- | --- |
| `v0.1.1` | Repository release on `main` | `6c55fd8` |
| `v0.1.0-go` | Go scoped release | `2f49c4d` |
| `v0.1.0-js` | JavaScript scoped release | `e6ad237` |
| `v0.1.0-rust` | Rust scoped release | `47ec620` |
| `v0.1.0-dart` | Dart scoped release | `f3d1e79` |
| `v0.1.0-python` | Python scoped release | `2253885` |

`main` may move after tag publication for documentation-only follow-up commits; the repository release target remains the commit referenced by `v0.1.1`.

Authoritative assessment sources:

- `PROJECT_ASSESS_RELEASE.md`
- `implementations/FINAL_RELEASE_REPORT_S57_ALL_LANGUAGES.md`
- `implementations/cross_language_records/s57-benchmark-10000x5-summary.json`
- `implementations/javascript/ASSESS_TAG_RELEASE.md`
- `implementations/go/ASSESS_TAG_RELEASE.md`

## Release Principles

1. Scope-first release claims.
2. Language-level release docs must align with project-level gate docs.
3. Deterministic cross-language parity evidence is required for deterministic surfaces.
4. Random APIs must not be judged by same-output parity.

## Required Evidence

Before any release action:

- Go tests pass in `implementations/go`.
- JavaScript tests pass in `implementations/javascript`.
- TypeScript package verification passes in `implementations/ts` (`npm run verify:all`, `npm pack`).
- Cross-language deterministic parity report is current:
  - `UAT_10K_PARITY_REPORT.md`
  - `implementations/cross_language_records/s57-benchmark-10000x5-summary.json`

## Safe Release Paths

### Path A: Repository-Wide Tag (Allowed Now)

1. Confirm `PROJECT_ASSESS_RELEASE.md` is READY.
2. Confirm S57 all-language benchmark parity is zero-mismatch in `implementations/cross_language_records/s57-benchmark-10000x5-summary.json`.
3. Tag the repository globally with the next available repository patch tag (protocol remains `v0.1.0`):

```bash
git tag -a v0.1.1 -m "F57 Family Repository Release v0.1.1 (protocol v0.1.0)"
```

### Scoped Language Tags (Optional)
You may still generate `v0.1.0-go`, `v0.1.0-js`, etc. if relying on scoped module systems.

## Pre-Tag Checklist

- [ ] Intended scope clearly stated (JS-scoped or project-wide)
- [ ] Tests rerun for targeted scope
- [ ] Release docs updated for targeted scope
- [ ] Working tree reviewed for accidental over-staging
- [ ] Assessment docs agree with planned tag

## Official Release Execution (2026-05-22)

Final validation run summary:

- `go test ./...` -> PASS
- `cargo test` -> PASS
- `dart test` -> PASS
- `pytest -q` -> PASS
- `npm test` -> PASS
- `cd implementations/ts && npm run verify:all` -> PASS
- `cd implementations/ts && npm pack` -> PASS
- `node scripts/s57-benchmark-10000x5.mjs` -> PASS

Parity confirmation from `implementations/cross_language_records/s57-benchmark-10000x5-summary.json`:

- Determinism mismatch counts: js=0, go=0, rust=0, dart=0, python=0
- Cross-vs-JS mismatch counts: go=0, rust=0, dart=0, python=0

## Release Runbook (Recommended)

1. Ensure the working tree is intentionally staged (avoid build/cache artifacts).
2. Create release commit:

```bash
git add -A
git commit -m "chore(release): finalize release docs, parity evidence, and release posture"
```

3. Create and push umbrella tag:

```bash
git tag -a v0.1.1 -m "F57 Family Repository Release v0.1.1 (protocol v0.1.0)"
git push origin HEAD
git push origin v0.1.1
```

4. Optionally push scoped tags (`v0.1.0-go`, `v0.1.0-js`, `v0.1.0-rust`, `v0.1.0-dart`, `v0.1.0-python`) if your distribution workflow requires them.
