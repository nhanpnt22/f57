#!/usr/bin/env python3
"""Generate deterministic S57 cross-language record hashes."""

import json
import os
from hashlib import sha256

from f57 import S57, S57Config, H57Length, ID57Length

DEFAULT_DATASET_SIZE = 1000


def dataset_at(index: int) -> bytes:
    seed = sha256(f"cross-language-dataset-{index}".encode()).digest()

    length = index % 65
    if index % 10 == 0:
        length = 0

    data = bytearray(length)
    for j in range(length):
        data[j] = seed[(j + index) % len(seed)] ^ ((j * 31 + index) & 0xFF)

    if length > 0 and index % 7 == 0:
        data[0] = 0
    if length > 1 and index % 11 == 0:
        data[1] = 0

    return bytes(data)


def main() -> None:
    dataset_size = int(os.environ.get("DATASET_SIZE", DEFAULT_DATASET_SIZE))
    s57 = S57(
        S57Config(
            server_secret_key=b"S57_SERVER_SECRET_KEY_MUST_BE_LONG_1234567890",
            environment_salt=b"prod-v1",
            key_id=7,
        )
    )

    hashes = []
    for i in range(dataset_size):
        inp = dataset_at(i)
        inp_hex = inp.hex()

        h = s57.hash(inp, H57Length.LEN256)
        id128 = s57.id(inp, ID57Length.DEFAULT)
        id256 = s57.id(inp, ID57Length.LEN256)
        id512 = s57.id(inp, ID57Length.LEN512)
        rd = s57.random_derived(b"master-secret", f"u-{i}".encode())

        row = f"{i}|{inp_hex}|{h}|{id128}|{id256}|{id512}|{rd}"
        hashes.append(sha256(row.encode()).hexdigest())

    print(json.dumps({"datasetSize": dataset_size, "hashes": hashes}))


if __name__ == "__main__":
    main()
