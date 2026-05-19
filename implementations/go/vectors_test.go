package b57

import "testing"

// TestVectors defines the canonical test vectors for B57 encoding.
// These vectors ensure cross-implementation compatibility.
var TestVectors = []struct {
	Name    string
	Bytes   []byte
	Encoded string
}{
	// Single byte vectors
	{"zero", []byte{0x00}, "A"},
	{"one", []byte{0x01}, "B"},
	{"two", []byte{0x02}, "C"},
	{"max_uint8", []byte{0xFF}, "Ed"},

	// Multi-byte vectors
	{"two_zeros", []byte{0x00, 0x00}, "AA"},
	{"zero_one", []byte{0x00, 0x01}, "AB"},
	{"one_zero", []byte{0x01, 0x00}, "Ee"},
	{"0x0102", []byte{0x01, 0x02}, "Eg"},

	// Longer sequences
	{"all_ff_4bytes", []byte{0xFF, 0xFF, 0xFF, 0xFF}, "HH21Ja"},
	{"sequence_01020304", []byte{0x01, 0x02, 0x03, 0x04}, "BkTYL"},

	// Empty
	{"empty", []byte{}, ""},
}

// TestVectorsRoundTrip verifies all test vectors round-trip correctly.
func TestVectorsRoundTrip(t *testing.T) {
	for _, tv := range TestVectors {
		t.Run(tv.Name, func(t *testing.T) {
			// Test encoding
			encoded := Encode(tv.Bytes)
			if encoded != tv.Encoded {
				t.Errorf("Encode(%v) = %q, want %q", tv.Bytes, encoded, tv.Encoded)
			}

			// Test decoding
			decoded, err := Decode(tv.Encoded)
			if err != nil {
				t.Errorf("Decode(%q) failed: %v", tv.Encoded, err)
				return
			}

			// Verify round-trip
			if len(decoded) != len(tv.Bytes) {
				t.Errorf("Decode(%q) length = %d, want %d", tv.Encoded, len(decoded), len(tv.Bytes))
				return
			}

			for i, b := range tv.Bytes {
				if decoded[i] != b {
					t.Errorf("Decode(%q)[%d] = %02x, want %02x", tv.Encoded, i, decoded[i], b)
				}
			}
		})
	}
}

// TestVectorsCanonical verifies all test vectors are in canonical form.
func TestVectorsCanonical(t *testing.T) {
	for _, tv := range TestVectors {
		t.Run(tv.Name, func(t *testing.T) {
			if !IsCanonical(tv.Encoded) {
				t.Errorf("IsCanonical(%q) = false, want true", tv.Encoded)
			}
		})
	}
}

// TestVectorsValid verifies all test vector encodings are valid.
func TestVectorsValid(t *testing.T) {
	for _, tv := range TestVectors {
		t.Run(tv.Name, func(t *testing.T) {
			if !IsValid(tv.Encoded) {
				t.Errorf("IsValid(%q) = false, want true", tv.Encoded)
			}
		})
	}
}
