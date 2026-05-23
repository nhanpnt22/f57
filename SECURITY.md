# Security Policy

## Supported Versions

Currently, the `v0.1.0` branch is the only officially supported and maintained version of the F57 specification family (with B57 as the base layer).

| Version | Supported          |
| ------- | ------------------ |
| v0.1.0  | :white_check_mark: |
| < v0.1.0| :x:                |

## Cryptographic Considerations

The F57 system focuses on encoding efficiency, deterministic identifier generation, and secure composition. Note the following security parameters:

### Hashing Standard
The primary hashing algorithm required for B57 (`H57`, `ID57`) is **BLAKE3**. While users can inject custom hashers via the API, deterministic cross-language parity guarantees only apply when utilizing the BLAKE3 XOF functions. BLAKE3 is highly secure against collision, preimage, and second-preimage attacks.

For S57 keyed surfaces, parity and security assumptions require domain-separated BLAKE3 derivation and keyed hashing as defined by the S57 specification and implementation reports.

### Entropy & Collision Domain
* **ID57 (Default):** Utilizes **128 bits** of entropy (22 Base57 characters). This is cryptographically secure for globally unique identifiers and primary keys, comparable to standard UUIDv4/v7.
* **ID57-SHORT:** Utilizes **47 bits** of entropy (8 Base57 characters). **Warning:** This is designed for human-readable localized contexts (e.g., short URLs, receipt numbers, local shard references). It is **not** cryptographically secure against brute-force collision attacks globally. Do not use `ID57-SHORT` for highly sensitive global session keys or un-namespaced database identities.

## S57 Security Considerations

### Key Material and Separation
S57 derives separate keys for hashing, identifiers, and encryption domains. Reusing raw application secrets directly across domains is discouraged; use the S57 constructor inputs and domain-separated derivation flow.

### Authenticated Encryption
S57 envelope encryption uses AES-256-GCM with authenticated decryption semantics. Treat decrypt failures as security-significant events and do not attempt permissive fallbacks.

### AAD Binding
When using Additional Authenticated Data (AAD), the exact byte sequence must match during decrypt. Persist and normalize AAD consistently across services to avoid false-negative decrypt failures.

### Nonce Handling
S57 implementations generate nonces internally for envelope encryption. Do not override nonce generation with deterministic or reused values.

## Reporting a Vulnerability

If you discover a vulnerability in the hashing pipeline, bitwise truncation algorithms, or language-specific string canonicalization (e.g., a buffer overflow vulnerability during decode), **do not open a public GitHub issue**.

Please report security issues directly to the primary maintainers via email or the standard security advisory private submission process on GitHub.
A member of the team will acknowledge receipt of the vulnerability within 48 hours.
