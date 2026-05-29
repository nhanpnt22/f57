import time
from f57 import encode, decode, id57_generate_default
import sys

def run_benchmark():
    iterations = 100000
    data = bytearray(32)
    encoded_strs = [None] * iterations

    # Encode
    start = time.time()
    for i in range(iterations):
        data[0] = i & 0xFF
        data[1] = (i >> 8) & 0xFF
        encoded_strs[i] = encode(bytes(data))
    encode_ms = int((time.time() - start) * 1000)

    # Decode
    start = time.time()
    for i in range(iterations):
        decode(encoded_strs[i])
    decode_ms = int((time.time() - start) * 1000)

    # ID57
    start = time.time()
    for i in range(iterations):
        data[0] = i & 0xFF
        data[1] = (i >> 8) & 0xFF
        id57_generate_default(bytes(data))
    id57_ms = int((time.time() - start) * 1000)

    import json
    print(json.dumps({
        "language": "Python",
        "encode_ms": encode_ms,
        "decode_ms": decode_ms,
        "id57_ms": id57_ms,
        "iterations": iterations
    }))

if __name__ == "__main__":
    run_benchmark()
