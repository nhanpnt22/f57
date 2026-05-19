# B57 Repository

This repository contains multi-language implementations and release artifacts for the B57 stack:

- B57 (encoding)
- H57 (hash representation)
- ID57 / ID57-SHORT (identifier profiles)
- I57 (integration API)
- R57 (random identifier API)

Primary implementation folders:

- `implementations/go`
- `implementations/javascript`

Reference specifications live under `spec/`.

## Repository Layout

- `implementations/`: language implementations, tests, and language-scoped release docs
- `spec/`: normative and reference specification documents
- `PROJECT_ASSESS_COMMIT.md`: repository-level commit gate assessment
- `PROJECT_ASSESS_RELEASE.md`: repository-level release gate assessment

## Current Project Status

- Commit readiness (project level): READY WITH SCOPED COMMIT
- Release readiness (project level): PARTIAL READY
- JavaScript scoped release: READY (`v0.1.0-js`)
- Go broad spec-claiming release: NOT READY (see Go release assessments)

## Validation Summary

- Go tests pass (`go test ./...` in `implementations/go`)
- JavaScript tests pass (`npm test` in `implementations/javascript`)
- Cross-language deterministic parity passes:
	- 10,000 datasets
	- 3 runs per language
	- 0 mismatches
	- Artifacts: `implementations/cross_language_records/summary.json`, `implementations/cross_language_records/summary.md`

## Common Commands

Go:

```bash
cd implementations/go
go test ./...
```

JavaScript:

```bash
cd implementations/javascript
npm test
npm run test:coverage
npm run test:cross-language
```

## Release Guidance

Use scoped release decisions from language-level and project-level assessments:

- Project: `PROJECT_ASSESS_RELEASE.md`
- JavaScript: `implementations/javascript/ASSESS_TAG_RELEASE.md`
- Go: `implementations/go/ASSESS_TAG_RELEASE.md`

Do not publish an unqualified repository-wide release tag until all project-level release gates are satisfied.

## License

This repository currently uses a restricted internal license posture.

- Canonical file: `LICENSE`
- Explanatory notes: `LICENSE.md`
