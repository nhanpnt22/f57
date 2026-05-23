import { randomBytes } from 'node:crypto';
import { blake3 } from '@noble/hashes/blake3';
import { encode, isValid, isCanonical } from './b57.js';
import { newInvalidR57ModeError } from './errors.js';

let r57Counter = 0;
let sessionSecret;
let deviceSecret;
let masterSecret;

export const R57Mode = Object.freeze({
  R57_1_CSPRNG: 1,
  R57_2_HASH_ENTROPY: 2,
  R57_3_KDF_DERIVED: 3,
  R57_4_COUNTER_KDF: 4,
  R57_5_TIMESTAMP_KDF: 5,
  R57_6_HARDWARE_RNG: 6,
  R57_7_UUIDV4_COMPAT: 7,
  R57_8_HYBRID_ENTROPY: 8
});

export function r57Generate(mode) {
  const raw = generateR57Entropy(mode);
  return encodeR57128(raw);
}

function generateR57Entropy(mode) {
  switch (mode) {
    case R57Mode.R57_1_CSPRNG:
      return readEntropyBytes(16);
    case R57Mode.R57_2_HASH_ENTROPY:
      return mixEntropy128(readEntropyBytes(16));
    case R57Mode.R57_3_KDF_DERIVED:
      return generateKDFDerivedEntropy();
    case R57Mode.R57_4_COUNTER_KDF:
      return generateCounterKDFEntropy();
    case R57Mode.R57_5_TIMESTAMP_KDF:
      return generateTimestampKDFEntropy();
    case R57Mode.R57_6_HARDWARE_RNG:
      return readEntropyBytes(16);
    case R57Mode.R57_7_UUIDV4_COMPAT:
      return generateUUIDv4CompatEntropy();
    case R57Mode.R57_8_HYBRID_ENTROPY:
      return generateHybridEntropy();
    default:
      throw newInvalidR57ModeError(mode);
  }
}

function generateKDFDerivedEntropy() {
  if (!masterSecret) {
    masterSecret = readEntropyBytes(32);
  }
  const context = readEntropyBytes(16);
  return mixEntropy128(masterSecret, context);
}

function generateCounterKDFEntropy() {
  const randomComponent = readEntropyBytes(12);
  r57Counter += 1;
  const counter = new Uint8Array(4);
  const view = new DataView(counter.buffer);
  view.setUint32(0, r57Counter >>> 0, false);
  return mixEntropy128(counter, randomComponent);
}

function generateTimestampKDFEntropy() {
  if (!deviceSecret) {
    deviceSecret = readEntropyBytes(32);
  }
  const randomComponent = readEntropyBytes(12);
  const timestamp = new Uint8Array(4);
  const view = new DataView(timestamp.buffer);
  view.setUint32(0, Math.floor(Date.now() / 60000) >>> 0, false);
  return mixEntropy128(deviceSecret, timestamp, randomComponent);
}

function generateUUIDv4CompatEntropy() {
  const raw = readEntropyBytes(16);
  raw[6] = (raw[6] & 0x0f) | 0x40;
  raw[8] = (raw[8] & 0x3f) | 0x80;
  return raw;
}

function generateHybridEntropy() {
  if (!sessionSecret) {
    sessionSecret = readEntropyBytes(32);
  }
  const seed = readEntropyBytes(16);
  r57Counter += 1;

  const counter = new Uint8Array(4);
  new DataView(counter.buffer).setUint32(0, r57Counter >>> 0, false);

  const timestamp = new Uint8Array(8);
  const now = BigInt(Date.now()) * 1000000n;
  new DataView(timestamp.buffer).setBigUint64(0, now, false);

  return mixEntropy128(seed, counter, timestamp, sessionSecret);
}

function readEntropyBytes(length) {
  return new Uint8Array(randomBytes(length));
}

function mixEntropy128(...parts) {
  const totalLength = parts.reduce((sum, p) => sum + p.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of parts) {
    combined.set(part, offset);
    offset += part.length;
  }
  return blake3(combined, { dkLen: 16 });
}

function encodeR57128(raw) {
  let encoded = encode(raw);
  if (encoded.length === 22) {
    return encoded;
  }

  let derived = raw;
  while (encoded.length < 22) {
    derived = mixEntropy128(derived, new Uint8Array([0x57]));
    encoded = encode(derived);
  }
  return encoded;
}

export function r57IsValid(s) {
  if (typeof s !== 'string') {
    return false;
  }
  if (s.length !== 22) {
    return false;
  }
  return isValid(s);
}

export function r57IsCanonical(s) {
  if (typeof s !== 'string') {
    return false;
  }
  if (s.length !== 22) {
    return false;
  }
  return isCanonical(s);
}
