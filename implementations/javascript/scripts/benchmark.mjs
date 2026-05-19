import { encode, decode, id57GenerateDefault } from '../index.js';

const iterations = 100000;
const data = new Uint8Array(32);
const encodedStrs = new Array(iterations);

// Benchmark Encode
let start = Date.now();
for (let i = 0; i < iterations; i++) {
  data[0] = i & 0xff;
  data[1] = (i >> 8) & 0xff;
  encodedStrs[i] = encode(data);
}
let encodeDuration = Date.now() - start;

// Benchmark Decode
start = Date.now();
for (let i = 0; i < iterations; i++) {
  decode(encodedStrs[i]);
}
let decodeDuration = Date.now() - start;

// Benchmark ID57
start = Date.now();
for (let i = 0; i < iterations; i++) {
  data[0] = i & 0xff;
  data[1] = (i >> 8) & 0xff;
  id57GenerateDefault(data);
}
let idDuration = Date.now() - start;

console.log(JSON.stringify({
  language: "JavaScript",
  encode_ms: encodeDuration,
  decode_ms: decodeDuration,
  id57_ms: idDuration,
  iterations
}));
