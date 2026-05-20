package b57

import "testing"

func TestID57ShortGenerate(t *testing.T) {
	input := []byte("hello id57 short")
	h, err := ID57ShortGenerate(input, ID57ShortDefault)
	if err != nil {
		t.Fatalf("expected nil err, got %v", err)
	}
	if !ID57ShortVerify(input, h, ID57ShortDefault) {
		t.Fatalf("verify failed")
	}
}
