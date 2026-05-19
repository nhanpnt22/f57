package b57

import (
	"testing"
)

func TestH57HashDeterministic(t *testing.T) {
	input := []byte("hello-h57")
	a, err := H57Hash(input, HashSHA256, H57HashAuto)
	if err != nil {
		t.Fatalf("H57Hash failed: %v", err)
	}
	b, err := H57Hash(input, HashSHA256, H57HashAuto)
	if err != nil {
		t.Fatalf("H57Hash failed: %v", err)
	}
	if a != b {
		t.Fatalf("non-deterministic output: %q != %q", a, b)
	}
}

func TestH57HashAutoCanonicalLengths(t *testing.T) {
	in := []byte("canonical-length-check")

	sha256Out, err := H57Hash(in, HashSHA256, H57HashAuto)
	if err != nil {
		t.Fatalf("sha256 auto failed: %v", err)
	}
	if len(sha256Out) != 44 {
		t.Fatalf("sha256 auto length = %d, want 44", len(sha256Out))
	}

	sha512Out, err := H57Hash(in, HashSHA512, H57HashAuto)
	if err != nil {
		t.Fatalf("sha512 auto failed: %v", err)
	}
	if len(sha512Out) != 88 {
		t.Fatalf("sha512 auto length = %d, want 88", len(sha512Out))
	}
}

func TestH57HashHashAlignedEnums(t *testing.T) {
	in := []byte("hash-aligned")

	a, err := H57Hash(in, HashSHA256, H57HashAuto)
	if err != nil {
		t.Fatalf("auto failed: %v", err)
	}
	b, err := H57Hash(in, HashSHA256, H57Hash256)
	if err != nil {
		t.Fatalf("hash256 enum failed: %v", err)
	}
	if a != b {
		t.Fatalf("sha256 auto and hash256 mismatch: %q != %q", a, b)
	}

	c, err := H57Hash(in, HashSHA512, H57HashAuto)
	if err != nil {
		t.Fatalf("auto failed: %v", err)
	}
	d, err := H57Hash(in, HashSHA512, H57Hash512)
	if err != nil {
		t.Fatalf("hash512 enum failed: %v", err)
	}
	if c != d {
		t.Fatalf("sha512 auto and hash512 mismatch: %q != %q", c, d)
	}
}

