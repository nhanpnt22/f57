# F57 - Python Implementation

**F57 for Python**

This branch contains the Python implementation of the F57 (57-Series) encoding family, including B57, H57, I57, ID57 (incl. fixed-width lengths), R57, and S57.

## Quick Start

```bash
# Install in development mode
pip install -e .

# Run all tests
pytest

# Run with verbose output
pytest -v

# Run benchmarks
python -m pytest benchmarks/
```

## Project Structure

```
python/
├── src/
│   └── f57/
│       ├── __init__.py           # Main export
│       ├── b57.py                # B57 encoding
│       ├── h57.py                # H57 hash representation
│       ├── i57.py                # I57 identifiers
│       ├── id57.py               # ID57 profiles
│       ├── r57.py                # R57 random generation
│       ├── s57.py                # S57 security composition
│       └── errors.py             # Error types
├── tests/
│   ├── test_b57.py
│   ├── test_h57.py
│   ├── test_i57.py
│   ├── test_id57.py
│   ├── test_r57.py
│   ├── test_s57.py
│   └── test_e2e.py
├── benchmarks/
│   └── bench_*.py
├── pyproject.toml
├── setup.py
├── requirements.txt
└── README.md
```

## Key Files

- **[pyproject.toml](pyproject.toml)** - Project configuration
- **[setup.py](setup.py)** - Package setup
- **[src/f57/__init__.py](src/f57/__init__.py)** - Main B57 module (public API)
- **[src/f57/s57.py](src/f57/s57.py)** - S57 security layer
- **[tests/test_b57.py](tests/test_b57.py)** - B57 unit tests
- **[tests/test_e2e.py](tests/test_e2e.py)** - End-to-end tests

## API Overview

### B57 - Binary-to-Text Encoding

```python
from f57 import B57

# Encode bytes to B57 string
data = b'\x01\x02\x03\x04'
encoded = B57.encode(data)
print(encoded)  # B57 string

# Decode B57 string to bytes
decoded = B57.decode(encoded)
assert decoded == data
```

### H57 - Hash Representation

```python
# Hash input to full-length B57 representation
data = b'\x01\x02\x03'
hash_str = H57.hash(data)  # 44-character B57 string (256-bit)
print(hash_str)
```

### ID57 - Identifiers

```python
# Generate deterministic identifier (16-22 chars; length is a bound, not fixed)
id_str = ID57.id(data, ID57Length.DEFAULT)
print(id_str)  # B57 string

# Fixed-width identifiers use a NEGATIVE length_enum - the magnitude is the
# exact character count (a prefix cut of the LEN_128 id), not a bound
short_id = ID57.id(data, ID57Length.FIXED_8)  # always exactly 8 chars
print(short_id)
```

### R57 - Random Generation

```python
# Generate cryptographically secure random identifier
random_id = R57.random()
print(random_id)  # 128-bit random string
```

### S57 - Security Composition

```python
from f57 import S57, H57Length, ID57Length

s57 = S57(
    server_secret_key=b'SECRET_KEY_LONG_ENOUGH_32_BYTES',
    environment_salt=b'prod-v1',
    key_id=7,
)

# Hash with S57
hash_str = s57.hash(b'\x01\x02\x03', H57Length.LEN_256)

# ID with S57
id_str = s57.id(b'\x01\x02\x03', ID57Length.DEFAULT)

# Encryption/Decryption
aad = b'additional data'
encrypted = s57.encrypt(b'\x01\x02\x03', aad)
decrypted = s57.decrypt(encrypted, aad)

print({'hash': hash_str, 'id': id_str, 'encrypted': encrypted})
```

## Running Tests

```bash
# All tests
pytest

# Specific test
pytest tests/test_b57.py

# Verbose output
pytest -v

# With coverage
pip install pytest-cov
pytest --cov=src/f57 --cov-report=html

# Benchmarks
pytest benchmarks/ -v

# Specific benchmark
pytest benchmarks/bench_b57.py -v
```

## Installation

```bash
# Install from local directory
pip install -e .

# Install with development dependencies
pip install -e ".[dev]"

# Install with all extras
pip install -e ".[dev,test]"
```

## Dependencies

- **cryptography** - BLAKE3 and AES-256-GCM
- **pycryptodome** (optional) - Additional crypto functions
- Development: **pytest**, **pytest-cov**

See [pyproject.toml](pyproject.toml) for complete dependency list.

## Specification References

- **B57 Encoding:** [spec/b57-core-api.txt](../spec/b57-core-api.txt)
- **H57 Hash:** [spec/h57-core-api.txt](../spec/h57-core-api.txt)
- **ID57 Identifiers:** [spec/id57-core-api.txt](../spec/id57-core-api.txt)
- **R57 Random:** [spec/r57-core-api.txt](../spec/r57-core-api.txt)
- **S57 Security:** [spec/s57-security-57.txt](../spec/s57-security-57.txt)

## Branch Information

- **Branch:** `python` (Python-only implementation)
- **Version:** v0.2.0
- **Release Branch:** `release/python-v0.2.0`
- **Status:** Production Ready
- **Last Updated:** June 2026

## Multi-Language Support

This repository provides implementations in multiple languages with **guaranteed cross-language parity**:

- **Python** (this branch)
- **Go** - [View `go` branch](../../../tree/go)
- **Rust** - [View `rust` branch](../../../tree/rust)
- **JavaScript** - [View `javascript` branch](../../../tree/javascript)
- **TypeScript** - [View `ts` branch](../../../tree/ts)
- **Dart** - [View `dart` branch](../../../tree/dart)
- **All** - [View `main` branch](../../../tree/main)

Clone only this language:
```bash
git clone --branch python https://github.com/your-org/f57.git
```

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## Security

See [SECURITY.md](../../SECURITY.md) for vulnerability reporting and security policies.

## License

Internal Restricted - See [LICENSE](../../LICENSE) and [LICENSE.md](../../LICENSE.md)

---

**Version:** v0.2.0  
**Last Updated:** June 2026
