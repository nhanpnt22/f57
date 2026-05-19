package b57

import (
	"bytes"
	"strings"
	"testing"
)

// TestEncodeEmpty verifies encoding of empty bytes.
func TestEncodeEmpty(t *testing.T) {
	result := Encode([]byte{})
	if result != "" {
		t.Errorf("Encode([]byte{}) = %q, want empty string", result)
	}
}

// TestDecodeEmpty verifies decoding of empty string.
func TestDecodeEmpty(t *testing.T) {
	result, err := Decode("")
	if err != nil {
		t.Errorf("Decode(\"\") failed: %v", err)
	}
	if len(result) != 0 {
		t.Errorf("Decode(\"\") = %v, want empty bytes", result)
	}
}

// TestRoundTripSingle tests encoding and decoding a single byte.
func TestRoundTripSingle(t *testing.T) {
	tests := []struct {
		name string
		data byte
	}{
		{"zero", 0x00},
		{"one", 0x01},
		{"mid", 0x80},
		{"max", 0xFF},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			original := []byte{tt.data}
			encoded := Encode(original)
			decoded, err := Decode(encoded)
			if err != nil {
				t.Fatalf("Decode failed: %v", err)
			}
			if !bytes.Equal(original, decoded) {
				t.Errorf("Round-trip failed: %v -> %s -> %v", original, encoded, decoded)
			}
		})
	}
}

// TestRoundTripMultiple tests encoding and decoding multi-byte sequences.
func TestRoundTripMultiple(t *testing.T) {
	tests := []struct {
		name string
		data []byte
	}{
		{"two bytes", []byte{0x00, 0x01}},
		{"three bytes", []byte{0xFF, 0xFF, 0xFF}},
		{"mixed", []byte{0x01, 0x02, 0x03, 0x04, 0x05}},
		{"long", []byte{0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF, 0x00, 0x11}},
		{"random", []byte{0x3D, 0x8A, 0xF2, 0x15, 0x7C, 0x9E, 0xB3}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			encoded := Encode(tt.data)
			decoded, err := Decode(encoded)
			if err != nil {
				t.Fatalf("Decode failed: %v", err)
			}
			if !bytes.Equal(tt.data, decoded) {
				t.Errorf("Round-trip failed: %x -> %s -> %x", tt.data, encoded, decoded)
			}
		})
	}
}

// TestDeterminism verifies that encoding is deterministic.
func TestDeterminism(t *testing.T) {
	data := []byte{0x48, 0x65, 0x6C, 0x6C, 0x6F} // "Hello"
	enc1 := Encode(data)
	enc2 := Encode(data)
	enc3 := Encode(data)

	if enc1 != enc2 || enc2 != enc3 {
		t.Errorf("Encoding is not deterministic: %s vs %s vs %s", enc1, enc2, enc3)
	}
}

// TestBijectivity verifies the bijection property.
// Different inputs should produce different outputs.
func TestBijectivity(t *testing.T) {
	inputs := [][]byte{
		{0x00},
		{0x01},
		{0x02},
		{0x00, 0x01},
		{0x01, 0x00},
	}

	seen := make(map[string]bool)
	for _, input := range inputs {
		encoded := Encode(input)
		if seen[encoded] {
			t.Errorf("Bijectivity violated: different inputs produce same output %s", encoded)
		}
		seen[encoded] = true
	}
}

// TestIsValid validates the IsValid function.
func TestIsValid(t *testing.T) {
	tests := []struct {
		name  string
		input string
		valid bool
	}{
		{"empty", "", true},
		{"single char", "A", true},
		{"valid", "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz123456789", true},
		{"lowercase", "abc123", true},
		{"invalid: space", "ABC DEF", false},
		{"invalid: I", "ABCI", false},
		{"invalid: O", "ABCO", false},
		{"invalid: l", "ABCl", false},
		{"invalid: 0", "ABC0", false},
		{"invalid: special", "ABC@", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := IsValid(tt.input)
			if result != tt.valid {
				t.Errorf("IsValid(%q) = %v, want %v", tt.input, result, tt.valid)
			}
		})
	}
}

