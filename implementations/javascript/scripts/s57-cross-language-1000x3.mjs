import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  encode,
  decode,
  isValid,
  isCanonical,
  encodedLength,
  decodedLength,
  h57Hash,
  h57Verify,
  H57Length,
  id57Generate,
  id57GenerateDefault,
  id57Verify,
  id57VerifyDefault,
  ID57Length,
  i57Encode,
  i57Decode,
  i57Hash,
  i57Id,
  i57IsValid,
  i57IsCanonical,
  i57ValidateIdentifier,
  i57ValidateEntropy,
  r57IsValid,
  r57IsCanonical,
  S57
} from '../index.js';

const DATASET_SIZE = 1000;
const RUNS = 3;

const FIELD_ORDER = [
  'index',
  'inputHex',
  'b57Encode',
  'b57DecodeHex',
  'b57IsValid',
  'b57IsCanonical',
  'b57EncodedLength',
  'b57DecodedLength',
  'h57Blake3Len128',
  'h57Sha256Len128',
  'h57Sha512Len128',
  'h57Blake3Auto',
  'id57Default',
  'id57Fixed9',
  'id57Len64Blake3',
  'id57FixedDefault',
  'id57Fixed4',
  'i57Encode',
  'i57DecodeHex',
  'i57HashBlake3Len128',
  'i57IdDefault',
  'i57IsValid',
  'i57IsCanonical',
  'i57ValidateIdentifier',
  'i57ValidateEntropy',
  'r57IsValidOnI57Id',
  'r57IsCanonicalOnI57Id',
  'id57VerifyDefault',
  'id57FixedVerifyDefault',
  'h57VerifyBlake3Len128',
  'i57ValidateIdentifierId'
];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const jsDir = path.resolve(__dirname, '..');
const implementationsDir = path.resolve(jsDir, '..');
const goDir = path.resolve(implementationsDir, 'go');
const rustDir = path.resolve(implementationsDir, 'rust');
const dartDir = path.resolve(implementationsDir, 'dart');
const pythonDir = path.resolve(implementationsDir, 'python');
const outDir = path.resolve(implementationsDir, 'cross_language_records');

function sha256Hex(text) {
  return createHash('sha256').update(text).digest('hex');
}

function hex(bytes) {
  return Buffer.from(bytes).toString('hex');
}

function datasetAt(index) {
  const seed = createHash('sha256').update(`cross-language-dataset-${index}`).digest();
  let length = index % 65;
  if (index % 10 === 0) {
    length = 0;
  }

  const data = new Uint8Array(length);
  for (let j = 0; j < length; j += 1) {
    data[j] = seed[(j + index) % seed.length] ^ ((j * 31 + index) & 0xff);
  }
  if (length > 0 && index % 7 === 0) data[0] = 0;
  if (length > 1 && index % 11 === 0) data[1] = 0;
  return data;
}

function canonicalizeRecord(record) {
  const ordered = {};
  for (const key of FIELD_ORDER) {
    ordered[key] = record[key];
  }
  return JSON.stringify(ordered);
}

