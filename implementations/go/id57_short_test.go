package b57

import "testing"

func TestID57ShortGenerateDeterministic(t *testing.T) {
	input := []byte("id57-short-deterministic")
	a, err := ID57ShortGenerate(input, HashBLAKE3, ID57ShortLen47)
	if err != nil {
		t.Fatalf("ID57ShortGenerate failed: %v", err)
	}
	b, err := ID57ShortGenerate(input, HashBLAKE3, ID57ShortLen47)
	if err != nil {
		t.Fatalf("ID57ShortGenerate failed: %v", err)
	}
	if a != b {
		t.Fatalf("non-deterministic output: %q != %q", a, b)
	}
}

func TestID57ShortDefaultUsesLen47(t *testing.T) {
	input := []byte("id57-short-default")
	got, err := ID57ShortGenerateDefault(input)
	if err != nil {
		t.Fatalf("ID57ShortGenerateDefault failed: %v", err)
	}
	want, err := ID57ShortGenerate(input, HashBLAKE3, ID57ShortDefault)
	if err != nil {
		t.Fatalf("ID57ShortGenerate failed: %v", err)
	}
	if got != want {
		t.Fatalf("default output mismatch: %q != %q", got, want)
	}
	if len(got) < 8 || len(got) > 9 {
		t.Fatalf("default output length = %d, want 8..9 for 47-bit profile", len(got))
	}
}

func TestID57ShortAllowedLengths(t *testing.T) {
	input := []byte("id57-short-lengths")
	lengths := []ID57ShortLength{
		ID57ShortLen23,
		ID57ShortLen29,
		ID57ShortLen32,
		ID57ShortLen47,
		ID57ShortLen70,
		ID57ShortDefault,
	}

	for _, ln := range lengths {
		s, err := ID57ShortGenerate(input, HashBLAKE3, ln)
		if err != nil {
			t.Fatalf("ID57ShortGenerate failed for enum %v: %v", ln, err)
		}
		if !ID57ShortIsValid(s) {
			t.Fatalf("invalid ID57-SHORT output for enum %v", ln)
		}
		if !ID57ShortIsCanonical(s) {
			t.Fatalf("non-canonical ID57-SHORT output for enum %v", ln)
		}
		if !ID57ShortVerify(input, HashBLAKE3, s, ln) {
			t.Fatalf("verify failed for enum %v", ln)
		}
	}
}

func TestID57ShortRejectsNonProfileLength(t *testing.T) {
	_, err := ID57ShortGenerate([]byte("x"), HashBLAKE3, ID57ShortLength(128))
	if err == nil {
		t.Fatalf("expected invalid length enum error")
	}
	errVal, ok := err.(*Error)
	if !ok || errVal.Code != ErrInvalidLengthEnum {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestID57ShortVerifyDefault(t *testing.T) {
	input := []byte("id57-short-verify")
	s, err := ID57ShortGenerateDefault(input)
	if err != nil {
		t.Fatalf("ID57ShortGenerateDefault failed: %v", err)
	}
	if !ID57ShortVerifyDefault(input, s) {
		t.Fatalf("ID57ShortVerifyDefault should return true")
	}
	if ID57ShortVerifyDefault([]byte("different"), s) {
		t.Fatalf("ID57ShortVerifyDefault should return false for different input")
	}
}

func TestID57ShortInvalidHashFunction(t *testing.T) {
	_, err := ID57ShortGenerate([]byte("x"), HashFunction("unsupported"), ID57ShortLen47)
	if err == nil {
		t.Fatalf("expected invalid hash function error")
	}
	errVal, ok := err.(*Error)
	if !ok || errVal.Code != ErrInvalidHashFunction {
		t.Fatalf("unexpected error: %v", err)
	}
}