// TestIsCanonical validates the IsCanonical function.
func TestIsCanonical(t *testing.T) {
	tests := []struct {
		name      string
		input     string
		canonical bool
	}{
		{"empty", "", true},
		{"valid canonical", Encode([]byte{0x01, 0x02, 0x03}), true},
		{"invalid chars", "0OIl", false},
		{"empty after decode", "", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := IsCanonical(tt.input)
			if result != tt.canonical {
				t.Errorf("IsCanonical(%q) = %v, want %v", tt.input, result, tt.canonical)
			}
		})
	}
}

// TestDecodeInvalidChar verifies error handling for invalid characters.
func TestDecodeInvalidChar(t *testing.T) {
	tests := []struct {
		name  string
		input string
	}{
		{"space", "ABC DEF"},
		{"zero", "ABC0DEF"},
		{"letter O", "ABCODEF"},
		{"letter I", "ABCIDEF"},
		{"letter l", "ABCl"},
		{"special char", "ABC@"},
		{"newline", "ABC\nDEF"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := Decode(tt.input)
			if err == nil {
				t.Errorf("Decode(%q) should fail, but succeeded", tt.input)
			}
			if errVal, ok := err.(*Error); !ok || errVal.Code != ErrInvalidChar {
				t.Errorf("Decode(%q) error code = %v, want ErrInvalidChar", tt.input, err)
			}
		})
	}
}

// TestAlphabetExactness verifies the exact alphabet.
func TestAlphabetExactness(t *testing.T) {
	if Alphabet != "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz123456789" {
		t.Errorf("Alphabet is incorrect: %s", Alphabet)
	}

	if len(Alphabet) != 57 {
		t.Errorf("Alphabet length = %d, want 57", len(Alphabet))
	}

	// Check that visually ambiguous characters are excluded
	excluded := []byte{'0', 'O', 'I', 'l'}
	for _, char := range excluded {
		if bytes.Contains([]byte(Alphabet), []byte{char}) {
			t.Errorf("Alphabet contains excluded character %q", char)
		}
	}
}

// TestEncodedLength estimates encoding length.
func TestEncodedLength(t *testing.T) {
	tests := []struct {
		bytes int
		chars int
	}{
		{0, 0},
		{1, 2},
		{2, 3},
		{10, 14},
		{100, 138},
	}

	for _, tt := range tests {
		result := EncodedLength(tt.bytes)
		if result != tt.chars {
			t.Errorf("EncodedLength(%d) = %d, want %d", tt.bytes, result, tt.chars)
		}
	}
}

// TestDecodedLength estimates decoding length.
func TestDecodedLength(t *testing.T) {
	tests := []struct {
		chars int
		bytes int
	}{
		{0, 0},
		{1, 0},
		{2, 1},
		{10, 7},
	}

	for _, tt := range tests {
		result := DecodedLength(tt.chars)
		if result != tt.bytes {
			t.Errorf("DecodedLength(%d) = %d, want %d", tt.chars, result, tt.bytes)
		}
	}
}

// TestLargeData tests encoding/decoding of large byte sequences.
func TestLargeData(t *testing.T) {
	// Create a large byte sequence (1KB)
	data := make([]byte, 1024)
	for i := range data {
		data[i] = byte(i % 256)
	}

	encoded := Encode(data)
	decoded, err := Decode(encoded)

	if err != nil {
		t.Fatalf("Decode failed: %v", err)
	}

	if !bytes.Equal(data, decoded) {
		t.Errorf("Round-trip failed for large data")
	}
}

