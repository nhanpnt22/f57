# Contributing

Thanks for contributing to F57.

## Scope

- F57 is the umbrella project.
- B57 remains the canonical base encoding layer.
- Protocol specs in `spec/` are authoritative.

## Contribution Rules

1. Keep behavior deterministic across Go, Rust, JavaScript/Node.js, Dart, and Python.
2. Do not change spec semantics without updating the corresponding spec file and release docs.
3. Add or update tests for every behavior change.
4. Preserve canonical ASCII-safe outputs and strict validation behavior.
5. Avoid committing generated artifacts (`target/`, `.dart_tool/`, `__pycache__/`, coverage outputs).

## Validation Before PR

Run relevant checks for your scope:

```bash
# Go
cd implementations/go && go test ./...

# JavaScript
cd implementations/javascript && npm test

# Rust
cd implementations/rust && cargo test

# Dart
cd implementations/dart && dart test

# Python
cd implementations/python && pytest -q
```

For cross-language deterministic checks, run:

```bash
cd implementations/javascript && node scripts/s57-benchmark-10000x5.mjs
```

## Documentation

- Keep top-level docs consistent with the current release posture.
- Use normalized spec filenames in links (for example, `spec/b57-core-api.txt`, `spec/s57-security-57.txt`).
