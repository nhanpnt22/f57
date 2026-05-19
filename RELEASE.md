# Release Guide

This document defines repository-level release decisions and safe release flow.

## Current Release Posture (2026-05-19)

- Repository-wide unqualified release: NOT READY
- JavaScript scoped release (`v0.1.0-js`): READY
- Rust scoped release (`v0.1.0-rust`): READY
- Dart scoped release (`v0.1.0-dart`): READY
- Python scoped release (`v0.1.0-python`): READY
- Go broad spec-claiming release: NOT READY

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
  - `implementations/cross_language_records/summary.json`

## Safe Release Paths

### Path A: JavaScript Scoped Tag (Allowed Now)

1. Confirm `implementations/javascript/ASSESS_TAG_RELEASE.md` is READY.
2. Confirm project-level scope remains partial-ready.
3. Tag JavaScript scope only:

```bash
git tag -a v0.1.0-js -m "B57 JavaScript implementation v0.1.0"
```

### Path B: Repository-Wide Tag (Blocked)

Blocked until project-level and language-level gates all show ready states and no blocker remains in Go release assessments.

## Pre-Tag Checklist

- [ ] Intended scope clearly stated (JS-scoped or project-wide)
- [ ] Tests rerun for targeted scope
- [ ] Release docs updated for targeted scope
- [ ] Working tree reviewed for accidental over-staging
- [ ] Assessment docs agree with planned tag
