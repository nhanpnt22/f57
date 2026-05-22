"""S57 end-to-end flow test."""

from b57 import S57, S57Config, H57Length, ID57Length


def test_s57_e2e_secure_composition_flow():
    s57 = S57(
        S57Config(
            server_secret_key=b"S57_SERVER_SECRET_KEY_MUST_BE_LONG_1234567890",
            environment_salt=b"staging-v1",
            key_id=12,
        )
    )

    payload = b"e2e-s57-payload"

    identifier = s57.id(payload, ID57Length.DEFAULT)
    hashed = s57.hash(payload, H57Length.LEN256)
    random_value = s57.random()

    assert len(identifier) == 22
    assert len(hashed) == 44
    assert len(random_value) == 22

    aad = b"s57-e2e"
    sealed = s57.encrypt(payload, aad)
    opened = s57.decrypt(sealed, aad)

    assert opened == b"e2e-s57-payload"