function buildJSCoreRecord(index) {
  const input = datasetAt(index);
  const b57Encode = encode(input);
  const b57DecodeHex = hex(decode(b57Encode));
  const h57Blake3Len128 = h57Hash(input, H57Length.LEN_128);
  const h57Sha256Len128 = h57Hash(input, H57Length.LEN_128);
  const h57Sha512Len128 = h57Hash(input, H57Length.LEN_128);
  const h57Blake3Auto = h57Hash(input, H57Length.HASH_AUTO);
  const id57Default = id57GenerateDefault(input);
  // Fixed-width (non-security) and bit-length identifiers now unified
  // under id57Generate via the sign of length_enum (ID57-SHORT merged
  // into ID57 core, spec/id57-core-api.txt section 10).
  const id57Fixed9 = id57Generate(input, ID57Length.FIXED_9);
  const id57Len64Blake3 = id57Generate(input, ID57Length.LEN_64);
  const id57FixedDefault = id57Generate(input, ID57Length.FIXED_8);
  const id57Fixed4 = id57Generate(input, ID57Length.FIXED_4);
  const i57EncodeValue = i57Encode(input);
  const i57DecodeHex = hex(i57Decode(i57EncodeValue));
  const i57HashBlake3Len128 = i57Hash(input, H57Length.LEN_128);
  const i57IdDefault = i57Id(input, ID57Length.DEFAULT);

  return {
    index,
    inputHex: hex(input),
    b57Encode,
    b57DecodeHex,
    b57IsValid: isValid(b57Encode),
    b57IsCanonical: isCanonical(b57Encode),
    b57EncodedLength: encodedLength(input.length),
    b57DecodedLength: decodedLength(b57Encode.length),
    h57Blake3Len128,
    h57Sha256Len128,
    h57Sha512Len128,
    h57Blake3Auto,
    id57Default,
    id57Fixed9,
    id57Len64Blake3,
    id57FixedDefault,
    id57Fixed4,
    i57Encode: i57EncodeValue,
    i57DecodeHex,
    i57HashBlake3Len128,
    i57IdDefault,
    i57IsValid: i57IsValid(i57EncodeValue),
    i57IsCanonical: i57IsCanonical(i57EncodeValue),
    i57ValidateIdentifier: i57ValidateIdentifier(i57IdDefault),
    i57ValidateEntropy: i57ValidateEntropy(i57IdDefault),
    r57IsValidOnI57Id: r57IsValid(i57IdDefault),
    r57IsCanonicalOnI57Id: r57IsCanonical(i57IdDefault),
    id57VerifyDefault: id57VerifyDefault(input, id57Default),
    id57FixedVerifyDefault: id57Verify(input, id57FixedDefault, ID57Length.FIXED_8),
    h57VerifyBlake3Len128: h57Verify(input, h57Blake3Len128, H57Length.LEN_128),
    i57ValidateIdentifierId: i57ValidateIdentifier(i57IdDefault)
  };
}

function runJSHashes() {
  const hashes = [];
  for (let i = 0; i < DATASET_SIZE; i += 1) {
    hashes.push(sha256Hex(canonicalizeRecord(buildJSCoreRecord(i))));
  }
  return hashes;
}

function runGoHashes() {
  const out = execFileSync('go', ['run', './cmd/crosslang'], {
    cwd: goDir,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 512
  });
  const records = JSON.parse(out);
  return records.slice(0, DATASET_SIZE).map((r) => sha256Hex(canonicalizeRecord(r)));
}

function runRustExport() {
  execFileSync('cargo', ['run', '--bin', 'crosslang_records'], {
    cwd: rustDir,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 512
  });
  const runs = [];
  for (let i = 1; i <= RUNS; i += 1) {
    const p = path.join(outDir, `rust-run-${i}.json`);
    const parsed = JSON.parse(readFileSync(p, 'utf8'));
    runs.push(parsed.hashes.slice(0, DATASET_SIZE));
  }
  return runs;
}

