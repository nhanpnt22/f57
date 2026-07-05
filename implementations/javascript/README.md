# B57 JavaScript Implementation

This folder provides JavaScript parity with the Go implementation for:
- B57 encoding layer
- H57 hash representation layer
- I57 integration layer
- ID57 core profile (bit-length and fixed-width identifiers; ID57-SHORT
  is merged into ID57 core, see spec/id57-core-api.txt section 10)
- R57 random identifier profile
- S57 secure composition profile (JavaScript implementation)

Runtime notes:
- Node.js 20+ supported
- TypeScript projects can consume ESM exports directly

## Specs
- [B57 CORE API](../../spec/b57-core-api.txt)
- [H57 CORE API](../../spec/h57-core-api.txt)
- [I57 CORE API](../../spec/i57-core-api.txt)
- [ID57 CORE API (MINDU)](../../spec/id57-core-api.txt)
- [R57 CORE API (MINDU)](../../spec/r57-core-api.txt)
- [S57 - Security 57](../../spec/s57-security-57.txt)
- [B57S-v0.1.0](../../spec/b57s-v0.1.0.txt)

## Install

```bash
cd implementations/javascript
npm install
```

## Test

```bash
npm test
npm run test:coverage
```

## API

- `encode(bytes)`, `decode(string)`, `isValid(string)`, `isCanonical(string)`
- `h57Hash(input, length)`, `h57Verify(input, h57String, length)`
- `i57Encode(input)`, `i57Decode(string)`, `i57Hash(input, length)`
- `i57Random(mode)`, `i57Id(input, length)`, `i57IsValid(string)`, `i57IsCanonical(string)`
- `i57ValidateIdentifier(string)`, `i57ValidateEntropy(string)`
- `id57Generate(input, length)`, `id57GenerateDefault(input)`
- `id57Verify(input, id57String, length)`, `id57VerifyDefault(input, id57String)`
- `id57IsValid(string)`, `id57IsCanonical(string)`
- `id57Range(length)`, `id57IsLength(string, length)` (fixed widths only), `resolveID57Length(length)`
- `ID57Length` (bit lengths `LEN_8..LEN_512`/`DEFAULT`; fixed widths `FIXED_2..FIXED_12`)
- `r57Generate(mode)`, `r57IsValid(string)`, `r57IsCanonical(string)`, `R57Mode`
- `S57` class secure APIs (`hash/id/random*/encrypt/decrypt`)

Exports are available from [index.js](index.js).

## Current Validation Snapshot

- Tests: 54 passed, 0 failed
- Coverage: 96.23% lines, 92.33% branches, 99.32% functions
