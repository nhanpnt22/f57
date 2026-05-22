# H57 JavaScript Implementation

Implements H57 hash representation with:
- Hash function: BLAKE3
- Length enums: required, informational, hash-aligned, and auto mode
- Byte-level truncation before B57 encoding

Core API:
- `h57Hash(input, length)`
- `h57Verify(input, h57String, length)`
- `h57IsValid(string)`
- `h57IsCanonical(string)`
