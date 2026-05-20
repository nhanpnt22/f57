# Release Guide

This document defines repository-level release decisions and safe release flow.

## Current Release Posture (2026-05-20)

- Repository-wide unqualified release: **READY (v0.1.0)**
- Go scoped release (`v0.1.0-go`): READY
- JavaScript scoped release (`v0.1.0-js`): READY
- Rust scoped release (`v0.1.0-rust`): READY
- Dart scoped release (`v0.1.0-dart`): READY
- Python scoped release (`v0.1.0-python`): READY

Authoritative assessment sources:

- `PROJECT_ASSESS_RELEASE.md`
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

## Safe Release Pathsn
n
### Path A: Repository-Wide Tag (Allowed Now)n
n
1. Confirm `PROJECT_ASSESS_RELEASE.md` is READY.n
2. Confirm the 10,000 UAT Parity Report is perfectly aligned across all languages.n
3. Tag the repository globally:n
n
```bashn
git tag -a v0.1.0 -m "B57 Spec and Universal Implementations v0.1.0"n
```n
n
### Scoped Language Tags (Optional)n
You may still generate `v0.1.0-go`, `v0.1.0-js`, etc. if relying on scoped module systems.

## Pre-Tag Checklist

- [ ] Intended scope clearly stated (JS-scoped or project-wide)
- [ ] Tests rerun for targeted scope
- [ ] Release docs updated for targeted scope
- [ ] Working tree reviewed for accidental over-staging
- [ ] Assessment docs agree with planned tag
