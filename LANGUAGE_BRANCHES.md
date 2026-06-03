# Language-Specific Git Branches Guide

This repository uses **clean language-specific branches** to allow developers to clone only the code for their target language, plus shared specifications and documentation.

## 🎯 Quick Start

Clone a specific language branch:

```bash
# Clone just the Dart implementation
git clone --branch dart https://github.com/your-org/f57.git f57-dart

# Or switch to a language branch in existing repo
git checkout dart

# Or clone a specific release version
git clone --branch release/dart-v0.1.4 https://github.com/your-org/f57.git f57-dart-v0.1.4
```

## 📋 Available Branches

### Main Development Branches

Each language has its own clean branch containing **only that language's code** plus shared specs:

| Branch | Language | Files | Status |
|--------|----------|-------|--------|
| `dart` | Dart | 50+ | ✅ Stable |
| `go` | Go | 74+ | ✅ Stable |
| `javascript` | JavaScript/Node.js | 311+ | ✅ Stable |
| `python` | Python | 36+ | ✅ Stable |
| `rust` | Rust | 6200+ | ✅ Stable |
| `ts` | TypeScript | 631+ | ✅ Stable |
| `main` | All languages | All | Reference |

### Release Branches

Each language has dedicated release branches for version control:

```
release/dart-v0.1.3
release/dart-v0.1.4
release/go-v0.1.3
release/go-v0.1.4
release/javascript-v0.1.3
release/javascript-v0.1.4
release/python-v0.1.3
release/python-v0.1.4
release/rust-v0.1.3
release/rust-v0.1.4
release/ts-v0.1.3
release/ts-v0.1.4
```

## 🏗️ Branch Structure

Each language branch contains:

```
repository/
├── implementations/
│   └── {language}/           # ONLY this language (dart, go, javascript, python, rust, or ts)
│       ├── lib/
│       ├── src/
│       ├── test/
│       ├── bin/
│       └── [language-specific config files]
├── spec/                      # Shared API specifications (all branches have this)
├── README.md                  # Repository overview
├── RELEASE.md                 # Release notes
├── LICENSE
├── CHANGELOG.md
└── [other shared docs]
```

### What's NOT in Language Branches

Each language branch **excludes**:
- ❌ Other language implementations (`go/`, `python/`, etc.)
- ❌ Cross-language benchmark records
- ❌ Multi-language test reports

This keeps clones lightweight and focused.

## 🚀 Using Language Branches

### For Dart Developers

```bash
git clone --branch dart https://github.com/your-org/f57.git f57-dart
cd f57-dart
pubspec get
dart test
```

**Branch:** `dart`  
**Key files:** `pubspec.yaml`, `lib/`, `test/`, `bin/`  
**Tags:** `v0.1.0-dart`, `v0.1.3-dart`, `v0.1.4-dart`

---

### For Go Developers

```bash
git clone --branch go https://github.com/your-org/f57.git f57-go
cd f57-go
go mod download
go test ./...
```

**Branch:** `go`  
**Key files:** `go.mod`, `go.sum`, `*.go`, `*_test.go`  
**Tags:** `v0.1.0-go`, `v0.1.3-go`, `v0.1.4-go`

---

### For JavaScript/Node.js Developers

```bash
git clone --branch javascript https://github.com/your-org/f57.git f57-js
cd f57-js
npm install
npm test
```

**Branch:** `javascript`  
**Key files:** `package.json`, `package-lock.json`, `src/`, `test/`, `dist/`  
**Tags:** `v0.1.3-javascript`, `v0.1.4-javascript`

---

### For Python Developers

```bash
git clone --branch python https://github.com/your-org/f57.git f57-python
cd f57-python
pip install -e .
pytest
```

**Branch:** `python`  
**Key files:** `setup.py`, `pyproject.toml`, `requirements.txt`, `src/`, `test/`  
**Tags:** `v0.1.0-python`, `v0.1.3-python`, `v0.1.4-python`

---

