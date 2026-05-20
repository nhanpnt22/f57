package b57

import "testing"

func TestI57Hash(t *testing.T) {
	input := []byte("hello i57")
	h, err := I57Hash(input, H57HashAuto)
	if err != nil {
		t.Fatalf("expected nil err, got %v", err)
	}
	if h == "" {
		t.Fatalf("hash is empty")
	}
}