function runDartExport() {
  execFileSync('dart', ['run', 'bin/crosslang_records.dart'], {
    cwd: dartDir,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 512
  });
  const runs = [];
  for (let i = 1; i <= RUNS; i += 1) {
    const p = path.join(outDir, `dart-run-${i}.json`);
    const records = JSON.parse(readFileSync(p, 'utf8'));
    const hashes = records.slice(0, DATASET_SIZE).map((rec) => {
      const mapped = {
        index: rec.index,
        inputHex: rec.input_hex,
        b57Encode: rec.b57_encode,
        b57DecodeHex: rec.b57_decode_hex,
        b57IsValid: rec.b57_is_valid,
        b57IsCanonical: rec.b57_is_canonical,
        b57EncodedLength: rec.b57_encoded_length,
        b57DecodedLength: rec.b57_decoded_length,
        h57Blake3Len128: rec.h57_blake3_len128,
        h57Sha256Len128: rec.h57_sha256_len128,
        h57Sha512Len128: rec.h57_sha512_len128,
        h57Blake3Auto: rec.h57_blake3_auto,
        id57Default: rec.id57_default,
        // NOTE: Dart's own crosslang exporter has not necessarily been
        // migrated to the FIXED_k / sign-based length model yet (out of
        // scope for the JavaScript-only change here); these keys are
        // kept aligned with FIELD_ORDER so canonicalizeRecord stays
        // well-formed, even though the underlying Dart fields may still
        // reflect the retired ID57-SHORT naming until Dart is updated.
        id57Fixed9: rec.id57_fixed9 ?? rec.id57_len47_sha256,
        id57Len64Blake3: rec.id57_len64_blake3 ?? rec.id57_len70_blake3,
        id57FixedDefault: rec.id57_fixed_default ?? rec.id57_short_default,
        id57Fixed4: rec.id57_fixed4 ?? rec.id57_short_len23,
        i57Encode: rec.i57_encode,
        i57DecodeHex: rec.i57_decode_hex,
        i57HashBlake3Len128: rec.i57_hash_blake3_len128,
        i57IdDefault: rec.i57_id_default,
        i57IsValid: rec.i57_is_valid,
        i57IsCanonical: rec.i57_is_canonical,
        i57ValidateIdentifier: rec.i57_validate_identifier,
        i57ValidateEntropy: rec.i57_validate_entropy,
        r57IsValidOnI57Id: rec.r57_is_valid_on_i57_id,
        r57IsCanonicalOnI57Id: rec.r57_is_canonical_on_i57_id,
        id57VerifyDefault: rec.id57_verify_default,
        id57FixedVerifyDefault: rec.id57_fixed_verify_default ?? rec.id57_short_verify_default,
        h57VerifyBlake3Len128: rec.h57_verify_blake3_len128,
        i57ValidateIdentifierId: rec.i57_validate_identifier_id
      };
      return sha256Hex(canonicalizeRecord(mapped));
    });
    runs.push(hashes);
  }
  return runs;
}

