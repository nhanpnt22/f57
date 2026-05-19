# Cross-Language Parity Audit: Go vs JavaScript

Date: 2026-05-19
Scope: B57, H57, ID57, ID57-SHORT, R57, I57

## API Equivalence Matrix

### B57 Core
| Go API | JavaScript API | Status | Notes |
|---|---|---|---|
| `b57.Encode(data []byte) string` | `encode(input)` | Parity | JS accepts `Uint8Array`, `Buffer`, `ArrayBuffer`. |
| `b57.Decode(s string) ([]byte, error)` | `decode(s)` | Parity | JS throws `B57Error`. Go returns standard `error`. |
| `b57.IsValid(s string) bool` | `isValid(s)` | Parity | |
| `b57.IsCanonical(s string) bool` | `isCanonical(s)` | Parity | |
| `b57.EncodedLength(byteLen int) int` | `encodedLength(byteLength)` | Parity | Mathematical estimation helper. |
| `b57.DecodedLength(charLen int) int` | `decodedLength(charLength)` | Parity | Mathematical estimation helper. |

### H57 Profile
| Go API | JavaScript API | Status | Notes |
|---|---|---|---|
| `H57Hash(input, hashFn, length)` | `h57Hash(input, hashFn, length)` | Parity | Defaults to BLAKE3 if `hashFn` omitted in JS natively; in Go strictly typed. |
| `H57Verify(input, h57, hashFn, length)`| `h57Verify(input, h57, hashFn, length)`| Parity | Returns boolean. |
| `H57IsValid(s string) bool` | `h57IsValid(s)` | Parity | |
| `H57IsCanonical(s string) bool` | `h57IsCanonical(s)` | Parity | |

### ID57 Profile
| Go API | JavaScript API | Status | Notes |
|---|---|---|---|
| `ID57Generate(input, hashFn, length)` | `id57Generate(input, hashFn, length)` | Parity | |
| `ID57GenerateDefault(input []byte)` | `id57GenerateDefault(input)` | Parity | Resolves to 128-bit (22 characters). |
| `ID57Verify(input, hashFn, id, length)`| `id57Verify(input, hashFn, id, length)`| Parity | |
| `ID57VerifyDefault(input, id)`| `id57VerifyDefault(input, id)`| Parity | |
| `ID57IsValid(s string) bool` | `id57IsValid(s)` | Parity | |
| `ID57IsCanonical(s string) bool` | `id57IsCanonical(s)` | Parity | |

### ID57-SHORT Profile
| Go API | JavaScript API | Status | Notes |
|---|---|---|---|
| `ID57ShortGenerate(...)` | `id57ShortGenerate(...)` | Parity | Constrained length enums only. |
| `ID57ShortGenerateDefault(input)` | `id57ShortGenerateDefault(input)` | Parity | Resolves to 47-bit (typically 8 characters). |
| `ID57ShortVerify(...)` | `id57ShortVerify(...)` | Parity | |
| `ID57ShortVerifyDefault(...)` | `id57ShortVerifyDefault(...)` | Parity | |
| `ID57ShortIsValid(s)` | `id57ShortIsValid(s)` | Parity | |
| `ID57ShortIsCanonical(s)` | `id57ShortIsCanonical(s)` | Parity | |

### R57 CORE API Profile
| Go API | JavaScript API | Status | Notes |
|---|---|---|---|
| `R57Generate(mode)` | `r57Generate(mode)` | Parity | Modes 1..8 implemented in both languages; deterministic cross-language parity excludes random generators by design. |
| `R57IsValid(s string) bool` | `r57IsValid(s)` | Parity | |
| `R57IsCanonical(s string) bool` | `r57IsCanonical(s)` | Parity | |

### I57 CORE API Profile
| Go API | JavaScript API | Status | Notes |
|---|---|---|---|
| `I57Encode(input)` | `i57Encode(input)` | Parity | |
| `I57Decode(s)` | `i57Decode(s)` | Parity | |
| `I57Hash(input, hashFn, length)` | `i57Hash(input, hashFn, length)` | Parity | |
| `I57Random(mode)` | `i57Random(mode)` | Parity | |
| `I57Id(input, hashFn, length)` | `i57Id(input, hashFn, length)` | Parity | |
| `I57IsValid(s)` | `i57IsValid(s)` | Parity | |
| `I57IsCanonical(s)` | `i57IsCanonical(s)` | Parity | |
| `I57ValidateIdentifier(s)` | `i57ValidateIdentifier(s)` | Parity | |
| `I57ValidateEntropy(s)` | `i57ValidateEntropy(s)` | Parity | Heuristic check; not for security decisions. |

## Deterministic E2E Evidence

Cross-language deterministic parity was executed with generated records:
- Dataset size: 10,000
- Repetitions: 3 runs per language
- JS run-to-run mismatches: 0
- Go run-to-run mismatches: 0
- Go vs JS mismatches: 0

Artifacts:
- `implementations/cross_language_records/summary.json`
- `implementations/cross_language_records/summary.md`


## Semantic Parity Assessment

1. **Deterministic Truncation:**  
   Both languages natively apply prefix byte-level truncation immediately after computing the cryptographic hash, before executing the B57 canonical encoding. They correctly calculate exact excess bits within the final active byte and apply a bitwise mask (e.g., `0xFF << excessBits` ensuring identical behavior).

2. **Hash Execution (BLAKE3 specifically):**
   Both implementations exploit BLAKE3's XOF property when extending hashes beyond 64 bytes. Node.js natively supports XOF natively via the noble BLAKE3 port equivalent to the Go implementation.

3. **Data Type Handling:** 
   * **Go:** Assumes `[]byte` explicitly. 
   * **JS:** Relies on a coercion wrapper (`toBytes`) enabling generic Node buffer inputs seamlessly while converting them to underlying exact `Uint8Array` properties internally for alignment with BigInt math routines.

4. **Error Modeling:**
   Both languages expose identical semantic error constants (enumerations) across exceptions for deterministic rejection states: `INVALID_CHAR`, `NON_CANONICAL`, `INVALID_LENGTH_ENUM`, `ENTROPY_EXCEEDED`, and `INVALID_HASH_FUNCTION`.

## Conclusion
For deterministic surfaces, JavaScript and Go are fully aligned in the current 10,000-dataset x 3-run cross-language audit. Random-generator APIs (`R57Generate`, `I57Random`) are intentionally excluded from same-output parity assertions because they are nondeterministic.
