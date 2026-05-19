package b57

import (
	"testing"
)

func TestI57EndToEnd(t *testing.T) {
	// Full flow: string -> random -> hash -> id -> validate -> decode
	input := []byte("i57-end-to-end-integration")

	hash, err := I57Hash(input, HashBLAKE3, H57Len256)
	if err != nil {
		t.Fatalf("I57Hash failed: %v", err)
	}

	if !I57IsValid(hash) {
		t.Fatalf("I57Hash output is invalid b57: %v", hash)
	}

	decodedHash, err := I57Decode(hash)
	if err != nil {
		t.Fatalf("decode failed: %v", err)
	}

	if len(decodedHash) != 32 {
		t.Fatalf("Expected 32 bytes from decode, got %d", len(decodedHash))
	}

	id, err := I57Id(input, HashSHA256, ID57Len64)
	if err != nil {
		t.Fatalf("I57Id failed: %v", err)
	}

	if !I57IsCanonical(id) {
		t.Fatalf("I57Id output is non-canonical: %v", id)
	}

	rnd, err := I57Random(R57ModeCSPRNG)
	if err != nil {
		t.Fatalf("I57Random failed: %v", err)
	}

	if !I57IsValid(rnd) {
		t.Fatalf("I57Random output invalid: %v", rnd)
	}
}
