import { newInvalidCharError, newNonCanonicalError } from './errors.js';
export const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz123456789';
export const BASE = 57n;
const alphaIndex = new Int16Array(256);
alphaIndex.fill(-1);
for (let i = 0; i < ALPHABET.length; i += 1) {
    alphaIndex[ALPHABET.charCodeAt(i)] = i;
}
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
    throw new TypeError('input must be Uint8Array, Buffer, or ArrayBuffer');
}
function bytesToBigInt(bytes) {
    let value = 0n;
    for (const b of bytes) {
        value = (value << 8n) + BigInt(b);
    }
    return value;
}
function bigIntToBytes(value) {
    if (value === 0n) {
        return new Uint8Array(0);
    }
    const out = [];
    let cur = value;
    while (cur > 0n) {
        out.push(Number(cur & 0xffn));
        cur >>= 8n;
    }
    out.reverse();
    return Uint8Array.from(out);
}
export function encode(input) {
    const data = toBytes(input);
    if (data.length === 0) {
        return '';
    }
    let leadingZeros = 0;
    while (leadingZeros < data.length && data[leadingZeros] === 0) {
        leadingZeros += 1;
    }
    if (leadingZeros === data.length) {
        return ALPHABET[0].repeat(data.length);
    }
    let num = bytesToBigInt(data.subarray(leadingZeros));
    const chars = [];
    while (num > 0n) {
        const rem = Number(num % BASE);
        num /= BASE;
        chars.push(ALPHABET[rem]);
    }
    chars.reverse();
    return ALPHABET[0].repeat(leadingZeros) + chars.join('');
}
function validateCharacters(s) {
    for (let i = 0; i < s.length; i += 1) {
        const c = s.charCodeAt(i);
        if (c > 255 || alphaIndex[c] < 0) {
            throw newInvalidCharError(i, c & 0xff);
        }
    }
}
function verifyCanonical(original, decodedBytes) {
    if (encode(decodedBytes) !== original) {
        throw newNonCanonicalError();
    }
}
export function decode(s) {
    if (s.length === 0) {
        return new Uint8Array(0);
    }
    validateCharacters(s);
    let leadingZeros = 0;
    while (leadingZeros < s.length && alphaIndex[s.charCodeAt(leadingZeros)] === 0) {
        leadingZeros += 1;
    }
    if (leadingZeros === s.length) {
        const result = new Uint8Array(s.length);
        verifyCanonical(s, result);
        return result;
    }
    let num = 0n;
    for (let i = leadingZeros; i < s.length; i += 1) {
        num = num * BASE + BigInt(alphaIndex[s.charCodeAt(i)]);
    }
    const numBytes = bigIntToBytes(num);
    const result = new Uint8Array(leadingZeros + numBytes.length);
    result.set(numBytes, leadingZeros);
    verifyCanonical(s, result);
    return result;
}
export function isValid(s) {
    if (s.length === 0) {
        return true;
    }
    for (let i = 0; i < s.length; i += 1) {
        const c = s.charCodeAt(i);
        if (c > 255 || alphaIndex[c] < 0) {
            return false;
        }
    }
    return true;
}
export function isCanonical(s) {
    if (s.length === 0) {
        return true;
    }
    if (!isValid(s)) {
        return false;
    }
    try {
        const decoded = decode(s);
        return encode(decoded) === s;
    }
    catch {
        return false;
    }
}
export function encodedLength(byteLength) {
    if (byteLength <= 0) {
        return 0;
    }
    return Math.ceil((byteLength * 8) / Math.log2(57));
}
export function decodedLength(charLength) {
    if (charLength <= 0) {
        return 0;
    }
    return Math.floor((charLength * Math.log2(57)) / 8);
}
//# sourceMappingURL=b57.js.map