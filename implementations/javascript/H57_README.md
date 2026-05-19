# H57 JavaScript Implementation

Implements H57 hash representation with:
- Hash functions: BLAKE3, SHA-256, SHA-512
- Length enums: required, informational, hash-aligned, and auto mode
- Byte-level truncation before B57 encoding

Core API:
- `h57Hash(input, hashFn, length)`
- `h57Verify(input, h57String, hashFn, length)`
- `h57IsValid(string)`
- `h57IsCanonical(string)`
