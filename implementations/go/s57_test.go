package b57

import (
	"bytes"
	"errors"
	"testing"
)

func testS57(t *testing.T) *S57 {
	t.Helper()
	s, err := NewS57(S57Config{
		ServerSecretKey: []byte("S57_SERVER_SECRET_KEY_MUST_BE_LONG_1234567890"),
		EnvironmentSalt: []byte("prod-v1"),
		KeyID:           7,
	})
	if err != nil {
		t.Fatalf("NewS57 failed: %v", err)
	}
	return s
}

func TestS57ResolveKeys(t *testing.T) {
	s := testS57(t)
	keys, err := s.ResolveKeys(7)
	if err != nil {
		t.Fatalf("ResolveKeys failed: %v", err)
	}
	if len(keys.B57AES256Key) != 32 || len(keys.H57Key) != 32 || len(keys.ID57Key) != 32 {
		t.Fatalf("invalid key lengths")
	}
}

func TestS57HashDeterministic(t *testing.T) {
	s := testS57(t)
	in := []byte("hello-s57-hash")
	a, err := s.Hash(in, H57Len256)
	if err != nil {
		t.Fatalf("Hash failed: %v", err)
	}
	b, err := s.Hash(in, H57Len256)
	if err != nil {
		t.Fatalf("Hash failed: %v", err)
	}
	if a != b {
		t.Fatalf("hash should be deterministic")
	}
	if len(a) != 44 {
		t.Fatalf("expected 44 chars, got %d", len(a))
	}
}

func TestS57IDDeterministicAndLengths(t *testing.T) {
	s := testS57(t)
	in := []byte("hello-s57-id")
	v128, err := s.ID(in, ID57Default)
	if err != nil {
		t.Fatalf("ID failed: %v", err)
	}
	v256, err := s.ID(in, ID57Len256)
	if err != nil {
		t.Fatalf("ID failed: %v", err)
	}
	v512, err := s.ID(in, ID57Len512)
	if err != nil {
		t.Fatalf("ID failed: %v", err)
	}
	min128, max128, err := ID57Range(ID57Len128)
	if err != nil {
		t.Fatalf("ID57Range(ID57Len128) failed: %v", err)
	}
	min256, max256, err := ID57Range(ID57Len256)
	if err != nil {
		t.Fatalf("ID57Range(ID57Len256) failed: %v", err)
	}
	min512, max512, err := ID57Range(ID57Len512)
	if err != nil {
		t.Fatalf("ID57Range(ID57Len512) failed: %v", err)
	}

	if len(v128) < min128 || len(v128) > max128 {
		t.Fatalf("v128 length %d outside bound [%d,%d]", len(v128), min128, max128)
	}
	if len(v256) < min256 || len(v256) > max256 {
		t.Fatalf("v256 length %d outside bound [%d,%d]", len(v256), min256, max256)
	}
	if len(v512) < min512 || len(v512) > max512 {
		t.Fatalf("v512 length %d outside bound [%d,%d]", len(v512), min512, max512)
	}

	// S57 restricts length_enum to the 128/256/512-bit security profile;
	// any other positive bit length (and, by extension, any fixed width -
	// non-security by design) MUST be rejected.
	if _, err := s.ID(in, ID57Length(47)); err == nil {
		t.Fatalf("expected invalid length error for S57 profile")
	}
	if _, err := s.ID(in, ID57Fixed8); err == nil {
		t.Fatalf("expected S57 to reject fixed (non-security) lengths")
	}
}

func TestS57RandomAPIs(t *testing.T) {
	s := testS57(t)
	values := []string{}
	add := func(v string, err error) {
		if err != nil {
			t.Fatalf("random api failed: %v", err)
		}
		values = append(values, v)
	}
	add(s.Random())
	add(s.RandomTime())
	add(s.RandomCounter(42))
	add(s.RandomSession([]byte("session-secret")))
	add(s.RandomDevice([]byte("device-secret")))
	add(s.RandomDerived([]byte("master-secret"), []byte("u-1")))
	add(s.RandomHardened())
	add(s.RandomHybrid([]byte("a"), []byte("b"), []byte("c")))

	for i, v := range values {
		if len(v) != 22 {
			t.Fatalf("value %d expected len 22, got %d", i, len(v))
		}
		if !IsValid(v) || !IsCanonical(v) {
			t.Fatalf("value %d is not valid canonical B57", i)
		}
	}
}

func TestS57RandomDerivedDeterministic(t *testing.T) {
	s := testS57(t)
	a, err := s.RandomDerived([]byte("master"), []byte("unique"))
	if err != nil {
		t.Fatalf("RandomDerived failed: %v", err)
	}
	b, err := s.RandomDerived([]byte("master"), []byte("unique"))
	if err != nil {
		t.Fatalf("RandomDerived failed: %v", err)
	}
	if a != b {
		t.Fatalf("RandomDerived must be deterministic")
	}
}

