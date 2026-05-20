package b57

import "testing"

func TestH57Hash(t *testing.T) {
	input := []byte("hello")
	h, err := H57Hash(input, H57HashAuto)
	if err != nil {
		t.Fatalf("expected nil err, got %v", err)
	}
	if !H57Verify(input, h, H57HashAuto) {
		t.Fatalf("verify failed")
	}
}
