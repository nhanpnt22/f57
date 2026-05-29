use f57::{
    decode, encode, h57_hash, i57_decode, i57_encode, i57_hash, i57_id, i57_random, id57_generate_default,
    id57_short_generate_default, r57_generate,  H57Length, ID57Length, R57Mode,
};

#[test]
fn e2e_roundtrip_and_profiles() {
    let input = b"rust-e2e-input";

    let b57 = encode(input);
    let decoded = decode(&b57).expect("b57 decode should succeed");
    assert_eq!(decoded, input);

    let h = h57_hash(input, H57Length::Len128)
        .expect("h57 hash should succeed");
    assert!(!h.is_empty());

    let id = id57_generate_default(input).expect("id57 default should succeed");
    assert_eq!(id.len(), 22);

    let id_short = id57_short_generate_default(input).expect("id57 short default should succeed");
    assert!(!id_short.is_empty());

    let i57_enc = i57_encode(input);
    let i57_dec = i57_decode(&i57_enc).expect("i57 decode should succeed");
    assert_eq!(i57_dec, input);

    let i57_h = i57_hash(input, H57Length::Len128)
        .expect("i57 hash should succeed");
    assert!(!i57_h.is_empty());

    let i57_id_out =
        i57_id(input, ID57Length::Default).expect("i57 id should succeed");
    assert_eq!(i57_id_out.len(), 22);

    let r57 = r57_generate(R57Mode::Csprng).expect("r57 should succeed");
    assert_eq!(r57.len(), 22);

    let i57_rand = i57_random(R57Mode::Csprng).expect("i57 random should succeed");
    assert_eq!(i57_rand.len(), 22);
}
