package b57

import "testing"

func TestID57GenerateDeterministic(t *testing.T) {
	input := []byte("id57-deterministic-input")
	a, err := ID57Generate(input, HashBLAKE3, ID57Len256)
	if err != nil {
		t.Fatalf("ID57Generate failed: %v", err)
	}
	b, err := ID57Generate(input, HashBLAKE3, ID57Len256)
	if err != nil {
		t.Fatalf("ID57Generate failed: %v", err)
	}
	if a != b {
		t.Fatalf("non-deterministic output: %q != %q", a, b)
	}
}

func TestID57GenerateDefaultUses128(t *testing.T) {
	input := []byte{0x80, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14}
	got, err := ID57GenerateDefault(input)
	if err != nil {
		t.Fatalf("ID57GenerateDefault failed: %v", err)
	}
	want, err := ID57Generate(input, HashBLAKE3, ID57Default)
	if err != nil {
		t.Fatalf("ID57Generate failed: %v", err)
	}
	if got != want {
		t.Fatalf("default output mismatch: %q != %q", got, want)
	}
	if len(got) != 22 {
		t.Fatalf("default output length = %d, want 22", len(got))
	}
}

func TestID57OneWayNotRawEncoding(t *testing.T) {
	input := []byte("one-way-pipeline")
	got, err := ID57Generate(input, HashBLAKE3, ID57Len128)
	if err != nil {
		t.Fatalf("ID57Generate failed: %v", err)
	}
	if got == Encode(input) {
		t.Fatalf("ID57 MUST hash input before encoding; raw B57 encoding detected")
	}
}

func TestID57LengthEnumErrors(t *testing.T) {
	_, err := ID57Generate([]byte("x"), HashBLAKE3, ID57Length(99999))
	if err == nil {
		t.Fatalf("expected invalid length enum error")
	}
	errVal, ok := err.(*Error)
	if !ok || errVal.Code != ErrInvalidLengthEnum {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestID57InvalidHashFunction(t *testing.T) {
	_, err := ID57Generate([]byte("x"), HashFunction("unsupported"), ID57Len128)
	if err == nil {
		t.Fatalf("expected invalid hash function error")
	}
	errVal, ok := err.(*Error)
	if !ok || errVal.Code != ErrInvalidHashFunction {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestID57AllLengthEnumerations(t *testing.T) {
	input := make([]byte, 128)
	for i := range input {
		input[i] = byte(i + 1)
	}

	allLengths := []ID57Length{
		ID57Len8, ID57Len16, ID57Len32, ID57Len64, ID57Len128, ID57Len256, ID57Len512,
		ID57Len23, ID57Len29, ID57Len47, ID57Len70, ID57Len93, ID57Len186, ID57Len373,
		ID57Default,
	}

	for _, ln := range allLengths {
		s, err := ID57Generate(input, HashBLAKE3, ln)
		if err != nil {
			t.Fatalf("ID57Generate failed for enum %v: %v", ln, err)
		}
		if !ID57IsValid(s) {
			t.Fatalf("invalid ID57 output for enum %v", ln)
		}
		if !ID57IsCanonical(s) {
			t.Fatalf("non-canonical ID57 output for enum %v", ln)
		}
		if !ID57Verify(input, HashBLAKE3, s, ln) {
			t.Fatalf("verify failed for enum %v", ln)
		}
	}
}

func TestID57SHA512SupportsLen512(t *testing.T) {
	input := []byte("sha512-len512")
	_, err := ID57Generate(input, HashSHA512, ID57Len512)
	if err != nil {
		t.Fatalf("ID57Generate with SHA-512 and LEN_512 failed: %v", err)
	}
}

func TestID57SHA256RejectsLen512(t *testing.T) {
	input := []byte("sha256-len512")
	_, err := ID57Generate(input, HashSHA256, ID57Len512)
	if err == nil {
		t.Fatalf("expected entropy exceeded for SHA-256 with LEN_512")
	}
	errVal, ok := err.(*Error)
	if !ok || errVal.Code != ErrEntropyExceeded {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestID57VerifyDefault(t *testing.T) {
	input := []byte{0x80, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15}
	s, err := ID57GenerateDefault(input)
	if err != nil {
		t.Fatalf("ID57GenerateDefault failed: %v", err)
	}
	if !ID57VerifyDefault(input, s) {
		t.Fatalf("ID57VerifyDefault should return true")
	}
	if ID57VerifyDefault([]byte("different"), s) {
		t.Fatalf("ID57VerifyDefault should return false for different input")
	}
}

func TestID57VerifyReturnsFalseWhenGenerateErrors(t *testing.T) {
	// Unsupported hash function drives the error path inside ID57Verify.
	if ID57Verify([]byte("x"), HashFunction("unsupported"), "abc", ID57Len128) {
		t.Fatalf("ID57Verify should return false when generation fails")
	}
}

func TestResolveID57LengthBehavior(t *testing.T) {
	resolved, err := resolveID57Length(ID57Default)
	if err != nil {
		t.Fatalf("resolveID57Length default failed: %v", err)
	}
	if resolved != ID57Len128 {
		t.Fatalf("default resolve = %v, want %v", resolved, ID57Len128)
	}

	resolved, err = resolveID57Length(ID57Len64)
	if err != nil {
		t.Fatalf("resolveID57Length known enum failed: %v", err)
	}
	if resolved != ID57Len64 {
		t.Fatalf("resolved length = %v, want %v", resolved, ID57Len64)
	}

	_, err = resolveID57Length(ID57Length(77777))
	if err == nil {
		t.Fatalf("expected invalid length enum error")
	}
}

func TestComputeID57HashForLengthDefaultHashAndErrors(t *testing.T) {
	input := []byte("default-hash")

	// Empty hashFn must default to BLAKE3.
	b, err := computeID57HashForLength(input, "", 8)
	if err != nil {
		t.Fatalf("default hash path failed: %v", err)
	}
	if len(b) < 8 {
		t.Fatalf("default hash bytes len = %d, want at least 8", len(b))
	}

	// SHA-256 with request exceeding 256-bit should fail as entropy exceeded.
	_, err = computeID57HashForLength(input, HashSHA256, 64)
	if err == nil {
		t.Fatalf("expected entropy exceeded error")
	}
	errVal, ok := err.(*Error)
	if !ok || errVal.Code != ErrEntropyExceeded {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestMaskExcessBitsEdgeCases(t *testing.T) {
	// Empty slice branch.
	maskExcessBits([]byte{}, 8)

	// No excess bits branch (len*8 == bitLength).
	b := []byte{0xFF}
	maskExcessBits(b, 8)
	if b[0] != 0xFF {
		t.Fatalf("unexpected mutation when no excess bits: %02x", b[0])
	}

	// Excess-bit masking branch.
	b = []byte{0xFF}
	maskExcessBits(b, 5) // keep top 5 bits => 11111000
	if b[0] != 0xF8 {
		t.Fatalf("masked byte = %08b, want %08b", b[0], byte(0xF8))
	}
}

func TestID57IsValidAndCanonical(t *testing.T) {
	s, err := ID57Generate([]byte("valid-canonical"), "", ID57Default)
	if err != nil {
		t.Fatalf("ID57Generate failed: %v", err)
	}
	if !ID57IsValid(s) || !ID57IsCanonical(s) {
		t.Fatalf("expected valid canonical output")
	}
	if ID57IsValid("ABC0") {
		t.Fatalf("expected invalid due to forbidden char")
	}
}
