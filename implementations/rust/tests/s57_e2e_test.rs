use b57::{B57Error, H57Length, ID57Length, S57Config, S57};

fn create_s57() -> S57 {
    S57::new(S57Config {
        server_secret_key: b"S57_SERVER_SECRET_KEY_MUST_BE_LONG_1234567890".to_vec(),
        environment_salt: b"prod-v1".to_vec(),
        key_id: 7,
    })
    .expect("S57 init should succeed")
}

#[test]
fn s57_hash_and_id_deterministic() {
    let s = create_s57();
    let input = b"rust-s57-deterministic";

    let h1 = s.hash(input, H57Length::Len256).unwrap();
    let h2 = s.hash(input, H57Length::Len256).unwrap();
    assert_eq!(h1, h2);
    assert_eq!(h1.len(), 44);

    let id1 = s.id(input, ID57Length::Default).unwrap();
    let id2 = s.id(input, ID57Length::Default).unwrap();
    assert_eq!(id1, id2);
    assert_eq!(id1.len(), 22);

    let id256 = s.id(input, ID57Length::Len256).unwrap();
    let id512 = s.id(input, ID57Length::Len512).unwrap();
    assert_eq!(id256.len(), 44);
    assert_eq!(id512.len(), 88);
}

#[test]
fn s57_random_apis_shape_and_deterministic_derived() {
    let s = create_s57();
    let values = vec![
        s.random().unwrap(),
        s.random_time().unwrap(),
        s.random_counter(42).unwrap(),
        s.random_session(b"session-secret").unwrap(),
        s.random_device(b"device-secret").unwrap(),
        s.random_derived(b"master", b"unique").unwrap(),
        s.random_hardened().unwrap(),
        s.random_hybrid(&[b"a", b"b", b"c"]).unwrap(),
    ];

    for v in values {
        assert_eq!(v.len(), 22);
    }

    let d1 = s.random_derived(b"master", b"unique").unwrap();
    let d2 = s.random_derived(b"master", b"unique").unwrap();
    assert_eq!(d1, d2);
}

#[test]
fn s57_encrypt_decrypt_roundtrip_and_failures() {
    let s = create_s57();
    let aad = b"aad-v1";
    let plaintext = b"secret payload";

    let sealed = s.encrypt(plaintext, aad).unwrap();
    let opened = s.decrypt(&sealed, aad, None).unwrap();
    assert_eq!(opened, plaintext);

    let bad_aad = s.decrypt(&sealed, b"bad-aad", None).unwrap_err();
    assert_eq!(bad_aad.code, b57::errors::ErrorCode::AuthFailure);

    let wrong_key = s.decrypt(&sealed, aad, Some(1)).unwrap_err();
    assert_eq!(wrong_key.code, b57::errors::ErrorCode::KeyUnavailable);
}

#[test]
fn s57_invalid_version_fails() {
    let s = create_s57();
    let sealed = s.encrypt(b"hello", b"").unwrap();
    let mut raw = b57::decode(&sealed).unwrap();
    raw[0] = 0xff;
    let tampered = b57::encode(&raw);
    let err: B57Error = s.decrypt(&tampered, b"", None).unwrap_err();
    assert_eq!(err.code, b57::errors::ErrorCode::InvalidVersion);
}

#[test]
fn s57_invalid_inputs_and_lengths_fail() {
    let bad = S57::new(S57Config {
        server_secret_key: b"short".to_vec(),
        environment_salt: b"x".to_vec(),
        key_id: 1,
    });
    assert!(bad.is_err());

    let s = create_s57();
    assert!(s.hash(b"x", H57Length::Len47).is_err());
    assert!(s.id(b"x", ID57Length::Len47).is_err());
    assert!(s.random_hybrid(&[]).is_err());
}

#[test]
fn s57_decrypt_structural_errors_fail() {
    let s = create_s57();
    assert!(s.decrypt("A", b"", None).is_err());

    let short_payload = {
        let mut env = vec![b57::S57_VERSION, 7u8];
        env.extend_from_slice(&[0u8; 12]);
        env.extend_from_slice(&[1u8; 8]);
        b57::encode(&env)
    };
    assert!(s.decrypt(&short_payload, b"", None).is_err());
}

#[test]
fn s57_key_id_and_helper_validity_paths() {
    let s = create_s57();
    let sealed = s.encrypt(b"hello", b"").unwrap();

    let mut raw = b57::decode(&sealed).unwrap();
    raw[1] = 8;
    let wrong_key_envelope = b57::encode(&raw);
    let err = s.decrypt(&wrong_key_envelope, b"", None).unwrap_err();
    assert_eq!(err.code, b57::errors::ErrorCode::KeyUnavailable);

    let random = s.random().unwrap();
    assert!(b57::s57_is_valid(&random));
    assert!(b57::s57_is_canonical(&random));
}
