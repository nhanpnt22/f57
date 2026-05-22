# ID57-SHORT Go Implementation

This package implements the ID57-SHORT profile from the attached specs.

Specs used:
- [ID57-SHORT PROFILE](../../spec/ID57-SHORT%20PROFILE.txt)
- [ID57 CORE API (MINDU)](../../spec/ID57%20CORE%20API.txt)
- [B57S-v0.1.0](../../spec/B57S-v0.1.0.txt)

## API

- `ID57ShortGenerate(input []byte, length ID57ShortLength) (string, error)`
- `ID57ShortGenerateDefault(input []byte) (string, error)`
- `ID57ShortVerify(input []byte, id57String string, length ID57ShortLength) bool`
- `ID57ShortVerifyDefault(input []byte, id57String string) bool`
- `ID57ShortIsValid(id57String string) bool`
- `ID57ShortIsCanonical(id57String string) bool`

## Short Profile Lengths

Allowed short-mode enums:
- `ID57ShortLen23` (4 chars)
- `ID57ShortLen29` (5 chars)
- `ID57ShortLen32` (6 chars)
- `ID57ShortLen47` (8 chars)
- `ID57ShortLen70` (12 chars)

Default short profile:
- `ID57ShortDefault` resolves to `ID57ShortLen47`
- `ID57ShortGenerateDefault` yields compact identifiers (typically 8 chars, bounded by byte-level truncation behavior)

## Pipeline

`input -> HASH -> truncate bytes -> B57`

Rules:
- Input bytes are always hashed first.
- Truncation occurs on hash bytes before B57 encoding.
- Prefix truncation is deterministic.
- Non-profile lengths are rejected with `ErrInvalidLengthEnum`.

## Safety Notes

ID57-SHORT is collision-prone by design. It is intended for compact, human-facing IDs and MUST be used with collision handling and scoped namespaces.
