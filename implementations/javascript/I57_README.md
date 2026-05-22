# I57 Core API JavaScript Implementation

Implements the I57 Integration/Unified Interface (MINDU) providing unified access to B57, H57, R57, and ID57 functionality.

Spec reference:
- `spec/I57 CORE API.txt`

Core API:
- `i57Encode(input)`
- `i57Decode(string)`
- `i57Hash(input, length)`
- `i57Random(mode)`
- `i57Id(input, length)`
- `i57IsValid(string)`
- `i57IsCanonical(string)`
- `i57ValidateIdentifier(string)`
- `i57ValidateEntropy(string)`

Notes:
- Integration-mode validation rejects empty strings.
- `i57ValidateIdentifier` enforces canonical 22-character identifier checks.
- `i57ValidateEntropy` is heuristic-only and MUST NOT be used for security decisions.
