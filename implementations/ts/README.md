# B57 TypeScript Implementation

TypeScript/Node.js implementation of B57, H57, ID57 (including short/informational lengths), R57, I57, and S57.

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
- `id57Generate`, `id57GenerateDefault`, `id57Verify`, `id57Range`, `id57IsLength`, `ID57Length`
  (short identifiers are `id57Generate(x, ID57Length.LEN_47)` etc. - there is no separate short API)
- `r57Generate`, `r57IsValid`, `r57IsCanonical`, `R57Mode`
- `i57Encode`, `i57Decode`, `i57Hash`, `i57Random`, `i57Id`
- `S57`
