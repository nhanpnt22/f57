# F57 v0.2.0 Release Notes

**Date:** June 3, 2026  
**Version:** v0.2.0  
**Status:** Production Release

## Overview

F57 v0.2.0 establishes the multi-language branching strategy and comprehensive language-specific documentation for all six implementations: Go, Rust, JavaScript, TypeScript, Dart, and Python.

## What's New in v0.2.0

### 1. Multi-Language Repository Structure

This release introduces **clean, language-specific branches** to keep developer clones focused and lightweight:

- **Language Branches** (6 total): `dart`, `go`, `javascript`, `python`, `rust`, `ts`
  - Each branch contains **only** that language's implementation
  - Shared specifications included on all branches
  - Cross-language files and benchmarks removed
  - Lightweight clones: 36 - 6,200+ files per language (vs. 7,500+ on main)

- **Release Branches** (12 total): `release/{language}-v{version}`
  - Version-specific branches for each language
  - Enables per-language release cycles
  - Examples: `release/dart-v0.2.0`, `release/go-v0.2.0`, etc.

- **Main Branch** (`main`): Contains all 6 language implementations
  - Reference for cross-language comparisons
  - Complete parity validation

### 2. Language-Specific Documentation

Each language branch now includes a dedicated README with language-specific guidance:

- **[DART_README.md](DART_README.md)** - Dart implementation guide
- **[GO_README.md](GO_README.md)** - Go implementation guide
- **[JAVASCRIPT_README.md](JAVASCRIPT_README.md)** - JavaScript implementation guide
- **[PYTHON_README.md](PYTHON_README.md)** - Python implementation guide
- **[RUST_README.md](RUST_README.md)** - Rust implementation guide
- **[TYPESCRIPT_README.md](TYPESCRIPT_README.md)** - TypeScript implementation guide

Each includes:
- Quick start commands for that language
- Project structure overview
- Language-specific API examples
- Testing and building instructions
- Dependency management for that language

### 3. Updated Main README

[README.md](README.md) updated with:
- **Multi-language quick-start table** at the top
- Branch information and strategy
- Per-language clone examples
- Unified testing instructions for all languages
- Links to language-specific documentation

### 4. Comprehensive Branching Documentation

- **[LANGUAGE_BRANCHES.md](LANGUAGE_BRANCHES.md)** - Detailed branching strategy and per-language quickstart
- **[BRANCH_SETUP_SUMMARY.md](BRANCH_SETUP_SUMMARY.md)** - Complete branch structure and verification checklist

### 5. Version Tags

All language branches tagged with v0.2.0 release markers:

```
v0.2.0-dart       v0.2.0-go          v0.2.0-javascript
v0.2.0-python     v0.2.0-rust        v0.2.0-ts
```

## Breaking Changes

**None.** This release is fully backward compatible with v0.1.x implementations.

## Recommended Actions

### For End Users

1. **Clone your language only:**
   ```bash
   git clone --branch dart https://github.com/your-org/f57.git
   # or
   git clone --branch go https://github.com/your-org/f57.git
   # or similar for javascript, python, rust, ts
   ```

2. **Read the language-specific README:**
   - Each branch includes language-specific setup and examples
   - Look for `[LANGUAGE]_README.md` files on each branch

3. **Check the branching guide:**
   - See [LANGUAGE_BRANCHES.md](LANGUAGE_BRANCHES.md) for complete information

### For Maintainers

1. **Update clones to new structure:**
   ```bash
   # For Dart team:
   git clone --branch dart https://github.com/your-org/f57.git f57-dart
   
   # For Go team:
   git clone --branch go https://github.com/your-org/f57.git f57-go
   
   # etc.
   ```

2. **Use language-specific branches for PRs:**
   - Submit PRs to language branches, not main
   - Main reserved for spec/doc updates and cross-language releases

3. **Reference language-specific READMEs:**
   - Each README includes build, test, and contribution guidelines

### For Cross-Language Work

1. **Use main branch for all implementations:**
   ```bash
   git clone https://github.com/your-org/f57.git
   # All implementations available in implementations/
   ```

2. **Run all test suites:**
   - See updated README.md § 6.1 for complete test commands

3. **Cross-language parity checks:**
   - Use S57 benchmark tool: `npm run benchmark:s57-5lang`

## Documentation Structure

### Top-Level Files (All Branches)

- [README.md](README.md) - Main repository overview with multi-language info
- [LANGUAGE_BRANCHES.md](LANGUAGE_BRANCHES.md) - Branching strategy guide
- [BRANCH_SETUP_SUMMARY.md](BRANCH_SETUP_SUMMARY.md) - Branch verification checklist

### Language-Specific READMEs (main branch only, for reference)