function runPythonHashes() {
  const code = String.raw`
import json
from hashlib import sha256
from b57 import (
    encode, decode, h57_hash, id57_generate_default, id57_short_generate_default,
    id57_generate, id57_short_generate, id57_verify_default, id57_short_verify_default,
    i57_encode, i57_decode, i57_hash, i57_id, i57_is_valid, i57_is_canonical,
    i57_validate_identifier, i57_validate_entropy,
    HashFunction, H57Length, ID57Length, ID57ShortLength, r57_is_valid, r57_is_canonical,
    is_valid, is_canonical, encoded_length, decoded_length, h57_verify
)

FIELD_ORDER = ${JSON.stringify(FIELD_ORDER)}
DATASET_SIZE = ${DATASET_SIZE}

def dataset_at(index):
    seed = sha256(f"cross-language-dataset-{index}".encode()).digest()
    length = index % 65
    if index % 10 == 0:
        length = 0
    data = bytearray(length)
    for j in range(length):
        data[j] = seed[(j + index) % len(seed)] ^ ((j * 31 + index) % 256)
    if length > 0 and index % 7 == 0:
        data[0] = 0
    if length > 1 and index % 11 == 0:
        data[1] = 0
    return bytes(data)

def canonicalize(rec):
    ordered = {k: rec.get(k) for k in FIELD_ORDER}
    return json.dumps(ordered, separators=(",", ":"), sort_keys=False)

hashes = []
for i in range(DATASET_SIZE):
    input_data = dataset_at(i)
    b57_enc = encode(input_data)
    rec = {
        'index': i,
        'inputHex': input_data.hex(),
        'b57Encode': b57_enc,
        'b57DecodeHex': decode(b57_enc).hex(),
        'b57IsValid': is_valid(b57_enc),
        'b57IsCanonical': is_canonical(b57_enc),
        'b57EncodedLength': encoded_length(len(input_data)),
        'b57DecodedLength': decoded_length(len(b57_enc)),
        'h57Blake3Len128': h57_hash(input_data, HashFunction.BLAKE3, H57Length.LEN128),
        'h57Sha256Len128': h57_hash(input_data, HashFunction.BLAKE3, H57Length.LEN128),
        'h57Sha512Len128': h57_hash(input_data, HashFunction.BLAKE3, H57Length.LEN128),
        'h57Blake3Auto': h57_hash(input_data, HashFunction.BLAKE3, H57Length.HASH_AUTO),
        'id57Default': id57_generate_default(input_data),
        'id57Len47Sha256': id57_generate(input_data, HashFunction.BLAKE3, ID57Length.LEN47),
        'id57Len70Blake3': id57_generate(input_data, HashFunction.BLAKE3, ID57Length.LEN70),
        'id57ShortDefault': id57_short_generate_default(input_data),
        'id57ShortLen23': id57_short_generate(input_data, HashFunction.BLAKE3, ID57ShortLength.LEN23),
        'i57Encode': i57_encode(input_data),
        'i57DecodeHex': i57_decode(i57_encode(input_data)).hex(),
        'i57HashBlake3Len128': i57_hash(input_data, HashFunction.BLAKE3, H57Length.LEN128),
        'i57IdDefault': i57_id(input_data, HashFunction.BLAKE3, ID57Length.DEFAULT),
        'i57IsValid': i57_is_valid(i57_encode(input_data)),
        'i57IsCanonical': i57_is_canonical(i57_encode(input_data)),
        'i57ValidateIdentifier': i57_validate_identifier(i57_id(input_data, HashFunction.BLAKE3, ID57Length.DEFAULT)),
        'i57ValidateEntropy': i57_validate_entropy(i57_id(input_data, HashFunction.BLAKE3, ID57Length.DEFAULT)),
        'r57IsValidOnI57Id': r57_is_valid(i57_id(input_data, HashFunction.BLAKE3, ID57Length.DEFAULT)),
        'r57IsCanonicalOnI57Id': r57_is_canonical(i57_id(input_data, HashFunction.BLAKE3, ID57Length.DEFAULT)),
        'id57VerifyDefault': id57_verify_default(input_data, id57_generate_default(input_data)),
        'id57ShortVerifyDefault': id57_short_verify_default(input_data, id57_short_generate_default(input_data)),
        'h57VerifyBlake3Len128': h57_verify(input_data, h57_hash(input_data, HashFunction.BLAKE3, H57Length.LEN128), HashFunction.BLAKE3, H57Length.LEN128),
        'i57ValidateIdentifierId': i57_validate_identifier(i57_id(input_data, HashFunction.BLAKE3, ID57Length.DEFAULT)),
    }
    hashes.append(sha256(canonicalize(rec).encode()).hexdigest())

print(json.dumps({'hashes': hashes}))
`;

  const runs = [];
  for (let i = 0; i < RUNS; i += 1) {
    const out = execFileSync('python3', ['-c', code], {
      cwd: pythonDir,
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 512
    });
    runs.push(JSON.parse(out).hashes);
  }
  return runs;
}

function compare(a, b) {
  let mismatchCount = 0;
  const mismatchIndexes = [];
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i += 1) {
    if (a[i] !== b[i]) {
      mismatchCount += 1;
      if (mismatchIndexes.length < 20) mismatchIndexes.push(i);
    }
  }
  mismatchCount += Math.abs(a.length - b.length);
  return { mismatchCount, mismatchIndexes };
}

function runS57Determinism() {
  const s57 = new S57({
    server_secret_key: new TextEncoder().encode('S57_SERVER_SECRET_KEY_MUST_BE_LONG_1234567890'),
    environment_salt: new TextEncoder().encode('prod-v1'),
    key_id: 9
  });
  const hashes = [];
  for (let i = 0; i < DATASET_SIZE; i += 1) {
    const input = datasetAt(i);
    const obj = {
      index: i,
      s57Hash128: s57.hash(input, H57Length.LEN_128),
      s57Hash256: s57.hash(input, H57Length.LEN_256),
      s57Id128: s57.id(input, ID57Length.DEFAULT),
      s57Id256: s57.id(input, ID57Length.LEN_256),
      s57Derived: s57.random_derived(new TextEncoder().encode('master-secret'), input)
    };
    hashes.push(sha256Hex(JSON.stringify(obj)));
  }
  return hashes;
}

