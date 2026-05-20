use b57::{encoded_length, decoded_length, 
    decode,  h57_hash, h57_verify, i57_decode, i57_encode, i57_hash, i57_id,
    i57_is_canonical, i57_is_valid, i57_validate_entropy, i57_validate_identifier, id57_generate,
    id57_generate_default, id57_short_generate, id57_short_generate_default, id57_short_verify_default,
    id57_verify_default, is_canonical, is_valid, r57_is_canonical, r57_is_valid, 
     H57Length, ID57Length, ID57ShortLength,
};
use serde::Deserialize;
use sha2::{Digest, Sha256};
use std::process::Command;

const DATASET_SIZE: usize = 10000;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GoRecord {
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
    id57_len47_sha256: String,
    id57_len70_blake3: String,
    id57_short_default: String,
    id57_short_len23: String,
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
    id57_short_verify_default: bool,
    h57_verify_blake3_len128: bool,
    i57_validate_identifier_id: bool,
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

#[test]
fn compare_10000_datasets_with_go() {
    let output = Command::new("go")
        .arg("run")
        .arg("./cmd/crosslang")
        .current_dir("../go")
        .output()
        .expect("failed to run go cross-language generator");

    assert!(
        output.status.success(),
        "go run failed: {}",
        String::from_utf8_lossy(&output.stderr)
    );

    let go_records: Vec<GoRecord> =
        serde_json::from_slice(&output.stdout).expect("failed to parse go JSON records");

    assert_eq!(go_records.len(), DATASET_SIZE);

    for (i, go_rec) in go_records.iter().enumerate() {
        let input = dataset_at(i);
        let input_hex = hex::encode(&input);

        let b57_encode = b57::encode(&input);
        let b57_decode_hex = hex::encode(decode(&b57_encode).expect("decode should pass"));

        let h57_blake3_len128 =
            h57_hash(&input, H57Length::Len128).expect("h57 blake3 128");
        let h57_sha256_len128 =
            h57_hash(&input, H57Length::Len128).expect("h57 sha256 128");
        let h57_sha512_len128 =
            h57_hash(&input, H57Length::Len128).expect("h57 sha512 128");
        let h57_blake3_auto =
            h57_hash(&input, H57Length::HashAuto).expect("h57 blake3 auto");

        let id57_default = id57_generate_default(&input).expect("id57 default");
        let id57_len47_sha256 = id57_generate(
            &input,
                        ID57Length::Len47,
        )
        .expect("id57 len47 sha256");
        let id57_len70_blake3 = id57_generate(
            &input,
                        ID57Length::Len70,
        )
        .expect("id57 len70 blake3");

        let id57_short_default = id57_short_generate_default(&input).expect("id57 short default");
        let id57_short_len23 = id57_short_generate(
            &input,
                        ID57ShortLength::Len23,
        )
        .expect("id57 short len23");

        let i57_encode_out = i57_encode(&input);
        let i57_decode_hex = hex::encode(i57_decode(&i57_encode_out).expect("i57 decode"));
        let i57_hash_blake3_len128 =
            i57_hash(&input, H57Length::Len128).expect("i57 hash");
        let i57_id_default = i57_id(
            &input,
                        ID57Length::Default,
        )
        .expect("i57 id");

        assert_eq!(go_rec.index, i);
        assert_eq!(go_rec.input_hex, input_hex);
        assert_eq!(go_rec.b57_encode, b57_encode);
        assert_eq!(go_rec.b57_decode_hex, b57_decode_hex);
        assert_eq!(go_rec.b57_is_valid, is_valid(&b57_encode));
        assert_eq!(go_rec.b57_is_canonical, is_canonical(&b57_encode));
        assert_eq!(go_rec.b57_encoded_length, encoded_length(input.len()));
        assert_eq!(go_rec.b57_decoded_length, decoded_length(b57_encode.len()));
        assert_eq!(go_rec.h57_blake3_len128, h57_blake3_len128);
        assert_eq!(go_rec.h57_sha256_len128, h57_sha256_len128);
        assert_eq!(go_rec.h57_sha512_len128, h57_sha512_len128);
        assert_eq!(go_rec.h57_blake3_auto, h57_blake3_auto);
        assert_eq!(go_rec.id57_default, id57_default);
        assert_eq!(go_rec.id57_len47_sha256, id57_len47_sha256);
        assert_eq!(go_rec.id57_len70_blake3, id57_len70_blake3);
        assert_eq!(go_rec.id57_short_default, id57_short_default);
        assert_eq!(go_rec.id57_short_len23, id57_short_len23);
        assert_eq!(go_rec.i57_encode, i57_encode_out);
        assert_eq!(go_rec.i57_decode_hex, i57_decode_hex);
        assert_eq!(go_rec.i57_hash_blake3_len128, i57_hash_blake3_len128);
        assert_eq!(go_rec.i57_id_default, i57_id_default);
        assert_eq!(go_rec.i57_is_valid, i57_is_valid(&i57_encode_out));
        assert_eq!(go_rec.i57_is_canonical, i57_is_canonical(&i57_encode_out));
        assert_eq!(go_rec.i57_validate_identifier, i57_validate_identifier(&i57_id_default));
        assert_eq!(go_rec.i57_validate_entropy, i57_validate_entropy(&i57_id_default));
        assert_eq!(go_rec.r57_is_valid_on_i57_id, r57_is_valid(&i57_id_default));
        assert_eq!(go_rec.r57_is_canonical_on_i57_id, r57_is_canonical(&i57_id_default));
        assert_eq!(go_rec.id57_verify_default, id57_verify_default(&input, &id57_default));
        assert_eq!(
            go_rec.id57_short_verify_default,
            id57_short_verify_default(&input, &id57_short_default)
        );
        assert_eq!(
            go_rec.h57_verify_blake3_len128,
            h57_verify(
                &input,
                &h57_blake3_len128,
                H57Length::Len128
            )
        );
        assert_eq!(
            go_rec.i57_validate_identifier_id,
            i57_validate_identifier(&i57_id_default)
        );
    }
}
