use b57::{encoded_length, decoded_length, encode, decode, id57_generate_default};
use std::time::Instant;

fn main() {
    let iterations = 100_000;
    let mut data = [0u8; 32];
    let mut encoded_strs = Vec::with_capacity(iterations);

    let start = Instant::now();
    for i in 0..iterations {
        data[0] = (i & 0xFF) as u8;
        data[1] = ((i >> 8) & 0xFF) as u8;
        encoded_strs.push(encode(&data));
    }
    let encode_ms = start.elapsed().as_millis();

    let start = Instant::now();
    for i in 0..iterations {
        let _ = decode(&encoded_strs[i]).unwrap();
    }
    let decode_ms = start.elapsed().as_millis();

    let start = Instant::now();
    for i in 0..iterations {
        data[0] = (i & 0xFF) as u8;
        data[1] = ((i >> 8) & 0xFF) as u8;
        let _ = id57_generate_default(&data);
    }
    let id_ms = start.elapsed().as_millis();

    println!(
        "{{\"language\": \"Rust\", \"encode_ms\": {}, \"decode_ms\": {}, \"id57_ms\": {}, \"iterations\": {}}}",
        encode_ms, decode_ms, id_ms, iterations
    );
}