- [DART_README.md](DART_README.md)
- [GO_README.md](GO_README.md)
- [JAVASCRIPT_README.md](JAVASCRIPT_README.md)
- [PYTHON_README.md](PYTHON_README.md)
- [RUST_README.md](RUST_README.md)
- [TYPESCRIPT_README.md](TYPESCRIPT_README.md)

**Note:** On language-specific branches, these appear as `README.md` with that branch's language info.

### Existing Documentation (Preserved)

- [F57.md](F57.md) - F57 umbrella family definition
- [FINAL_RELEASE_ASSESSMENT.md](FINAL_RELEASE_ASSESSMENT.md) - v0.1.0 release sign-off
- [PROJECT_ASSESS_RELEASE.md](PROJECT_ASSESS_RELEASE.md) - Release gates and criteria
- [UAT_10K_PARITY_REPORT.md](UAT_10K_PARITY_REPORT.md) - Cross-language parity proof
- [BENCHMARKS.md](BENCHMARKS.md) - Performance data
- [SECURITY.md](SECURITY.md) - Security policies
- [CHANGELOG.md](CHANGELOG.md) - Version history

## Files Changed in v0.2.0

### Added

- `README.md` (updated with multi-language info)
- `LANGUAGE_BRANCHES.md`
- `BRANCH_SETUP_SUMMARY.md`
- `DART_README.md`
- `GO_README.md`
- `JAVASCRIPT_README.md`
- `PYTHON_README.md`
- `RUST_README.md`
- `TYPESCRIPT_README.md`

### Modified

- `README.md` - Added multi-language branching strategy section

### Branch Structure

- Each language branch (`dart`, `go`, `javascript`, `python`, `rust`, `ts`)
  - Contains cleaned implementation (language code only)
  - Includes shared `spec/` directory
  - Includes language-appropriate README in root

## Installation & Testing

### Quick Start

```bash
# Clone your language
git clone --branch dart https://github.com/your-org/f57.git

# Install and test
cd f57/implementations/dart
pubspec get
dart test
```

### All Languages (main branch)

```bash
git clone https://github.com/your-org/f57.git
cd f57

# Test all languages
cd implementations/go && go test ./...
cd ../javascript && npm test
cd ../python && pytest
cd ../rust && cargo test
cd ../dart && dart test
cd ../ts && npm test
```

## Specifications (Unchanged)

All underlying F57 protocol specifications remain unchanged from v0.1.0:

- **B57 v1.0** - Binary-to-text encoding
- **H57 v1.0** - Hash representation layer
- **I57 v1.0** - Integration interface
- **ID57 v1.0** - Identifier profile (22-char)
- **ID57-SHORT v1.0** - Compact identifier (8-char)
- **R57 v1.0** - Random generation profile
- **S57 v1.0** - Security composition layer

See `/spec` directory for complete specification documents.

## Known Issues

None identified in v0.2.0 release.

## Upgrade Notes

### From v0.1.x to v0.2.0

1. **No code changes required** - API is 100% compatible
2. **Clone strategy changes:**
   - Can now clone specific language branches instead of full repo
   - Smaller clones (36 - 6,200 files vs. 7,500+)
   - Faster initial setup for language-specific work

3. **Documentation location:**
   - Main info still in top-level README.md
   - Language-specific details now in language-specific READMEs

4. **Branch names remain the same:**
   - `dart`, `go`, `javascript`, `python`, `rust`, `ts`, `main`
   - Previous release branches preserved

## Contributors & Maintainers

- **Go:** [Go team]
- **Rust:** [Rust team]
- **JavaScript:** [JavaScript team]
- **TypeScript:** [TypeScript team]
- **Dart:** [Dart team]
- **Python:** [Python team]

## Contact & Support

For issues specific to a language implementation, file an issue on:
- The language-specific branch
- Or reference the language in your issue title

## Deployment Checklist

- [x] Main README updated with multi-language info
- [x] Language-specific READMEs created
- [x] Branching documentation complete
- [x] All branches tagged with v0.2.0
- [x] Release notes (this document) created
- [x] All tests passing
- [x] Cross-language parity validated
- [x] Documentation links verified

## Next Release (v0.3.0 - Future)

Planned improvements:
- Language-specific version independence (allow Go v0.3.0 + Python v0.2.0)
- Per-language release cycles
- Automated cross-language test synchronization
- Per-language security audit cycles

## License & Attribution

Internal Restricted - See [LICENSE](LICENSE) and [LICENSE.md](LICENSE.md)

---

**Release Date:** June 3, 2026  
**Version:** v0.2.0  
**Status:** ✅ Production Ready

For detailed information, see:
- [LANGUAGE_BRANCHES.md](LANGUAGE_BRANCHES.md) - Branch strategy
- [README.md](README.md) - Main documentation
- Language-specific READMEs for implementation details
