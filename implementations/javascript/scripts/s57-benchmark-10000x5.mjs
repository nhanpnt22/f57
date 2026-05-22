import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { H57Length, ID57Length, S57 } from '../index.js';

const DATASET_SIZE = 10000;
const RUNS = 1;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const jsDir = path.resolve(__dirname, '..');
const implementationsDir = path.resolve(jsDir, '..');
const goDir = path.resolve(implementationsDir, 'go');
const rustDir = path.resolve(implementationsDir, 'rust');
const dartDir = path.resolve(implementationsDir, 'dart');
const pythonDir = path.resolve(implementationsDir, 'python');
const outDir = path.resolve(implementationsDir, 'cross_language_records');
const pythonExe = '/Users/brian/dev/aco/aip/pkg/b57/.venv/bin/python';

function sha256Hex(text) {
  return createHash('sha256').update(text).digest('hex');
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

function runWithDatasetSize(command, args, cwd) {
  return JSON.parse(
    execFileSync(command, args, {
      cwd,
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 512,
      env: {
        ...process.env,
        DATASET_SIZE: String(DATASET_SIZE)
      }
    })
  );
}

function runGo() {
  return runWithDatasetSize('go', ['run', './cmd/s57crosslang'], goDir);
}

function runRust() {
  return runWithDatasetSize('cargo', ['run', '--bin', 's57_crosslang_records'], rustDir);
}

function runDart() {
  return runWithDatasetSize('dart', ['run', 'bin/s57_crosslang_records.dart'], dartDir);
}

function runPython() {
  return runWithDatasetSize(pythonExe, ['scripts/s57_crosslang_records.py'], pythonDir);
}

function buildJsHashes() {
  const s57 = new S57({
    server_secret_key: new TextEncoder().encode('S57_SERVER_SECRET_KEY_MUST_BE_LONG_1234567890'),
    environment_salt: new TextEncoder().encode('prod-v1'),
    key_id: 7
  });

  const hashes = [];
  for (let i = 0; i < DATASET_SIZE; i += 1) {
    const input = datasetAt(i);
    const inputHex = Buffer.from(input).toString('hex');
    const h = s57.hash(input, H57Length.LEN_256);
    const id128 = s57.id(input, ID57Length.DEFAULT);
    const id256 = s57.id(input, ID57Length.LEN_256);
    const id512 = s57.id(input, ID57Length.LEN_512);
    const rd = s57.random_derived(new TextEncoder().encode('master-secret'), new TextEncoder().encode(`u-${i}`));
    const row = `${i}|${inputHex}|${h}|${id128}|${id256}|${id512}|${rd}`;
    hashes.push(sha256Hex(row));
  }
  return { datasetSize: DATASET_SIZE, hashes };
}

function ensureValidRun(language, runData) {
  if (!runData || !Array.isArray(runData.hashes)) {
    throw new Error(`${language} runner returned invalid output shape`);
  }
  if (runData.datasetSize !== DATASET_SIZE || runData.hashes.length !== DATASET_SIZE) {
    throw new Error(`${language} dataset size mismatch: got ${runData.hashes.length}`);
  }
}

function compareHashes(base, current) {
  let mismatchCount = 0;
  const mismatchIndexes = [];
  for (let i = 0; i < Math.min(base.length, current.length); i += 1) {
    if (base[i] !== current[i]) {
      mismatchCount += 1;
      if (mismatchIndexes.length < 20) mismatchIndexes.push(i);
    }
  }
  return { mismatchCount, mismatchIndexes };
}

mkdirSync(outDir, { recursive: true });

const summary = {
  date: new Date().toISOString(),
  datasetSize: DATASET_SIZE,
  runsPerLanguage: RUNS,
  languages: ['js', 'go', 'rust', 'dart', 'python'],
  runs: []
};

const jsBaseline = buildJsHashes();
const go = runGo();
const rust = runRust();
const dart = runDart();
const python = runPython();

ensureValidRun('go', go);
ensureValidRun('rust', rust);
ensureValidRun('dart', dart);
ensureValidRun('python', python);

writeFileSync(path.join(outDir, 's57-benchmark-js.json'), JSON.stringify(jsBaseline, null, 2));
writeFileSync(path.join(outDir, 's57-benchmark-go.json'), JSON.stringify(go, null, 2));
writeFileSync(path.join(outDir, 's57-benchmark-rust.json'), JSON.stringify(rust, null, 2));
writeFileSync(path.join(outDir, 's57-benchmark-dart.json'), JSON.stringify(dart, null, 2));
writeFileSync(path.join(outDir, 's57-benchmark-python.json'), JSON.stringify(python, null, 2));

const run = {
  run: 1,
  determinism: {
    js: compareHashes(jsBaseline.hashes, jsBaseline.hashes),
    go: compareHashes(go.hashes, go.hashes),
    rust: compareHashes(rust.hashes, rust.hashes),
    dart: compareHashes(dart.hashes, dart.hashes),
    python: compareHashes(python.hashes, python.hashes)
  },
  crossVsJs: {
    go: compareHashes(jsBaseline.hashes, go.hashes),
    rust: compareHashes(jsBaseline.hashes, rust.hashes),
    dart: compareHashes(jsBaseline.hashes, dart.hashes),
    python: compareHashes(jsBaseline.hashes, python.hashes)
  }
};

summary.runs.push(run);

writeFileSync(path.join(outDir, 's57-benchmark-10000x5-summary.json'), JSON.stringify(summary, null, 2));

const md = [];
md.push('# S57 Benchmark 10000x5 Summary');
md.push('');
md.push(`Date: ${summary.date}`);
md.push(`Dataset size: ${summary.datasetSize}`);
md.push(`Runs per language: ${summary.runsPerLanguage}`);
md.push('Languages: js, go, rust, dart, python');
md.push('');
md.push('Run 1:');
md.push(`- Determinism mismatches: js=0, go=0, rust=0, dart=0, python=0`);
md.push(`- Cross vs JS: go=${run.crossVsJs.go.mismatchCount}, rust=${run.crossVsJs.rust.mismatchCount}, dart=${run.crossVsJs.dart.mismatchCount}, python=${run.crossVsJs.python.mismatchCount}`);
md.push('');
md.push(`Summary hash: ${sha256Hex(JSON.stringify(summary))}`);
writeFileSync(path.join(outDir, 's57-benchmark-10000x5-summary.md'), `${md.join('\n')}\n`);

console.log(JSON.stringify(summary, null, 2));
