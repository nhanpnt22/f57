# S57 JavaScript / TypeScript (Node.js) Implementation

This module implements S57 Security 57 as a secure composition layer over
B57/H57/ID57/R57 surfaces.

Node.js support:
- Node.js 20+
- Uses native `node:crypto` for AES-256-GCM and CSPRNG

TypeScript support:
- ESM exports are TypeScript-friendly and can be imported directly
  from TS projects with NodeNext/ESM module resolution.

## API

- `new S57({ server_secret_key, environment_salt, key_id? })`
- `resolveKeys()`
- `hash(data, lengthEnum?)`
- `id(data, lengthEnum?)`
- `random()`
- `random_time()`
- `random_counter(counter)`
- `random_session(session_secret)`
- `random_device(device_secret)`
- `random_derived(master_secret, unique_input)`
- `random_hardened()`
- `random_hybrid(...sources)`
- `encrypt(plaintext, aad?)`
- `decrypt(b57String, aad?, expectedKeyId?)`

## Security Notes

- Key derivation uses BLAKE3 domain-separated contexts.
- Envelope format for encryption:
  - `version (1 byte)`
  - `key_id (1 byte)`
  - `nonce (12 bytes)`
  - `ciphertext (N bytes)`
  - `tag (16 bytes)`
- Decryption fails closed on version/key/authentication errors.
