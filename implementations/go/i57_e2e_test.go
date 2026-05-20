package b57

import "testing"

func TestI57E2E(t *testing.T) {
	input := []byte("hello i57 e2e")
	h, err := I57Hash(input, H57HashAuto)
	if err != nil {
		t.Fatalf("expected nil err, got %v", err)
	}
	if h == "" {
		t.Fatalf("hash is empty")
	}
}