func TestVerifyCanonicalHelper(t *testing.T) {
	decoded := []byte{0x00}

	if err := verifyCanonical("A", decoded); err != nil {
		t.Fatalf("expected canonical verify to pass: %v", err)
	}

	err := verifyCanonical("B", decoded)
	if err == nil {
		t.Fatalf("expected non-canonical error")
	}
	errVal, ok := err.(*Error)
	if !ok || errVal.Code != ErrNonCanonical {
		t.Fatalf("unexpected error type: %v", err)
	}
}

func TestNonCanonicalErrorFormatting(t *testing.T) {
	err := NewNonCanonicalError()
	if err.Code != ErrNonCanonical {
		t.Fatalf("wrong error code: %v", err.Code)
	}
	msg := err.Error()
	if !strings.Contains(msg, "b57: non-canonical encoding") {
		t.Fatalf("unexpected error message: %q", msg)
	}
	if strings.Contains(msg, "at position") {
		t.Fatalf("non-canonical error should not include position")
	}
}

// TestEntropyPreservation verifies that encoding preserves entropy.
// All 256 possible single-byte values should encode to different strings.
func TestEntropyPreservation(t *testing.T) {
	seen := make(map[string]bool)
	for i := 0; i < 256; i++ {
		encoded := Encode([]byte{byte(i)})
		if seen[encoded] {
			t.Errorf("Entropy not preserved: byte %d produces duplicate encoding", i)
		}
		seen[encoded] = true
	}
}

// BenchmarkEncode benchmarks the Encode function.
func BenchmarkEncode(b *testing.B) {
	data := make([]byte, 64)
	for i := range data {
		data[i] = byte(i % 256)
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		Encode(data)
	}
}

// BenchmarkDecode benchmarks the Decode function.
func BenchmarkDecode(b *testing.B) {
	data := make([]byte, 64)
	for i := range data {
		data[i] = byte(i % 256)
	}
	encoded := Encode(data)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		Decode(encoded)
	}
}

// TestSpecCompliance verifies compliance with the B57 specification.
func TestSpecCompliance(t *testing.T) {
	t.Run("encode_decode_invariant", func(t *testing.T) {
		// Invariant: b57_decode(b57_encode(x)) == x
		for i := 0; i < 256; i++ {
			original := []byte{byte(i)}
			encoded := Encode(original)
			decoded, err := Decode(encoded)
			if err != nil {
				t.Fatalf("Decode failed: %v", err)
			}
			if !bytes.Equal(original, decoded) {
				t.Errorf("Invariant violated for byte %d: %x != %x", i, original, decoded)
			}
		}
	})

	t.Run("encode_canonical_invariant", func(t *testing.T) {
		// Invariant: b57_encode(b57_decode(y)) == y (only if y is canonical)
		for i := 0; i < 256; i++ {
			original := []byte{byte(i)}
			encoded1 := Encode(original)
			decoded, err := Decode(encoded1)
			if err != nil {
				t.Fatalf("Decode failed: %v", err)
			}
			encoded2 := Encode(decoded)
			if encoded1 != encoded2 {
				t.Errorf("Canonical invariant violated for byte %d: %s != %s", i, encoded1, encoded2)
			}
		}
	})
}

// TestErrorHandling verifies error types and messages.
func TestErrorHandling(t *testing.T) {
	t.Run("invalid_char_error", func(t *testing.T) {
		_, err := Decode("ABC@DEF")
		if err == nil {
			t.Fatal("Expected error")
		}
		errVal, ok := err.(*Error)
		if !ok {
			t.Fatalf("Expected *Error, got %T", err)
		}
		if errVal.Code != ErrInvalidChar {
			t.Errorf("Error code = %v, want ErrInvalidChar", errVal.Code)
		}
		if errVal.Index < 0 {
			t.Errorf("Error index should be >= 0, got %d", errVal.Index)
		}
	})

	t.Run("error_string_representation", func(t *testing.T) {
		err := NewInvalidCharError(5, '@')
		if err.Error() == "" {
			t.Errorf("Error() returned empty string")
		}
	})
}
