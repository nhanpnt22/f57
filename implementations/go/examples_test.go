package b57

import "testing"

// ExampleEncode demonstrates basic encoding.
func ExampleEncode() {
	data := []byte{0x48, 0x65, 0x6C, 0x6C, 0x6F} // "Hello" in ASCII bytes
	encoded := Encode(data)
	_ = encoded // Use encoded

	// Output will be a B57-encoded string
}

// ExampleDecode demonstrates basic decoding.
func ExampleDecode() {
	encoded := "GrWzSvY"
	decoded, err := Decode(encoded)
	if err != nil {
		// Handle error
		return
	}
	_ = decoded // Use decoded

	// Output will be the original bytes
}

// ExampleIsValid demonstrates validation.
func ExampleIsValid() {
	valid := IsValid("ABCabc123") // true
	invalid := IsValid("ABC0DEF") // false (contains '0')
	_ = valid
	_ = invalid
}

// ExampleIsCanonical demonstrates canonical form checking.
func ExampleIsCanonical() {
	// Create a canonical encoding
	data := []byte{0x01, 0x02, 0x03}
	encoded := Encode(data)

	// Should be canonical
	isCanonical := IsCanonical(encoded)
	_ = isCanonical
}

// TestExamples ensures examples compile and run.
func TestExamples(t *testing.T) {
	// Basic encode/decode
	data := []byte{0x01, 0x02, 0x03}
	encoded := Encode(data)
	decoded, err := Decode(encoded)
	if err != nil {
		t.Fatalf("Decode failed: %v", err)
	}
	if len(decoded) != len(data) {
		t.Errorf("Decoded length mismatch")
	}

	// Validation
	if !IsValid(encoded) {
		t.Errorf("Valid encoding marked as invalid")
	}

	if !IsCanonical(encoded) {
		t.Errorf("Canonical encoding marked as non-canonical")
	}
}