func TestS57EncryptDecryptRoundTrip(t *testing.T) {
	s := testS57(t)
	pt := []byte("secret payload")
	aad := []byte("aad-v1")

	enc, err := s.Encrypt(pt, aad)
	if err != nil {
		t.Fatalf("Encrypt failed: %v", err)
	}
	out, err := s.Decrypt(enc, aad)
	if err != nil {
		t.Fatalf("Decrypt failed: %v", err)
	}
	if !bytes.Equal(out, pt) {
		t.Fatalf("decrypt output mismatch")
	}
}

func TestS57DecryptWrongAADFails(t *testing.T) {
	s := testS57(t)
	enc, err := s.Encrypt([]byte("hello"), []byte("good-aad"))
	if err != nil {
		t.Fatalf("Encrypt failed: %v", err)
	}
	if _, err := s.Decrypt(enc, []byte("bad-aad")); err == nil {
		t.Fatalf("expected auth failure")
	}
}

func TestS57DecryptWrongKeyIDFails(t *testing.T) {
	s := testS57(t)
	enc, err := s.Encrypt([]byte("hello"), nil)
	if err != nil {
		t.Fatalf("Encrypt failed: %v", err)
	}
	if _, err := s.Decrypt(enc, nil, 1); err == nil {
		t.Fatalf("expected key unavailable error")
	}
}

func TestS57DecryptInvalidVersionFails(t *testing.T) {
	s := testS57(t)
	enc, err := s.Encrypt([]byte("hello"), nil)
	if err != nil {
		t.Fatalf("Encrypt failed: %v", err)
	}
	raw, err := Decode(enc)
	if err != nil {
		t.Fatalf("Decode failed: %v", err)
	}
	raw[0] = 0xff
	tampered := Encode(raw)
	if _, err := s.Decrypt(tampered, nil); err == nil {
		t.Fatalf("expected invalid version error")
	}
}

func TestS57NewInvalidConfigFails(t *testing.T) {
	if _, err := NewS57(S57Config{ServerSecretKey: []byte("short"), EnvironmentSalt: []byte("x")}); err == nil {
		t.Fatalf("expected key invalid error for short server secret")
	}
	if _, err := NewS57(S57Config{ServerSecretKey: []byte("S57_SERVER_SECRET_KEY_MUST_BE_LONG_1234567890"), EnvironmentSalt: nil}); err == nil {
		t.Fatalf("expected key invalid error for missing salt")
	}
}

func TestS57ResolveKeysInvalidSeedFails(t *testing.T) {
	s := &S57{}
	if _, err := s.ResolveKeys(1); err == nil {
		t.Fatalf("expected error for invalid seed")
	}
}

func TestS57HashInvalidLengthFails(t *testing.T) {
	s := testS57(t)
	if _, err := s.Hash([]byte("x"), H57Len47); err == nil {
		t.Fatalf("expected invalid length enum error")
	}
}

func TestS57EncryptWithInvalidKeyFails(t *testing.T) {
	s := testS57(t)
	s.keys.B57AES256Key = nil
	if _, err := s.Encrypt([]byte("hello"), nil); err == nil {
		t.Fatalf("expected invalid key error")
	}
}

func TestS57DecryptInvalidEnvelopeLengthFails(t *testing.T) {
	s := testS57(t)
	if _, err := s.Decrypt("A", nil); err == nil {
		t.Fatalf("expected invalid envelope error")
	}
}

func TestS57DecryptWithInvalidStoredKeyFails(t *testing.T) {
	s := testS57(t)
	enc, err := s.Encrypt([]byte("hello"), nil)
	if err != nil {
		t.Fatalf("Encrypt failed: %v", err)
	}
	s.keys.B57AES256Key = nil
	if _, err := s.Decrypt(enc, nil); err == nil {
		t.Fatalf("expected key unavailable error")
	}
}

func TestS57EntropyFailures(t *testing.T) {
	s := testS57(t)
	original := s57EntropyReader
	s57EntropyReader = func(length int) ([]byte, error) {
		return nil, errors.New("entropy source failure")
	}
	defer func() { s57EntropyReader = original }()

	if _, err := s.Random(); err == nil {
		t.Fatalf("expected random entropy failure")
	}
	if _, err := s.RandomTime(); err == nil {
		t.Fatalf("expected random_time entropy failure")
	}
	if _, err := s.RandomCounter(1); err == nil {
		t.Fatalf("expected random_counter entropy failure")
	}
	if _, err := s.RandomSession([]byte("x")); err == nil {
		t.Fatalf("expected random_session entropy failure")
	}
	if _, err := s.RandomDevice([]byte("x")); err == nil {
		t.Fatalf("expected random_device entropy failure")
	}
	if _, err := s.RandomHardened(); err == nil {
		t.Fatalf("expected random_hardened entropy failure")
	}
	if _, err := s.Encrypt([]byte("x"), nil); err == nil {
		t.Fatalf("expected encrypt entropy failure")
	}
}
