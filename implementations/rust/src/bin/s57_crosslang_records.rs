use b57::{H57Length, ID57Length, S57Config, S57};
use serde::Serialize;
use sha2::{Digest, Sha256};
use std::env;

const DEFAULT_DATASET_SIZE: usize = 1000;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct Output {
    dataset_size: usize,
    hashes: Vec<String>,
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let dataset_size = dataset_size_from_env().unwrap_or(DEFAULT_DATASET_SIZE);
    let s57 = S57::new(S57Config {
        server_secret_key: b"S57_SERVER_SECRET_KEY_MUST_BE_LONG_1234567890".to_vec(),
        environment_salt: b"prod-v1".to_vec(),
        key_id: 7,
    })?;

    let mut hashes = Vec::with_capacity(dataset_size);
    for i in 0..dataset_size {
        let input = dataset_at(i);
        let input_hex = hex::encode(&input);

        let h = s57.hash(&input, H57Length::Len256)?;
        let id128 = s57.id(&input, ID57Length::Default)?;
        let id256 = s57.id(&input, ID57Length::Len256)?;
        let id512 = s57.id(&input, ID57Length::Len512)?;
        let rd = s57.random_derived(b"master-secret", format!("u-{}", i).as_bytes())?;

        let row = format!("{}|{}|{}|{}|{}|{}|{}", i, input_hex, h, id128, id256, id512, rd);
        hashes.push(hex::encode(Sha256::digest(row.as_bytes())));
    }

    println!(
        "{}",
        serde_json::to_string(&Output {
            dataset_size,
            hashes,
        })?
    );
    Ok(())
}

fn dataset_size_from_env() -> Result<usize, Box<dyn std::error::Error>> {
    match env::var("DATASET_SIZE") {
        Ok(value) => {
            let parsed: usize = value.parse()?;
            if parsed == 0 {
                Ok(DEFAULT_DATASET_SIZE)
            } else {
                Ok(parsed)
            }
        }
        Err(_) => Ok(DEFAULT_DATASET_SIZE),
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
