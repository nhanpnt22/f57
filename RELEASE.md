# Release Guide

This document defines repository-level release decisions and safe release flow.

## Current Release Posture (2026-05-22)

- Repository-wide unqualified release: **READY (v0.1.0)**
- Go scoped release (`v0.1.0-go`): READY
- JavaScript scoped release (`v0.1.0-js`): READY
- Rust scoped release (`v0.1.0-rust`): READY
- Dart scoped release (`v0.1.0-dart`): READY
- Python scoped release (`v0.1.0-python`): READY

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
- Cross-language deterministic parity report is current:
  - `UAT_10K_PARITY_REPORT.md`
  - `implementations/cross_language_records/s57-benchmark-10000x5-summary.json`

## Safe Release Paths

### Path A: Repository-Wide Tag (Allowed Now)

1. Confirm `PROJECT_ASSESS_RELEASE.md` is READY.
2. Confirm S57 all-language benchmark parity is zero-mismatch in `implementations/cross_language_records/s57-benchmark-10000x5-summary.json`.
3. Tag the repository globally:

```bash
git tag -a v0.1.0 -m "B57 Spec and Universal Implementations v0.1.0"
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
- `node scripts/s57-benchmark-10000x5.mjs` -> PASS

Parity confirmation from `implementations/cross_language_records/s57-benchmark-10000x5-summary.json`:

- Determinism mismatch counts: js=0, go=0, rust=0, dart=0, python=0
- Cross-vs-JS mismatch counts: go=0, rust=0, dart=0, python=0

## Release Runbook (Recommended)

1. Ensure the working tree is intentionally staged (avoid build/cache artifacts).
2. Create release commit:

```bash
git add -A
git commit -m "chore(release): finalize v0.1.0 docs, parity evidence, and release posture"
```

3. Create and push umbrella tag:

```bash
git tag -a v0.1.0 -m "B57 Spec and Universal Implementations v0.1.0"
git push origin HEAD
git push origin v0.1.0
```

4. Optionally push scoped tags (`v0.1.0-go`, `v0.1.0-js`, `v0.1.0-rust`, `v0.1.0-dart`, `v0.1.0-python`) if your distribution workflow requires them.