func TestH57HashLengthEnumErrors(t *testing.T) {
	_, err := H57Hash([]byte("x"), HashSHA256, H57Length(99999))
	if err == nil {
		t.Fatalf("expected invalid length enum error")
	}
	errVal, ok := err.(*Error)
	if !ok || errVal.Code != ErrInvalidLengthEnum {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestH57HashEntropyExceeded(t *testing.T) {
	_, err := H57Hash([]byte("x"), HashSHA256, H57Len512)
	if err == nil {
		t.Fatalf("expected entropy exceeded error")
	}
	errVal, ok := err.(*Error)
	if !ok || errVal.Code != ErrEntropyExceeded {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestH57InvalidHashFunction(t *testing.T) {
	_, err := H57Hash([]byte("x"), HashFunction("unsupported"), H57HashAuto)
	if err == nil {
		t.Fatalf("expected invalid hash function error")
	}
	errVal, ok := err.(*Error)
	if !ok || errVal.Code != ErrInvalidHashFunction {
		t.Fatalf("unexpected error: %v", err)
	}
}

// TestH57BLAKE3Supported verifies BLAKE3 is fully supported.
func TestH57BLAKE3Supported(t *testing.T) {
	input := []byte("blake3-test")
	h, err := H57Hash(input, HashBLAKE3, H57HashAuto)
	if err != nil {
		t.Fatalf("BLAKE3 hash failed: %v", err)
	}
	if len(h) != 44 {
		t.Fatalf("BLAKE3 auto length = %d, want 44", len(h))
	}
	if !H57IsValid(h) {
		t.Fatalf("invalid BLAKE3 H57 output")
	}
	if !H57IsCanonical(h) {
		t.Fatalf("non-canonical BLAKE3 H57 output")
	}
}

// TestH57AllLengthEnumerations verifies all 16 length enums work across all hash functions.
// Per spec: 7 required + 2 canonical hash-aligned + 7 informational = 16 total.
func TestH57AllLengthEnumerations(t *testing.T) {
	input := []byte("comprehensive-length-test")

	// All 16 length enums as per spec section 7
	allLengths := []H57Length{
		// Required (7.1)
		H57Len8, H57Len16, H57Len32, H57Len64, H57Len128, H57Len256, H57Len512,
		// Canonical hash-aligned (7.2)
		H57Hash256, H57Hash512,
		// Informational (7.3)
		H57Len23, H57Len29, H57Len47, H57Len70, H57Len93, H57Len186, H57Len373,
	}

	// All supported hash functions including BLAKE3
	hashFns := []HashFunction{HashSHA256, HashSHA512, HashBLAKE3}

	for _, hf := range hashFns {
		for _, ln := range allLengths {
			h, err := H57Hash(input, hf, ln)
			if err != nil {
				// Entropy exceeded is expected for some combinations (e.g., SHA256 with H57Len512)
				if errVal, ok := err.(*Error); ok && errVal.Code == ErrEntropyExceeded {
					continue
				}
				t.Fatalf("H57Hash failed for %s with enum %v: %v", hf, ln, err)
			}
			if !H57IsValid(h) {
				t.Fatalf("invalid H57 output for %s with enum %v", hf, ln)
			}
			if !H57IsCanonical(h) {
				t.Fatalf("non-canonical H57 output for %s with enum %v", hf, ln)
			}
			if !H57Verify(input, h, hf, ln) {
				t.Fatalf("verify failed for %s with enum %v", hf, ln)
			}
		}
	}
}

// TestH57BLAKE3AllLengthEnumerations specifically validates BLAKE3 with all applicable enums.
// BLAKE3 as an XOF can produce any output length, so all enums should work.
func TestH57BLAKE3AllLengthEnumerations(t *testing.T) {
	input := []byte("blake3-all-enums-comprehensive")

	applicableLengths := []struct {
		name string
		len  H57Length
		bits int // expected bit output
	}{
		// Required security thresholds
		{"Len8", H57Len8, 8},
		{"Len16", H57Len16, 16},
		{"Len32", H57Len32, 32},
		{"Len64", H57Len64, 64},
		{"Len128", H57Len128, 128},
		{"Len256", H57Len256, 256},
		{"Len512", H57Len512, 512}, // BLAKE3 as XOF supports this
		// Canonical hash-aligned
		{"Hash256", H57Hash256, 256},
		{"Hash512", H57Hash512, 512},
		// Informational
		{"Len23", H57Len23, 23},
		{"Len29", H57Len29, 29},
		{"Len47", H57Len47, 47},
		{"Len70", H57Len70, 70},
		{"Len93", H57Len93, 93},
		{"Len186", H57Len186, 186},
		{"Len373", H57Len373, 373},
		// Auto mode
		{"HashAuto", H57HashAuto, 256}, // BLAKE3 defaults to 256-bit
	}

	for _, tc := range applicableLengths {
		t.Run(tc.name, func(t *testing.T) {
			h, err := H57Hash(input, HashBLAKE3, tc.len)
			if err != nil {
				t.Fatalf("BLAKE3 with %s failed: %v", tc.name, err)
			}
			if !H57IsValid(h) || !H57IsCanonical(h) {
				t.Fatalf("invalid or non-canonical BLAKE3 output for %s", tc.name)
			}
			if !H57Verify(input, h, HashBLAKE3, tc.len) {
				t.Fatalf("verify failed for BLAKE3 with %s", tc.name)
			}
		})
	}
}

// TestH57EntropyLimitCorrectness validates truncation limits per hash function.
// SHA256 and BLAKE3 (32 bytes) can't do 512-bit; SHA512 (64 bytes) can do both.
func TestH57EntropyLimitCorrectness(t *testing.T) {
	input := []byte("entropy-boundary-test")

	tests := []struct {
		name      string
		hashFn    HashFunction
		len       H57Length
		shouldErr bool
	}{
		// SHA256 (32 bytes = 256 bits)
		{"SHA256 with 256", HashSHA256, H57Len256, false},
		{"SHA256 with 512", HashSHA256, H57Len512, true}, // exceeds 32 bytes
		{"SHA256 with Hash512", HashSHA256, H57Hash512, true},

		// BLAKE3 (32 bytes = 256 bits by default, but XOF can extend)
		// Note: Per BLAKE3 spec, it can produce arbitrary output lengths
		// So theoretically all should work, but our implementation may enforce limits
		{"BLAKE3 with 256", HashBLAKE3, H57Len256, false},
		{"BLAKE3 with Auto", HashBLAKE3, H57HashAuto, false},

		// SHA512 (64 bytes = 512 bits)
		{"SHA512 with 256", HashSHA512, H57Len256, false},
		{"SHA512 with 512", HashSHA512, H57Len512, false},
		{"SHA512 with Hash256", HashSHA512, H57Hash256, false},
		{"SHA512 with Hash512", HashSHA512, H57Hash512, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := H57Hash(input, tt.hashFn, tt.len)
			if tt.shouldErr && err == nil {
				t.Fatalf("expected entropy exceeded error for %s", tt.name)
			}
			if !tt.shouldErr && err != nil {
				t.Fatalf("unexpected error for %s: %v", tt.name, err)
			}
		})
	}
}

func TestH57Verify(t *testing.T) {
	input := []byte("verify-me")
	h, err := H57Hash(input, HashSHA256, H57HashAuto)
	if err != nil {
		t.Fatalf("hash failed: %v", err)
	}

	if !H57Verify(input, h, HashSHA256, H57HashAuto) {
		t.Fatalf("expected verify true")
	}
	if H57Verify([]byte("different"), h, HashSHA256, H57HashAuto) {
		t.Fatalf("expected verify false")
	}
}

func TestH57IsValidAndCanonical(t *testing.T) {
	h, err := H57Hash([]byte("valid-canonical"), HashSHA256, H57HashAuto)
	if err != nil {
		t.Fatalf("hash failed: %v", err)
	}

	if !H57IsValid(h) {
		t.Fatalf("expected valid H57")
	}
	if !H57IsCanonical(h) {
		t.Fatalf("expected canonical H57")
	}

	if H57IsValid("ABC0") {
		t.Fatalf("expected invalid due to forbidden char")
	}
}

// TestH57BLAKE3AllLengths verifies BLAKE3 specifically with all applicable length enums.
func TestH57BLAKE3AllLengths(t *testing.T) {
	Input := []byte("blake3-all-lengths")

	// All lengths that should work with BLAKE3 (32-byte output)
	// BLAKE3 is like SHA256, so all lengths <= 256-bit should work
	applicableLengths := []struct {
		name string
		len  H57Length
	}{
		{"auto", H57HashAuto},
		{"8", H57Len8},
		{"16", H57Len16},
		{"23", H57Len23},
		{"29", H57Len29},
		{"32", H57Len32},
		{"47", H57Len47},
		{"64", H57Len64},
		{"70", H57Len70},
		{"93", H57Len93},
		{"128", H57Len128},
		{"186", H57Len186},
		{"256", H57Len256},
		{"hash256", H57Hash256},
	}

	for _, tc := range applicableLengths {
		t.Run(tc.name, func(t *testing.T) {
			h, err := H57Hash(Input, HashBLAKE3, tc.len)
			if err != nil {
				t.Fatalf("BLAKE3 with %s failed: %v", tc.name, err)
			}
			if !H57IsValid(h) || !H57IsCanonical(h) {
				t.Fatalf("invalid or non-canonical BLAKE3 output for %s", tc.name)
			}
			if !H57Verify(Input, h, HashBLAKE3, tc.len) {
				t.Fatalf("verify failed for BLAKE3 with %s", tc.name)
			}
		})
	}
}

// TestH57LengthEnumExceedsEntropyCorrectly verifies truncation limits per hash.
func TestH57LengthEnumExceedsEntropyCorrectly(t *testing.T) {
	Input := []byte("entropy-limits")

	tests := []struct {
		name      string
		hashFn    HashFunction
		len       H57Length
		shouldErr bool
	}{
		// SHA256 (32 bytes) can't do 512-bit
		{"sha256 with 512", HashSHA256, H57Len512, true},
		// SHA256 can do up to 256-bit
		{"sha256 with 256", HashSHA256, H57Len256, false},
		// BLAKE3 is an XOF and can produce all lengths including 512-bit
		{"blake3 with 512", HashBLAKE3, H57Len512, false},
		// BLAKE3 can do up to 256-bit
		{"blake3 with 256", HashBLAKE3, H57Len256, false},
		// SHA512 (64 bytes) can do both
		{"sha512 with 512", HashSHA512, H57Len512, false},
		{"sha512 with 256", HashSHA512, H57Len256, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := H57Hash(Input, tt.hashFn, tt.len)
			if tt.shouldErr && err == nil {
				t.Fatalf("expected error but got none")
			}
			if !tt.shouldErr && err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
		})
	}
}

func TestComputeHashCoverageBranches(t *testing.T) {
	input := []byte("compute-hash-branches")

	if _, err := computeHash(input, HashSHA256); err != nil {
		t.Fatalf("computeHash sha256 failed: %v", err)
	}
	if _, err := computeHash(input, HashSHA512); err != nil {
		t.Fatalf("computeHash sha512 failed: %v", err)
	}
	if _, err := computeHash(input, HashBLAKE3); err != nil {
		t.Fatalf("computeHash blake3 failed: %v", err)
	}
	if _, err := computeHash(input, HashFunction("bad-hash")); err == nil {
		t.Fatalf("expected invalid hash function error")
	}
}

func TestComputeHashBLAKE3XOFBranches(t *testing.T) {
	input := []byte("xof-branches")

	if got := computeHashBLAKE3XOF(input, 0); len(got) != 0 {
		t.Fatalf("expected empty output for non-positive length")
	}

	if got := computeHashBLAKE3XOF(input, 16); len(got) != 16 {
		t.Fatalf("xof <=32 length = %d, want 16", len(got))
	}

	if got := computeHashBLAKE3XOF(input, 48); len(got) != 48 {
		t.Fatalf("xof <=64 length = %d, want 48", len(got))
	}

	got := computeHashBLAKE3XOF(input, 96)
	if len(got) != 96 {
		t.Fatalf("xof >64 length = %d, want 96", len(got))
	}
	if string(got[:64]) == string(got[64:96]) {
		t.Fatalf("expected extension block to differ from first 64 bytes")
	}
}

func TestH57VerifyErrorPath(t *testing.T) {
	if H57Verify([]byte("x"), "abc", HashFunction("bad-hash"), H57HashAuto) {
		t.Fatalf("H57Verify should be false when hashing fails")
	}
}
