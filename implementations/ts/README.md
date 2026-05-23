# B57 TypeScript Implementation

TypeScript/Node.js implementation of B57, H57, ID57, ID57-SHORT, R57, I57, and S57.

## Install

```bash
cd implementations/ts
npm install
```

## Validate

```bash
npm run verify:all
```

## Build (for release)

```bash
npm run build
```

Build output is written to `dist/` and is the only content published by npm.

## API Surface

Exports are available from `index`:

- `encode`, `decode`, `isValid`, `isCanonical`, `encodedLength`, `decodedLength`
- `h57Hash`, `h57Verify`, `h57IsValid`, `h57IsCanonical`, `H57Length`
- `id57Generate`, `id57GenerateDefault`, `id57Verify`, `ID57Length`
- `id57ShortGenerate`, `id57ShortGenerateDefault`, `id57ShortVerify`, `ID57ShortLength`
- `r57Generate`, `r57IsValid`, `r57IsCanonical`, `R57Mode`
- `i57Encode`, `i57Decode`, `i57Hash`, `i57Random`, `i57Id`
- `S57`
