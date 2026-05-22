# B57 JavaScript Implementation

This folder provides JavaScript parity with the Go implementation for:
- B57 encoding layer
- H57 hash representation layer
- I57 integration layer
- ID57 core profile
- ID57-SHORT profile
- R57 random identifier profile
- S57 secure composition profile (JavaScript implementation)

Runtime notes:
- Node.js 20+ supported
- TypeScript projects can consume ESM exports directly

## Specs
- [B57 CORE API](../../spec/B57%20CORE%20API.txt)
- [H57 CORE API](../../spec/H57%20CORE%20API.txt)
- [I57 CORE API](../../spec/I57%20CORE%20API.txt)
- [ID57 CORE API (MINDU)](../../spec/ID57%20CORE%20API.txt)
- [ID57-SHORT PROFILE](../../spec/ID57-SHORT%20PROFILE.txt)
- [R57 CORE API (MINDU)](../../spec/R57%20CORE%20API.txt)
- [S57 - Security 57](../../spec/S57-%20Security%2057.txt)
- [B57S-v0.1.0](../../spec/B57S-v0.1.0.txt)

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
- `id57ShortGenerate(input, length)`, `id57ShortGenerateDefault(input)`
- `r57Generate(mode)`, `r57IsValid(string)`, `r57IsCanonical(string)`, `R57Mode`
- `S57` class secure APIs (`hash/id/random*/encrypt/decrypt`)

Exports are available from [index.js](index.js).

## Current Validation Snapshot

- Tests: 54 passed, 0 failed
- Coverage: 96.23% lines, 92.33% branches, 99.32% functions
