# ID57-SHORT JavaScript Implementation

Implements the constrained short profile with allowed lengths:
- LEN_23 (4 chars)
- LEN_29 (5 chars)
- LEN_32 (6 chars)
- LEN_47 (typically 8 chars, can be 9 with strict 47-bit byte-level truncation)
- LEN_70 (12 chars)

Default short mode resolves to LEN_47.

Core API:
- `id57ShortGenerate(input, length)`
- `id57ShortGenerateDefault(input)`
- `id57ShortVerify(input, id57String, length)`
- `id57ShortVerifyDefault(input, id57String)`
- `id57ShortIsValid(string)`
- `id57ShortIsCanonical(string)`
