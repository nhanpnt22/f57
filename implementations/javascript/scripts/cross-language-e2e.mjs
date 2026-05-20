import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
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
  id57VerifyDefault,
  ID57Length,
  id57ShortGenerate,
  id57ShortGenerateDefault,
  id57ShortVerifyDefault,
  ID57ShortLength,
  i57Encode,
  i57Decode,
  i57Hash,
  i57Id,
  i57IsValid,
  i57IsCanonical,
  i57ValidateIdentifier,
  i57ValidateEntropy,
  r57IsValid,
  r57IsCanonical
} from '../index.js';

const DATASET_SIZE = 10000;
const RUNS = 3;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const jsDir = path.resolve(__dirname, '..');
const implementationsDir = path.resolve(jsDir, '..');
const goDir = path.resolve(implementationsDir, 'go');
const outDir = path.resolve(implementationsDir, 'cross_language_records');

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
  'id57Len47Sha256',
  'id57Len70Blake3',
  'id57ShortDefault',
  'id57ShortLen23',
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
  'id57ShortVerifyDefault',
  'h57VerifyBlake3Len128',
  'i57ValidateIdentifierId'
];

function sha256Hex(text) {
  return createHash('sha256').update(text).digest('hex');
}

function hex(bytes) {
  return Buffer.from(bytes).toString('hex');
}

function datasetAt(index) {
  const seed = createHash('sha256')
    .update(`cross-language-dataset-${index}`)
    .digest();

  let length = index % 65;
  if (index % 10 === 0) {
    length = 0;
  }

  const data = new Uint8Array(length);
  for (let j = 0; j < length; j += 1) {
    data[j] = seed[(j + index) % seed.length] ^ ((j * 31 + index) & 0xff);
  }

  if (length > 0 && index % 7 === 0) {
    data[0] = 0;
  }
  if (length > 1 && index % 11 === 0) {
    data[1] = 0;
  }

  return data;
}

function canonicalizeRecord(record) {
  const ordered = {};
  for (const key of FIELD_ORDER) {
    ordered[key] = record[key];
  }
  return JSON.stringify(ordered);
}

function buildJSRecord(index) {
  const input = datasetAt(index);

  const b57Encode = encode(input);
  const b57DecodeHex = hex(decode(b57Encode));

  const h57Blake3Len128 = h57Hash(input, H57Length.LEN_128);
  const h57Sha256Len128 = h57Hash(input, H57Length.LEN_128);
  const h57Sha512Len128 = h57Hash(input, H57Length.LEN_128);
  const h57Blake3Auto = h57Hash(input, H57Length.HASH_AUTO);

  const id57Default = id57GenerateDefault(input);
  const id57Len47Sha256 = id57Generate(input, ID57Length.LEN_47);
  const id57Len70Blake3 = id57Generate(input, ID57Length.LEN_70);
  const id57ShortDefault = id57ShortGenerateDefault(input);
  const id57ShortLen23 = id57ShortGenerate(input, ID57ShortLength.LEN_23);

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
    id57Len47Sha256,
    id57Len70Blake3,
    id57ShortDefault,
    id57ShortLen23,
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
    id57ShortVerifyDefault: id57ShortVerifyDefault(input, id57ShortDefault),
    h57VerifyBlake3Len128: h57Verify(input, h57Blake3Len128, H57Length.LEN_128),
    i57ValidateIdentifierId: i57ValidateIdentifier(i57IdDefault)
  };
}

function runJSOnce() {
  const hashes = new Array(DATASET_SIZE);
  for (let i = 0; i < DATASET_SIZE; i += 1) {
    const record = buildJSRecord(i);
    hashes[i] = sha256Hex(canonicalizeRecord(record));
  }
  return hashes;
}

