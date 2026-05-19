package b57

import (
	"bytes"
	"testing"
)

func TestI57EncodeDecode(t *testing.T) {
	input := []byte("hello world")
	encoded := I57Encode(input)
	if encoded == "" {
		t.Errorf("I57Encode() returned empty string")
	}

	decoded, err := I57Decode(encoded)
	if err != nil {
		t.Fatalf("I57Decode() failed: %v", err)
	}

	if !bytes.Equal(input, decoded) {
		t.Errorf("Decode(Encode()) = %s, want %s", decoded, input)
	}
}

func TestI57Hash(t *testing.T) {
	input := []byte("test data")
	result, err := I57Hash(input, HashSHA256, H57Len256)
	if err != nil {
		t.Fatalf("I57Hash() failed: %v", err)
	}
	if result == "" {
		t.Errorf("I57Hash() returned empty string")
	}
}

func TestI57Random(t *testing.T) {
	result, err := I57Random(R57ModeCSPRNG)
	if err != nil {
		t.Fatalf("I57Random() failed: %v", err)
	}
	if result == "" {
		t.Errorf("I57Random() returned empty string")
	}
}

func TestI57Id(t *testing.T) {
	input := []byte("test data")
	result, err := I57Id(input, HashSHA256, ID57Len128)
	if err != nil {
		t.Fatalf("I57Id() failed: %v", err)
	}
	if result == "" {
		t.Errorf("I57Id() returned empty string")
	}
}

func TestI57Validation(t *testing.T) {
	encoded := I57Encode([]byte("hello"))
	if !I57IsValid(encoded) {
		t.Errorf("I57IsValid() returned false for valid encoded string: %s", encoded)
	}
	if !I57IsCanonical(encoded) {
		t.Errorf("I57IsCanonical() returned false for valid encoded string: %s", encoded)
	}
	if I57IsValid("") {
		t.Errorf("I57IsValid() should reject empty string in integration mode")
	}
	if I57IsCanonical("") {
		t.Errorf("I57IsCanonical() should reject empty string in integration mode")
	}
}

func TestI57ValidateIdentifier(t *testing.T) {
	id, err := I57Random(R57ModeCSPRNG)
	if err != nil {
		t.Fatalf("I57Random failed: %v", err)
	}

	if !I57ValidateIdentifier(id) {
		t.Fatalf("expected valid identifier: %s", id)
	}

	if I57ValidateIdentifier("short") {
		t.Fatalf("expected short identifier to be rejected")
	}

	if I57ValidateIdentifier("12345678901234567890 0") {
		t.Fatalf("expected whitespace identifier to be rejected")
	}
}

func TestI57ValidateEntropy(t *testing.T) {
	id, err := I57Random(R57ModeCSPRNG)
	if err != nil {
		t.Fatalf("I57Random failed: %v", err)
	}

	if !I57ValidateEntropy(id) {
		t.Fatalf("expected generated identifier to pass entropy heuristic")
	}

	if I57ValidateEntropy("AAAAAAAAAAAAAAAAAAAAAA") {
		t.Fatalf("expected repeated character pattern to fail entropy heuristic")
	}

	if I57ValidateEntropy("ABABABABABABABABABABAB") {
		t.Fatalf("expected repeated-half pattern to fail entropy heuristic")
	}
}
