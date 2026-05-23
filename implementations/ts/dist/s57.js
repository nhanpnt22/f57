import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { blake3 } from '@noble/hashes/blake3';
import { encode, decode } from './b57.js';
import { ID57Length, id57BitsByLength, resolveID57Length, maskExcessBits } from './id57.js';
import { H57Length, h57BitsByLength } from './h57.js';
import { newAuthFailureError, newInvalidLengthEnumError, newInvalidVersionError, newKeyInvalidError, newKeyUnavailableError } from './errors.js';
const S57_VERSION = 0x01;
const S57Length = Object.freeze({
    LEN_128: 128,
    LEN_256: 256,
    LEN_512: 512
});
const S57_ALLOWED_LENGTHS = [S57Length.LEN_128, S57Length.LEN_256, S57Length.LEN_512];
function toBytes(input) {
    if (input instanceof Uint8Array) {
        return input;
    }
    if (Buffer.isBuffer(input)) {
        return new Uint8Array(input);
    }
    if (input instanceof ArrayBuffer) {
        return new Uint8Array(input);
    }
    if (typeof input === 'string') {
        return new TextEncoder().encode(input);
    }
    throw new TypeError('input must be Uint8Array, Buffer, ArrayBuffer, or string');
}
function concatBytes(...parts) {
    const total = parts.reduce((sum, p) => sum + p.length, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    for (const p of parts) {
        out.set(p, offset);
        offset += p.length;
    }
    return out;
}
function deriveKey(serverSecretKey, environmentSalt, context, length = 32) {
    const secret = toBytes(serverSecretKey);
    const salt = toBytes(environmentSalt);
    const seed = concatBytes(secret, salt);
    return blake3(seed, { context, dkLen: length });
}
function validateLengthEnumForS57(lengthEnum, mappingResolver, mappingValues) {
    const resolved = mappingResolver(lengthEnum);
    const bits = mappingValues.get(resolved);
    if (!S57_ALLOWED_LENGTHS.includes(bits)) {
        throw newInvalidLengthEnumError(lengthEnum);
    }
    return { resolved, bits };
}
function truncateBits(rawBytes, bitLength) {
    const requestedBytes = Math.ceil(bitLength / 8);
    const out = new Uint8Array(requestedBytes);
    out.set(rawBytes.subarray(0, requestedBytes));
    maskExcessBits(out, bitLength);
    return out;
}
function encodeR57_128(raw) {
    let encoded = encode(raw);
    if (encoded.length === 22) {
        return encoded;
    }
    let derived = raw;
    while (encoded.length < 22) {
        derived = blake3(concatBytes(derived, Uint8Array.of(0x57)), { dkLen: 16 });
        encoded = encode(derived);
    }
    return encoded;
}
function uint32be(n) {
    const b = new Uint8Array(4);
    new DataView(b.buffer).setUint32(0, n >>> 0, false);
    return b;
}
export class S57 {
    serverSecretKey;
    environmentSalt;
    activeKeyId;
    keys;
    counter;
    constructor(config) {
        if (!config) {
            throw newKeyInvalidError();
        }
        const { server_secret_key, environment_salt, key_id = 1 } = config;
        this.serverSecretKey = toBytes(server_secret_key);
        this.environmentSalt = toBytes(environment_salt);
        this.activeKeyId = key_id & 0xff;
        if (this.serverSecretKey.length < 32 || this.environmentSalt.length === 0) {
            throw newKeyInvalidError();
        }
        this.keys = this.resolveKeys();
        this.counter = 0;
    }
    resolveKeys() {
        return {
            key_id: this.activeKeyId,
            b57_aes_256_key: deriveKey(this.serverSecretKey, this.environmentSalt, 'S57/B57_AES_256/v1', 32),
            h57_key: deriveKey(this.serverSecretKey, this.environmentSalt, 'S57/H57_KEY/v1', 32),
            id57_key: deriveKey(this.serverSecretKey, this.environmentSalt, 'S57/ID57_KEY/v1', 32)
        };
    }
    hash(data, lengthEnum = H57Length.LEN_256) {
        const input = toBytes(data);
        const { bits } = validateLengthEnumForS57(lengthEnum, (len) => {
            if (len === H57Length.HASH_AUTO) {
                return H57Length.LEN_256;
            }
            if (!h57BitsByLength.has(len)) {
                throw newInvalidLengthEnumError(len);
            }
            return len;
        }, h57BitsByLength);
        const full = blake3(input, { key: this.keys.h57_key, dkLen: 64 });
        return encode(truncateBits(full, bits));
    }
    id(data, lengthEnum = ID57Length.DEFAULT) {
        const input = toBytes(data);
        const { bits } = validateLengthEnumForS57(lengthEnum, resolveID57Length, id57BitsByLength);
        const full = blake3(input, { key: this.keys.id57_key, dkLen: 64 });
        return encode(truncateBits(full, bits));
    }
    random() {
        return encodeR57_128(new Uint8Array(randomBytes(16)));
    }
    random_time() {
        const timeComponent = uint32be(Math.floor(Date.now() / 1000));
        const randomComponent = new Uint8Array(randomBytes(12));
        const mixed = blake3(concatBytes(timeComponent, randomComponent), { dkLen: 16 });
        return encodeR57_128(mixed);
    }
    random_counter(counter) {
        const c = uint32be(counter >>> 0);
        const randomComponent = new Uint8Array(randomBytes(12));
        const mixed = blake3(concatBytes(c, randomComponent), { dkLen: 16 });
        return encodeR57_128(mixed);
    }
    random_session(session_secret) {
        const session = toBytes(session_secret);
        const nonce = new Uint8Array(randomBytes(16));
        const mixed = blake3(nonce, { key: blake3(session, { dkLen: 32 }), dkLen: 16 });
        return encodeR57_128(mixed);
    }
    random_device(device_secret) {
        const device = toBytes(device_secret);
        const nonce = new Uint8Array(randomBytes(16));
        const mixed = blake3(nonce, { key: blake3(device, { dkLen: 32 }), dkLen: 16 });
        return encodeR57_128(mixed);
    }
    random_derived(master_secret, unique_input) {
        const ms = toBytes(master_secret);
        const unique = toBytes(unique_input);
        const key = blake3(ms, { context: 'S57/R57_DERIVED/v1', dkLen: 32 });
        const mixed = blake3(unique, { key, dkLen: 16 });
        return encodeR57_128(mixed);
    }
    random_hardened() {
        const entropy = new Uint8Array(randomBytes(16));
        const hardened = blake3(entropy, { dkLen: 16 });
        return encodeR57_128(hardened);
    }
    random_hybrid(...sources) {
        if (sources.length === 0) {
            throw newKeyInvalidError();
        }
        const combined = concatBytes(...sources.map((s) => toBytes(s)));
        const mixed = blake3(combined, { dkLen: 16 });
        return encodeR57_128(mixed);
    }
    encrypt(plaintext, aad = new Uint8Array(0)) {
        const key = this.keys.b57_aes_256_key;
        if (key.length !== 32) {
            throw newKeyInvalidError();
        }
        const nonce = randomBytes(12);
        const cipher = createCipheriv('aes-256-gcm', Buffer.from(key), nonce);
        const aadBytes = Buffer.from(toBytes(aad));
        if (aadBytes.length > 0) {
            cipher.setAAD(aadBytes);
        }
        const plaintextBytes = Buffer.from(toBytes(plaintext));
        const ciphertext = Buffer.concat([cipher.update(plaintextBytes), cipher.final()]);
        const tag = cipher.getAuthTag();
        const envelope = Buffer.concat([
            Buffer.from([S57_VERSION, this.activeKeyId]),
            nonce,
            ciphertext,
            tag
        ]);
        return encode(envelope);
    }
    decrypt(b57String, aad = new Uint8Array(0), expectedKeyId = undefined) {
        const envelope = decode(b57String);
        if (envelope.length < 30) {
            throw newInvalidVersionError(-1);
        }
        const version = envelope[0];
        if (version !== S57_VERSION) {
            throw newInvalidVersionError(version);
        }
        const keyId = envelope[1];
        if (expectedKeyId !== undefined && keyId !== (expectedKeyId & 0xff)) {
            throw newKeyUnavailableError(keyId);
        }
        if (keyId !== this.activeKeyId) {
            throw newKeyUnavailableError(keyId);
        }
        const key = this.keys.b57_aes_256_key;
        if (!key || key.length !== 32) {
            throw newKeyUnavailableError(keyId);
        }
        const nonce = Buffer.from(envelope.slice(2, 14));
        const tag = Buffer.from(envelope.slice(envelope.length - 16));
        const ciphertext = Buffer.from(envelope.slice(14, envelope.length - 16));
        try {
            const decipher = createDecipheriv('aes-256-gcm', Buffer.from(key), nonce);
            const aadBytes = Buffer.from(toBytes(aad));
            if (aadBytes.length > 0) {
                decipher.setAAD(aadBytes);
            }
            decipher.setAuthTag(tag);
            const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
            return new Uint8Array(plaintext);
        }
        catch {
            throw newAuthFailureError();
        }
    }
}
export { S57Length, S57_VERSION };
//# sourceMappingURL=s57.js.map