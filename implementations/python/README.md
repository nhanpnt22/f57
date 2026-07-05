# B57 Python Implementation

Complete Python implementation of:

- B57
- H57
- ID57 (bit-length and fixed-width modes; ID57-SHORT has been merged in)
- I57
- R57

## Test Coverage

Test layers:

- Unit tests in `tests/` across core modules
- End-to-end integration test: `tests/test_e2e.py`
- Cross-language deterministic parity test: `tests/test_cross_language.py`

Parity test details:

- Dataset size: 10,000
- Comparators: Go, JavaScript, Rust, Dart implementations
- Assertion: field-by-field deterministic parity

## Run

```bash
cd implementations/python
pip install -e .
pip install pytest pytest-cov
pytest
pytest --cov=src/f57 --cov-report=html
```

## Coverage (Target >90%)

Run with:

```bash
pytest --cov=src/f57 --cov-report=term-missing
```
