# ID57 JavaScript Implementation

Implements ID57 core one-way profile:

`input -> HASH -> truncate bytes -> B57`

Core API:
- `id57Generate(input, hashFn, length)`
- `id57GenerateDefault(input)`
- `id57Verify(input, hashFn, id57String, length)`
- `id57VerifyDefault(input, id57String)`
- `id57IsValid(string)`
- `id57IsCanonical(string)`
