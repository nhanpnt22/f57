# Security Policy

## Supported Versions

Currently, the `v0.1.0` branch is the only officially supported and maintained version of the B57 specification stack.

| Version | Supported          |
| ------- | ------------------ |
| v0.1.0  | :white_check_mark: |
| < v0.1.0| :x:                |

## Cryptographic Considerations

The B57 system focuses on encoding efficiency and deterministic identifier generation. Note the following security parameters:

### Hashing Standard
The primary hashing algorithm required for B57 (`H57`, `ID57`) is **BLAKE3**. While users can inject custom hashers via the API, deterministic cross-language parity guarantees only apply when utilizing the BLAKE3 XOF functions. BLAKE3 is highly secure against collision, preimage, and second-preimage attacks.

### Entropy & Collision Domain
* **ID57 (Default):** Utilizes **128 bits** of entropy (22 Base57 characters). This is cryptographically secure for globally unique identifiers and primary keys, comparable to standard UUIDv4/v7.
* **ID57-SHORT:** Utilizes **47 bits** of entropy (8 Base57 characters). **Warning:** This is designed for human-readable localized contexts (e.g., short URLs, receipt numbers, local shard references). It is **not** cryptographically secure against brute-force collision attacks globally. Do not use `ID57-SHORT` for highly sensitive global session keys or un-namespaced database identities.

## Reporting a Vulnerability

If you discover a vulnerability in the hashing pipeline, bitwise truncation algorithms, or language-specific string canonicalization (e.g., a buffer overflow vulnerability during decode), **do not open a public GitHub issue**.

Please report security issues directly to the primary maintainers via email or the standard security advisory private submission process on GitHub.
A member of the team will acknowledge receipt of the vulnerability within 48 hours.
