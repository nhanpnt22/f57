# B57 Dart Implementation

Complete Dart implementation of:

- B57
- H57
- ID57 (bit-length and fixed-width modes; ID57-SHORT is merged into ID57)
- I57
- R57

## Test Coverage

Test layers:

- Unit tests in `test/` across core modules
- End-to-end integration test: `test/e2e_test.dart`
- Cross-language deterministic parity test: `test/cross_language_10000_test.dart`

Parity test details:

- Dataset size: 10,000
- Comparators: Go (`../go/cmd/crosslang`) and Rust tests
- Assertion: field-by-field deterministic parity

## Run

```bash
cd implementations/dart
dart pub get
dart test
```

## Coverage (Target >90%)

Generate coverage report:

```bash
dart pub global activate coverage
dart pub global run coverage:format_coverage
dart test --coverage=coverage
```
