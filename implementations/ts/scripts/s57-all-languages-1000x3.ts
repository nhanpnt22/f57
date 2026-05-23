import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DATASET_SIZE = 1000;
const RUNS = 3;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const jsDir = path.resolve(__dirname, '..');
const implementationsDir = path.resolve(jsDir, '..');
const goDir = path.resolve(implementationsDir, 'go');
const rustDir = path.resolve(implementationsDir, 'rust');
const dartDir = path.resolve(implementationsDir, 'dart');
const pythonDir = path.resolve(implementationsDir, 'python');
const pythonSrcDir = path.resolve(pythonDir, 'src');
const outDir = path.resolve(implementationsDir, 'cross_language_records');
const pythonExe = process.env.PYTHON_EXE || 'python3';

function sha256Hex(text) {
  return createHash('sha256').update(text).digest('hex');
}

function runGo() {
  return JSON.parse(
    execFileSync('go', ['run', './cmd/s57crosslang'], {
      cwd: goDir,
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 128
    })
  );
}

function runRust() {
  return JSON.parse(
    execFileSync('cargo', ['run', '--bin', 's57_crosslang_records'], {
      cwd: rustDir,
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 128
    })
  );
}

function runDart() {
  return JSON.parse(
    execFileSync('dart', ['run', 'bin/s57_crosslang_records.dart'], {
      cwd: dartDir,
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 128
    })
  );
}

function runPython() {
  return JSON.parse(
    execFileSync(pythonExe, ['scripts/s57_crosslang_records.py'], {
      cwd: pythonDir,
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 128,
      env: {
        ...process.env,
        PYTHONPATH: process.env.PYTHONPATH
          ? `${pythonSrcDir}:${process.env.PYTHONPATH}`
          : pythonSrcDir
      }
    })
  );
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

function ensureValidRun(language, runData) {
  if (!runData || !Array.isArray(runData.hashes)) {
    throw new Error(`${language} runner returned invalid output shape`);
  }
  if (runData.datasetSize !== DATASET_SIZE || runData.hashes.length !== DATASET_SIZE) {
    throw new Error(`${language} dataset size mismatch: got ${runData.hashes.length}`);
  }
}

mkdirSync(outDir, { recursive: true });

const languages = ['go', 'rust', 'dart', 'python'];
const runDataByLanguage = {
  go: [],
  rust: [],
  dart: [],
  python: []
};

for (let run = 1; run <= RUNS; run += 1) {
  const go = runGo();
  const rust = runRust();
  const dart = runDart();
  const python = runPython();

  ensureValidRun('go', go);
  ensureValidRun('rust', rust);
  ensureValidRun('dart', dart);
  ensureValidRun('python', python);

  runDataByLanguage.go.push(go.hashes);
  runDataByLanguage.rust.push(rust.hashes);
  runDataByLanguage.dart.push(dart.hashes);
  runDataByLanguage.python.push(python.hashes);

  writeFileSync(path.join(outDir, `s57-go-run-${run}.json`), JSON.stringify(go, null, 2));
  writeFileSync(path.join(outDir, `s57-rust-run-${run}.json`), JSON.stringify(rust, null, 2));
  writeFileSync(path.join(outDir, `s57-dart-run-${run}.json`), JSON.stringify(dart, null, 2));
  writeFileSync(path.join(outDir, `s57-python-run-${run}.json`), JSON.stringify(python, null, 2));
}

const summary = {
  date: new Date().toISOString(),
  datasetSize: DATASET_SIZE,
  runsPerLanguage: RUNS,
  profile: 'S57',
  languages,
  runs: []
};

for (let run = 1; run <= RUNS; run += 1) {
  const runIndex = run - 1;
  const goHashes = runDataByLanguage.go[runIndex];

  const determinism = {
    go: compareHashes(runDataByLanguage.go[0], runDataByLanguage.go[runIndex]),
    rust: compareHashes(runDataByLanguage.rust[0], runDataByLanguage.rust[runIndex]),
    dart: compareHashes(runDataByLanguage.dart[0], runDataByLanguage.dart[runIndex]),
    python: compareHashes(runDataByLanguage.python[0], runDataByLanguage.python[runIndex])
  };

  const crossVsGo = {
    rust: compareHashes(goHashes, runDataByLanguage.rust[runIndex]),
    dart: compareHashes(goHashes, runDataByLanguage.dart[runIndex]),
    python: compareHashes(goHashes, runDataByLanguage.python[runIndex])
  };

  summary.runs.push({ run, determinism, crossVsGo });
}

writeFileSync(path.join(outDir, 's57-all-languages-1000x3-summary.json'), JSON.stringify(summary, null, 2));

const md = [];
md.push('# S57 Cross-Language 1000x3 Summary');
md.push('');
md.push(`Date: ${summary.date}`);
md.push(`Dataset size: ${summary.datasetSize}`);
md.push(`Runs per language: ${summary.runsPerLanguage}`);
md.push('Languages: go, rust, dart, python');
md.push('');
for (const run of summary.runs) {
  md.push(`Run ${run.run}:`);
  md.push(`- Determinism mismatches: go=${run.determinism.go.mismatchCount}, rust=${run.determinism.rust.mismatchCount}, dart=${run.determinism.dart.mismatchCount}, python=${run.determinism.python.mismatchCount}`);
  md.push(`- Cross vs Go: rust=${run.crossVsGo.rust.mismatchCount}, dart=${run.crossVsGo.dart.mismatchCount}, python=${run.crossVsGo.python.mismatchCount}`);
}
md.push('');
md.push(`Summary hash: ${sha256Hex(JSON.stringify(summary))}`);

writeFileSync(path.join(outDir, 's57-all-languages-1000x3-summary.md'), `${md.join('\n')}\n`);

console.log(JSON.stringify(summary, null, 2));
