use f57::{encoded_length, decoded_length,
    decode,   h57_hash, h57_verify, i57_decode, i57_encode, i57_hash,
    i57_id, i57_is_canonical, i57_is_valid, i57_validate_entropy, i57_validate_identifier_default,
    id57_generate, id57_generate_default, id57_verify_default, is_canonical, is_valid,
    r57_is_canonical, r57_is_valid,  H57Length, ID57Length,
};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fs;
use std::path::PathBuf;
use std::process::Command;

const DATASET_SIZE: usize = 10000;
const RUNS: usize = 3;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct Record {
    index: usize,
    input_hex: String,
    b57_encode: String,
    b57_decode_hex: String,
    b57_is_valid: bool,
    b57_is_canonical: bool,
    b57_encoded_length: usize,
    b57_decoded_length: usize,
    h57_blake3_len128: String,
    h57_sha256_len128: String,
    h57_sha512_len128: String,
    h57_blake3_auto: String,
    id57_default: String,
    id57_fixed8: String,
    id57_fixed12: String,
    i57_encode: String,
    i57_decode_hex: String,
    i57_hash_blake3_len128: String,
    i57_id_default: String,
    i57_is_valid: bool,
    i57_is_canonical: bool,
    i57_validate_identifier: bool,
    i57_validate_entropy: bool,
    r57_is_valid_on_i57_id: bool,
    r57_is_canonical_on_i57_id: bool,
    id57_verify_default: bool,
    h57_verify_blake3_len128: bool,
    i57_validate_identifier_id: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct RunHashes {
    dataset_size: usize,
    hashes: Vec<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct MismatchSummary {
    mismatch_count: usize,
    mismatch_indexes: Vec<usize>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct RunSummary {
    run: usize,
    rust_determinism: MismatchSummary,
    cross_language: MismatchSummary,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct Summary {
    dataset_size: usize,
    runs_per_language: usize,
    deterministic_scope: Vec<&'static str>,
    excluded_as_nondeterministic: Vec<&'static str>,
    runs: Vec<RunSummary>,
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let out_dir = PathBuf::from("../cross_language_records");
    fs::create_dir_all(&out_dir)?;

    let go_records = run_go_records()?;
    if go_records.len() != DATASET_SIZE {
        return Err(format!(
            "go record count mismatch: got {}, want {}",
            go_records.len(),
            DATASET_SIZE
        )
        .into());
    }

    let mut baseline: Option<Vec<String>> = None;
    let mut runs = Vec::new();

    for run in 1..=RUNS {
        let rust_hashes = run_rust_hashes(&go_records)?;

        let rust_file = out_dir.join(format!("rust-run-{}.json", run));
        fs::write(
            rust_file,
            serde_json::to_vec_pretty(&RunHashes {
                dataset_size: DATASET_SIZE,
                hashes: rust_hashes.clone(),
            })?,
        )?;

        let rust_determinism = if let Some(base) = &baseline {
            compare_hashes(base, &rust_hashes)
        } else {
            MismatchSummary {
                mismatch_count: 0,
                mismatch_indexes: Vec::new(),
            }
        };

        let go_hashes = hash_records(&go_records)?;
        let cross_language = compare_hashes(&go_hashes, &rust_hashes);

        if baseline.is_none() {
            baseline = Some(rust_hashes);
        }

        runs.push(RunSummary {
            run,
            rust_determinism,
            cross_language,
        });
    }

    let summary = Summary {
        dataset_size: DATASET_SIZE,
        runs_per_language: RUNS,
        deterministic_scope: vec![
            "encode/decode/isValid/isCanonical/length helpers",
            "h57 hash/verify",
            "id57 generate/verify (bit-length and fixed-width)",
            "i57 encode/decode/hash/id/validation",
            "r57 validators on deterministic identifier input",
        ],
        excluded_as_nondeterministic: vec!["r57Generate", "i57Random"],
        runs,
    };

    fs::write(
        out_dir.join("rust-summary.json"),
        serde_json::to_vec_pretty(&summary)?,
    )?;

    let mut md = String::new();
    md.push_str("# Rust Cross-Language E2E Records\n\n");
    md.push_str(&format!("Dataset size: {}\n", DATASET_SIZE));
    md.push_str(&format!("Runs per language: {}\n\n", RUNS));
    md.push_str("Run results:\n");
    for run in &summary.runs {
        md.push_str(&format!(
            "- Run {}: Rust deterministic mismatches={}, Cross-language mismatches={}\n",
            run.run, run.rust_determinism.mismatch_count, run.cross_language.mismatch_count
        ));
    }
    fs::write(out_dir.join("rust-summary.md"), md)?;

    for run in &summary.runs {
        if run.rust_determinism.mismatch_count > 0 || run.cross_language.mismatch_count > 0 {
            return Err("cross-language parity failed; inspect rust-summary.json".into());
        }
    }

    println!("Rust cross-language parity export passed.");
    Ok(())
}

fn run_go_records() -> Result<Vec<Record>, Box<dyn std::error::Error>> {
    let output = Command::new("go")
        .arg("run")
        .arg("./cmd/crosslang")
        .current_dir("../go")
        .output()?;

    if !output.status.success() {
        return Err(format!(
            "go run failed: {}",
            String::from_utf8_lossy(&output.stderr)
        )
        .into());
    }

    let records: Vec<Record> = serde_json::from_slice(&output.stdout)?;
    Ok(records)
}

fn run_rust_hashes(go_records: &[Record]) -> Result<Vec<String>, Box<dyn std::error::Error>> {
    let mut hashes = Vec::with_capacity(DATASET_SIZE);
    for i in 0..DATASET_SIZE {
        let rust = build_rust_record(i)?;
        let go = &go_records[i];
        if serde_json::to_string(go)? != serde_json::to_string(&rust)? {
            return Err(format!("record mismatch at index {}", i).into());
        }
        hashes.push(hash_record(&rust)?);
    }
    Ok(hashes)
}

fn hash_records(records: &[Record]) -> Result<Vec<String>, Box<dyn std::error::Error>> {
    records.iter().map(hash_record).collect()
}

fn hash_record(record: &Record) -> Result<String, Box<dyn std::error::Error>> {
    let data = serde_json::to_string(record)?;
    Ok(hex::encode(Sha256::digest(data.as_bytes())))
}

fn compare_hashes(left: &[String], right: &[String]) -> MismatchSummary {
    let mut mismatch_indexes = Vec::new();
    let mut mismatch_count = 0;

    for i in 0..left.len() {
        if left[i] != right[i] {
            mismatch_count += 1;
            if mismatch_indexes.len() < 20 {
                mismatch_indexes.push(i);
            }
        }
    }

    MismatchSummary {
        mismatch_count,
        mismatch_indexes,
    }
}

fn dataset_at(index: usize) -> Vec<u8> {
    let seed = Sha256::digest(format!("cross-language-dataset-{}", index));

    let mut length = index % 65;
    if index % 10 == 0 {
        length = 0;
    }

    let mut data = vec![0u8; length];
    for j in 0..length {
        data[j] = seed[(j + index) % seed.len()] ^ ((j * 31 + index) % 256) as u8;
    }

    if length > 0 && index % 7 == 0 {
        data[0] = 0;
    }
    if length > 1 && index % 11 == 0 {
        data[1] = 0;
    }

    data
}

fn build_rust_record(index: usize) -> Result<Record, Box<dyn std::error::Error>> {
    let input = dataset_at(index);

    let b57_encode = f57::encode(&input);
    let b57_decode_hex = hex::encode(decode(&b57_encode)?);

    let h57_blake3_len128 = h57_hash(&input, H57Length::Len128)?;
    let h57_sha256_len128 = h57_hash(&input, H57Length::Len128)?;
    let h57_sha512_len128 = h57_hash(&input, H57Length::Len128)?;
    let h57_blake3_auto = h57_hash(&input, H57Length::HashAuto)?;

    let id57_default = id57_generate_default(&input)?;
    let id57_fixed8 = id57_generate(&input, ID57Length::Fixed8)?;
    let id57_fixed12 = id57_generate(&input, ID57Length::Fixed12)?;

    let i57_encode_out = i57_encode(&input);
    let i57_decode_hex = hex::encode(i57_decode(&i57_encode_out)?);
    let i57_hash_blake3_len128 = i57_hash(&input, H57Length::Len128)?;
    let i57_id_default = i57_id(&input, ID57Length::Default)?;

    Ok(Record {
        index,
        input_hex: hex::encode(&input),
        b57_encode: b57_encode.clone(),
        b57_decode_hex,
        b57_is_valid: is_valid(&b57_encode),
        b57_is_canonical: is_canonical(&b57_encode),
        b57_encoded_length: encoded_length(input.len()),
        b57_decoded_length: decoded_length(b57_encode.len()),
        h57_blake3_len128: h57_blake3_len128.clone(),
        h57_sha256_len128,
        h57_sha512_len128,
        h57_blake3_auto,
        id57_default: id57_default.clone(),
        id57_fixed8,
        id57_fixed12,
        i57_encode: i57_encode_out.clone(),
        i57_decode_hex,
        i57_hash_blake3_len128: i57_hash_blake3_len128.clone(),
        i57_id_default: i57_id_default.clone(),
        i57_is_valid: i57_is_valid(&i57_encode_out),
        i57_is_canonical: i57_is_canonical(&i57_encode_out),
        i57_validate_identifier: i57_validate_identifier_default(&i57_id_default),
        i57_validate_entropy: i57_validate_entropy(&i57_id_default),
        r57_is_valid_on_i57_id: r57_is_valid(&i57_id_default),
        r57_is_canonical_on_i57_id: r57_is_canonical(&i57_id_default),
        id57_verify_default: id57_verify_default(&input, &id57_default),
        h57_verify_blake3_len128: h57_verify(
            &input,
            &h57_blake3_len128,
            H57Length::Len128,
        ),
        i57_validate_identifier_id: i57_validate_identifier_default(&i57_id_default),
    })
}