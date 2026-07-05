# F57 - JavaScript Implementation

**F57 for JavaScript/Node.js**

This branch contains the JavaScript implementation of the F57 (57-Series) encoding family, including B57, H57, I57, ID57 (incl. fixed-width lengths), R57, and S57.

## Quick Start

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run specific tests
npm test -- b57.test.js

# Run benchmarks
npm run benchmark
```

## Project Structure

```
javascript/
├── src/
│   ├── index.js         # Main export
│   ├── b57.js           # B57 encoding
│   ├── h57.js           # H57 hash representation
│   ├── i57.js           # I57 identifiers
│   ├── id57.js          # ID57 profiles
│   ├── r57.js           # R57 random generation
│   ├── s57.js           # S57 security composition
│   └── errors.js        # Error types
├── test/
│   ├── b57.test.js
│   ├── h57.test.js
│   ├── i57.test.js
│   ├── id57.test.js
│   ├── r57.test.js
│   ├── s57.test.js
│   └── e2e.test.js
├── dist/                # Compiled output
├── package.json
├── package-lock.json
└── README.md
```

## Key Files

- **[package.json](package.json)** - Package manifest and scripts
- **[src/index.js](src/index.js)** - Main B57 module (public API)
- **[src/s57.js](src/s57.js)** - S57 security layer
- **[test/b57.test.js](test/b57.test.js)** - B57 unit tests
- **[test/e2e.test.js](test/e2e.test.js)** - End-to-end tests

## API Overview

### B57 - Binary-to-Text Encoding

```javascript
import { B57 } from './src/index.js';

// Encode bytes to B57 string
const bytes = new Uint8Array([1, 2, 3, 4]);
const encoded = B57.encode(bytes);
console.log(encoded); // B57 string

// Decode B57 string to bytes
const decoded = B57.decode(encoded);
console.log(decoded); // Uint8Array
```

### H57 - Hash Representation

```javascript
// Hash input to full-length B57 representation
const input = new Uint8Array([1, 2, 3]);
const hash = H57.hash(input); // 44-character B57 string (256-bit)
console.log(hash);
```

### ID57 - Identifiers

```javascript
// Generate deterministic identifier (16-22 chars; length is a bound, not fixed)
const id = ID57.id(input, ID57Length.DEFAULT);
console.log(id); // B57 string

// Fixed-width identifiers use a NEGATIVE length_enum - the magnitude is the
// exact character count (a prefix cut of the LEN_128 id), not a bound
const shortId = ID57.id(input, ID57Length.FIXED_8); // always exactly 8 chars
console.log(shortId);
```

### R57 - Random Generation

```javascript
// Generate cryptographically secure random identifier
const random = R57.random();
console.log(random); // 128-bit random string
```

### S57 - Security Composition

```javascript
import { S57, H57Length, ID57Length } from './src/index.js';

const s57 = new S57({
  server_secret_key: new TextEncoder().encode('SECRET_KEY_LONG_ENOUGH_32_BYTES'),
  environment_salt: new TextEncoder().encode('prod-v1'),
  key_id: 7,
});

// Hash with S57
const hash = s57.hash(new Uint8Array([1, 2, 3]), H57Length.LEN_256);

// ID with S57
const id = s57.id(new Uint8Array([1, 2, 3]), ID57Length.DEFAULT);

// Encryption/Decryption
const aad = new TextEncoder().encode('additional data');
const encrypted = s57.encrypt(new Uint8Array([1, 2, 3]), aad);
const decrypted = s57.decrypt(encrypted, aad);

console.log({ hash, id, encrypted, decrypted });
```

## Running Tests

```bash
# All tests
npm test

# Specific test file
npm test b57.test.js

# Watch mode
npm test -- --watch

# Coverage
npm run test:coverage

# Benchmarks
npm run benchmark

# S57 cross-language benchmark
npm run benchmark:s57-5lang
```

## Scripts

```bash
# Run tests
npm test

# Build distribution
npm run build

# Run benchmarks
npm run benchmark

# S57 5-language parity benchmark
npm run benchmark:s57-5lang

# Coverage report
npm run test:coverage

# Lint code (if configured)
npm run lint
```

## Dependencies

- **crypto** (Node.js built-in) - BLAKE3 and AES-256-GCM
- Development: **jest**, **@types/node**

See [package.json](package.json) for complete dependency list.

## Building

```bash
# Transpile to distribution
npm run build

# Output in dist/ directory
ls -la dist/
```

## Specification References

- **B57 Encoding:** [spec/b57-core-api.txt](../spec/b57-core-api.txt)
- **H57 Hash:** [spec/h57-core-api.txt](../spec/h57-core-api.txt)
- **ID57 Identifiers:** [spec/id57-core-api.txt](../spec/id57-core-api.txt)
- **R57 Random:** [spec/r57-core-api.txt](../spec/r57-core-api.txt)
- **S57 Security:** [spec/s57-security-57.txt](../spec/s57-security-57.txt)

## Branch Information

- **Branch:** `javascript` (JavaScript-only implementation)
- **Version:** v0.3.0
- **Release Branch:** `release/javascript-v0.3.0`
- **Status:** Production Ready
- **Last Updated:** July 2026

## Multi-Language Support

This repository provides implementations in multiple languages with **guaranteed cross-language parity**:

- **JavaScript** (this branch)
- **Go** - [View `go` branch](../../../tree/go)
- **Rust** - [View `rust` branch](../../../tree/rust)
- **Dart** - [View `dart` branch](../../../tree/dart)
- **TypeScript** - [View `ts` branch](../../../tree/ts)
- **Python** - [View `python` branch](../../../tree/python)
- **All** - [View `main` branch](../../../tree/main)

Clone only this language:
```bash
git clone --branch javascript https://github.com/your-org/f57.git
```

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## Security

See [SECURITY.md](../../SECURITY.md) for vulnerability reporting and security policies.

## License

Internal Restricted - See [LICENSE](../../LICENSE) and [LICENSE.md](../../LICENSE.md)

---

**Version:** v0.3.0  
**Last Updated:** July 2026
