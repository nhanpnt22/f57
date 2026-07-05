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

func TestI57ValidateIdentifier_BitLengthBranch(t *testing.T) {
	input := []byte("hello i57 validate bit length")

	id, err := ID57Generate(input, ID57Default)
	if err != nil {
		t.Fatalf("ID57Generate failed: %v", err)
	}

	if !I57ValidateIdentifier(id, ID57Default) {
		t.Fatalf("expected valid bit-length (default) identifier to validate true")
	}
	if !I57ValidateIdentifier(id, ID57Len128) {
		t.Fatalf("expected valid ID57Len128 identifier to validate true")
	}

	// A string truncated well below ID57Len128's min_chars bound (16) must
	// fail regardless of its numeric value. (Dropping just the last
	// character is deliberately NOT used here: that can still coincide
	// with another well-formed, in-bound, correct-byte-length canonical
	// string, which is legitimately valid structurally - i57_validate_identifier
	// checks conformance, not equality to the original hash output.)
	if I57ValidateIdentifier(id[:5], ID57Len128) {
		t.Fatalf("expected identifier truncated below min_chars to fail validation")
	}
	corrupted := []byte(id)
	corrupted[0] = '0' // '0' is not in the B57 alphabet
	if I57ValidateIdentifier(string(corrupted), ID57Len128) {
		t.Fatalf("expected corrupted (invalid-char) bit-length identifier to fail validation")
	}

	// A different bit length whose bound the string doesn't fit MUST fail.
	if I57ValidateIdentifier(id, ID57Len8) {
		t.Fatalf("expected ID57Len128 output to fail validation against ID57Len8 bound")
	}
}

func TestI57ValidateIdentifier_FixedWidthBranch(t *testing.T) {
	input := []byte("hello i57 validate fixed width")

	id, err := ID57Generate(input, ID57Fixed8)
	if err != nil {
		t.Fatalf("ID57Generate(ID57Fixed8) failed: %v", err)
	}
	if len(id) != 8 {
		t.Fatalf("expected 8-char fixed-width identifier, got %q", id)
	}

	if !I57ValidateIdentifier(id, ID57Fixed8) {
		t.Fatalf("expected valid fixed-width identifier to validate true")
	}

	// Truncated/corrupted strings in fixed-width mode must fail.
	if I57ValidateIdentifier(id[:7], ID57Fixed8) {
		t.Fatalf("expected truncated fixed-width identifier to fail validation")
	}
	corrupted := []byte(id)
	corrupted[0] = '0' // '0' is not in the B57 alphabet
	if I57ValidateIdentifier(string(corrupted), ID57Fixed8) {
		t.Fatalf("expected corrupted (invalid-char) fixed-width identifier to fail validation")
	}

	// A literal string of the right length/alphabet not derived from a
	// real generation is still valid: fixed-width validation MUST NOT
	// decode/canonicalize.
	if !I57ValidateIdentifier("ABCDEFGH", ID57Fixed8) {
		t.Fatalf("expected literal 8-char valid-alphabet string to validate true for FIXED_8")
	}

	// Invalid length_enum values must fail closed (not panic).
	if I57ValidateIdentifier(id, ID57Length(-13)) {
		t.Fatalf("expected invalid length_enum to fail validation")
	}
}