### For Rust Developers

```bash
git clone --branch rust https://github.com/your-org/f57.git f57-rust
cd f57-rust
cargo build
cargo test
```

**Branch:** `rust`  
**Key files:** `Cargo.toml`, `Cargo.lock`, `src/`, `tests/`  
**Tags:** `v0.1.0-rust`, `v0.1.3-rust`, `v0.1.4-rust`

---

### For TypeScript Developers

```bash
git clone --branch ts https://github.com/your-org/f57.git f57-ts
cd f57-ts
npm install
npm run build
npm test
```

**Branch:** `ts`  
**Key files:** `tsconfig.json`, `package.json`, `src/`, `test/`, `dist/`  
**Tags:** `v0.1.3-ts`, `v0.1.4-ts`

---

## 📌 Version Tags

Each language branch is tagged with its version:

**Latest stable release:** `v0.1.4-{language}`

```bash
# Checkout a specific version tag
git checkout v0.1.4-dart
git checkout v0.1.4-go
git checkout v0.1.4-rust
```

## 🔄 Working Across Languages

If you need to work with multiple languages:

```bash
# Option 1: Clone multiple branches in separate directories
git clone --branch dart https://github.com/your-org/f57.git f57-dart
git clone --branch go https://github.com/your-org/f57.git f57-go
git clone --branch python https://github.com/your-org/f57.git f57-python

# Option 2: Clone main (contains all languages)
git clone --branch main https://github.com/your-org/f57.git f57
cd f57
# All implementations available in implementations/
```

## 🏷️ Branch and Release Strategy

### Creating a Release

When releasing a new version:

1. Update version in language-specific files (e.g., `pubspec.yaml`, `Cargo.toml`, `package.json`)
2. Create tag: `git tag -a v0.1.x-{language} -m "Release v0.1.x for {language}"`
3. Create/update release branch: `git branch release/{language}-v0.1.x`
4. Push: `git push origin --tags origin release/{language}-v0.1.x`

### Switching Between Languages

```bash
# Current branch context
git branch
# => * dart

# Switch to another language
git checkout go
git branch
# => * go

# Switch back to main (all languages)
git checkout main
```

## 📊 Shared Specifications

All branches include the **shared specifications** in `spec/`:

- `b57-core-api.txt` - Core B57 specification
- `h57-v0.1.0.txt` - H57 variant
- `i57-core-api.txt` - I57 variant
- `id57-v0.1.0.txt` - ID57 variant
- `r57-core-api.txt` - R57 variant
- `s57-v0.1.0.txt` - S57 variant (and variants with `b57-cs-v0.1.0.txt`, etc.)

These specs are identical across all language branches.

## ❓ FAQ

### Q: Can I contribute to a language branch?

**A:** Yes! Submit PRs to the language-specific branch. Language maintainers will review and merge.

### Q: How do I sync with latest changes across all languages?

**A:** Clone the `main` branch, which contains all implementations:
```bash
git clone https://github.com/your-org/f57.git f57-all
```

### Q: Why can't I see other language code in my clone?

**A:** By design! Language branches are clean and focused. Switch to `main` if you need everything:
```bash
git checkout main
```

### Q: What if I need to reference another language implementation?

**A:** Check the `main` branch or that language's branch:
```bash
git fetch origin release/go-v0.1.4
# Then view the code without switching branches
git show release/go-v0.1.4:implementations/go/b57.go
```

### Q: How are language branches kept in sync with specs?

**A:** Shared specification files are automatically maintained across all branches. Update `spec/` on `main`, and it propagates to language branches during release cycles.

## 🔗 Related Resources

- **Main Branch:** `git checkout main` - Contains all implementations
- **Release Notes:** See `RELEASE.md` in any branch
- **Contributing:** See `CONTRIBUTING.md`
- **Security:** See `SECURITY.md`

---

**Last Updated:** June 2026  
**Repository:** F57 Multi-Language Implementation  
**Version:** v0.1.4