function main() {
  mkdirSync(outDir, { recursive: true });

  const summary = {
    date: new Date().toISOString(),
    datasetSize: DATASET_SIZE,
    runsPerLanguage: RUNS,
    languages: ['go', 'javascript', 'rust', 'python', 'dart'],
    s57Language: ['javascript (Node.js + TypeScript-compatible exports)'],
    runs: []
  };

  const rustRuns = runRustExport();
  const dartRuns = runDartExport();
  const pythonRuns = runPythonHashes();

  let jsBase;
  let goBase;
  let rustBase;
  let pythonBase;
  let dartBase;
  let s57Base;

  for (let run = 1; run <= RUNS; run += 1) {
    const js = runJSHashes();
    const go = runGoHashes();
    const rust = rustRuns[run - 1];
    const python = pythonRuns[run - 1];
    const dart = dartRuns[run - 1];
    const s57 = runS57Determinism();

    writeFileSync(path.join(outDir, `s57-js-run-${run}.json`), JSON.stringify({ datasetSize: DATASET_SIZE, hashes: s57 }, null, 2));

    const runResult = {
      run,
      determinism: {
        js: jsBase ? compare(jsBase, js) : { mismatchCount: 0, mismatchIndexes: [] },
        go: goBase ? compare(goBase, go) : { mismatchCount: 0, mismatchIndexes: [] },
        rust: rustBase ? compare(rustBase, rust) : { mismatchCount: 0, mismatchIndexes: [] },
        python: pythonBase ? compare(pythonBase, python) : { mismatchCount: 0, mismatchIndexes: [] },
        dart: dartBase ? compare(dartBase, dart) : { mismatchCount: 0, mismatchIndexes: [] },
        s57Js: s57Base ? compare(s57Base, s57) : { mismatchCount: 0, mismatchIndexes: [] }
      },
      crossLanguageCoreVsGo: {
        javascript: compare(go, js),
        rust: compare(go, rust),
        python: compare(go, python),
        dart: compare(go, dart)
      }
    };

    if (!jsBase) jsBase = js;
    if (!goBase) goBase = go;
    if (!rustBase) rustBase = rust;
    if (!pythonBase) pythonBase = python;
    if (!dartBase) dartBase = dart;
    if (!s57Base) s57Base = s57;

    summary.runs.push(runResult);
  }

  const jsonPath = path.join(outDir, 's57-cross-language-1000x3-summary.json');
  const mdPath = path.join(outDir, 's57-cross-language-1000x3-summary.md');
  writeFileSync(jsonPath, JSON.stringify(summary, null, 2));

  let md = '';
  md += '# S57 + Core Cross-Language 1000x3 Summary\n\n';
  md += `Date: ${summary.date}\n`;
  md += `Dataset size: ${DATASET_SIZE}\n`;
  md += `Runs per language: ${RUNS}\n\n`;
  md += 'S57 implementation scope:\n';
  md += '- JavaScript implementation complete (Node.js + TypeScript-compatible exports)\n';
  md += '- Other languages currently validated on core B57/H57/ID57/R57/I57 deterministic surface\n\n';

  for (const run of summary.runs) {
    md += `Run ${run.run}:\n`;
    md += `- Determinism mismatches: js=${run.determinism.js.mismatchCount}, go=${run.determinism.go.mismatchCount}, rust=${run.determinism.rust.mismatchCount}, python=${run.determinism.python.mismatchCount}, dart=${run.determinism.dart.mismatchCount}, s57Js=${run.determinism.s57Js.mismatchCount}\n`;
    md += `- Cross vs Go: js=${run.crossLanguageCoreVsGo.javascript.mismatchCount}, rust=${run.crossLanguageCoreVsGo.rust.mismatchCount}, python=${run.crossLanguageCoreVsGo.python.mismatchCount}, dart=${run.crossLanguageCoreVsGo.dart.mismatchCount}\n`;
  }

  writeFileSync(mdPath, md);
  console.log(`Wrote ${jsonPath}`);
  console.log(`Wrote ${mdPath}`);
}

main();
