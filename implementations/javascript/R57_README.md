# R57 (MINDU) JavaScript Implementation

This is the standard JavaScript implementation of the **R57 Core API** and **R57 Profile**, used to generate 128-bit full-entropy random identifiers encoded in canonical B57 format.

## Features

- **128-Bit Minimal Entropy Guarantee**: Generates exact 128-bit blocks of entropy using `node:crypto.randomBytes()`.
- **Full Mode Enum Support**: R57_1 through R57_8 are implemented.
- **Canonical Encoding**: Outputs strictly 22-character canonical B57 representations.
- **Zero Pad Preservation**: Guarantees full bit-length representation consistency.
- **Platform Integrity**: Validated on Node.js.

## Usage

```javascript
import { R57Mode, r57Generate, r57IsValid, r57IsCanonical } from '@aco/f57';

// Generate a new 128-bit securely random identifier
const id = r57Generate(R57Mode.R57_1_CSPRNG);
// Example: '4TqV4mZ2V3Z4P2P2mJqT9Z'

// Check structure validity
console.log(r57IsValid(id)); // true

// Check canonical validity
console.log(r57IsCanonical(id)); // true
```

## Security Guarantees
Always utilizes hardware-backed `urandom` or active CSPRNGs from the core OS (via Node `crypto`).

## Conformance
This implementation conforms to `R57 CORE API` and `R57 PROFILE` status `v0.1.0 FINAL`.
