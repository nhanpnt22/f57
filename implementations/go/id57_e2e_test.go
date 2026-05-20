package b57

import "testing"

func TestID57E2E(t *testing.T) {
	input := []byte("hello id57 e2e")
	h, err := ID57Generate(input, ID57Default)
	if err != nil {
		t.Fatalf("expected nil err, got %v", err)
	}
	if !ID57Verify(input, h, ID57Default) {
		t.Fatalf("verify failed")
	}
}