function runGoOnce() {
  const out = execFileSync('go', ['run', './cmd/crosslang'], {
    cwd: goDir,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 512
  });

  const records = JSON.parse(out);
  if (!Array.isArray(records)) {
    throw new TypeError('go output is not an array');
  }
  if (records.length !== DATASET_SIZE) {
    throw new Error(`go output size mismatch: got ${records.length}, expected ${DATASET_SIZE}`);
  }

  const hashes = new Array(DATASET_SIZE);
  for (let i = 0; i < DATASET_SIZE; i += 1) {
    hashes[i] = sha256Hex(canonicalizeRecord(records[i]));
  }

  return hashes;
}

function compareHashRuns(left, right) {
  let mismatchCount = 0;
  const mismatchIndexes = [];
  for (let i = 0; i < left.length; i += 1) {
    if (left[i] !== right[i]) {
      mismatchCount += 1;
      if (mismatchIndexes.length < 20) {
        mismatchIndexes.push(i);
      }
    }
  }
  return { mismatchCount, mismatchIndexes };
}

function run() {
  mkdirSync(outDir, { recursive: true });

  const summary = {
    date: new Date().toISOString(),
    datasetSize: DATASET_SIZE,
    runsPerLanguage: RUNS,
    deterministicScope: [
      'encode/decode/isValid/isCanonical/length helpers',
      'h57 hash/verify',
      'id57 and id57-short generate/verify',
      'i57 encode/decode/hash/id/validation',
      'r57 validators on deterministic identifier input'
    ],
    excludedAsNondeterministic: [
      'r57Generate',
      'i57Random'
    ],
    runs: []
  };

  let jsBaseline = null;
  let goBaseline = null;
  let hasFailure = false;

  for (let runIndex = 1; runIndex <= RUNS; runIndex += 1) {
    const jsHashes = runJSOnce();
    const goHashes = runGoOnce();

    writeFileSync(
      path.join(outDir, `javascript-run-${runIndex}.json`),
      JSON.stringify({ datasetSize: DATASET_SIZE, hashes: jsHashes }, null, 2)
    );
    writeFileSync(
      path.join(outDir, `go-run-${runIndex}.json`),
      JSON.stringify({ datasetSize: DATASET_SIZE, hashes: goHashes }, null, 2)
    );

    const jsDeterminism = jsBaseline ? compareHashRuns(jsBaseline, jsHashes) : { mismatchCount: 0, mismatchIndexes: [] };
    const goDeterminism = goBaseline ? compareHashRuns(goBaseline, goHashes) : { mismatchCount: 0, mismatchIndexes: [] };
    const crossLanguage = compareHashRuns(jsHashes, goHashes);

    if (!jsBaseline) {
      jsBaseline = jsHashes;
    }
    if (!goBaseline) {
      goBaseline = goHashes;
    }

    const runSummary = {
      run: runIndex,
      jsDeterminism,
      goDeterminism,
      crossLanguage
    };
    summary.runs.push(runSummary);

    if (jsDeterminism.mismatchCount > 0 || goDeterminism.mismatchCount > 0 || crossLanguage.mismatchCount > 0) {
      hasFailure = true;
    }
  }

  writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));

  const mdLines = [
    '# Cross-Language E2E Records',
    '',
    `Date: ${summary.date}`,
    `Dataset size: ${DATASET_SIZE}`,
    `Runs per language: ${RUNS}`,
    '',
    'Deterministic scope:',
    ...summary.deterministicScope.map((x) => `- ${x}`),
    '',
    'Excluded as nondeterministic:',
    ...summary.excludedAsNondeterministic.map((x) => `- ${x}`),
    '',
    'Run results:',
    ...summary.runs.map((r) => (
      `- Run ${r.run}: JS deterministic mismatches=${r.jsDeterminism.mismatchCount}, Go deterministic mismatches=${r.goDeterminism.mismatchCount}, Cross-language mismatches=${r.crossLanguage.mismatchCount}`
    ))
  ];
  writeFileSync(path.join(outDir, 'summary.md'), `${mdLines.join('\n')}\n`);

  if (hasFailure) {
    throw new Error('cross-language parity failed; inspect implementations/cross_language_records/summary.json');
  }

  console.log('Cross-language parity passed for deterministic scope.');
  console.log(`Records written to ${outDir}`);
}

run();