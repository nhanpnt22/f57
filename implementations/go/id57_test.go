package b57

import "testing"

func TestID57Generate(t *testing.T) {
	input := []byte("hello id57")
	h, err := ID57Generate(input, ID57Default)
	if err != nil {
		t.Fatalf("expected nil err, got %v", err)
	}
	if !ID57Verify(input, h, ID57Default) {
		t.Fatalf("verify failed")
	}
}

// --- BIT-LENGTH mode (positive length_enum, 7.1) ---

func TestID57BitLengths_GenerateVerifyAndRange(t *testing.T) {
	input := []byte("hello id57 bit lengths")

	bitLengths := []ID57Length{
		ID57Default,
		ID57Len8,
		ID57Len16,
		ID57Len32,
		ID57Len64,
		ID57Len128,
		ID57Len256,
		ID57Len512,
	}

	for _, l := range bitLengths {
		out, err := ID57Generate(input, l)
		if err != nil {
			t.Fatalf("ID57Generate(%d) failed: %v", l, err)
		}
		if !ID57Verify(input, out, l) {
			t.Fatalf("ID57Verify(%d) failed for output %q", l, out)
		}
		if !ID57IsValid(out) {
			t.Fatalf("ID57IsValid(%d) expected true for %q", l, out)
		}
		if !ID57IsCanonical(out) {
			t.Fatalf("ID57IsCanonical(%d) expected true for %q", l, out)
		}

		minChars, maxChars, err := ID57Range(l)
		if err != nil {
			t.Fatalf("ID57Range(%d) failed: %v", l, err)
		}
		if minChars > maxChars {
			t.Fatalf("ID57Range(%d) invalid bound [%d,%d]", l, minChars, maxChars)
		}
		if len(out) < minChars || len(out) > maxChars {
			t.Fatalf("ID57Generate(%d) output %q length %d outside bound [%d,%d]", l, out, len(out), minChars, maxChars)
		}

		// id57_is_length is defined ONLY for fixed widths (11.5); it MUST
		// raise INVALID_LENGTH_ENUM for every bit length, including DEFAULT.
		if _, err := ID57IsLength(out, l); err == nil {
			t.Fatalf("ID57IsLength(%d) expected INVALID_LENGTH_ENUM error, got nil", l)
		} else if berr, ok := err.(*Error); !ok || berr.Code != ErrInvalidLengthEnum {
			t.Fatalf("ID57IsLength(%d) expected ErrInvalidLengthEnum, got %v", l, err)
		}
	}
}

func TestID57Range_BitLengthBoundsMatchSpec(t *testing.T) {
	cases := []struct {
		length             ID57Length
		minChars, maxChars int
	}{
		{ID57Len8, 1, 2},
		{ID57Len16, 2, 3},
		{ID57Len32, 4, 6},
		{ID57Len64, 8, 11},
		{ID57Len128, 16, 22},
		{ID57Len256, 32, 44},
		{ID57Len512, 64, 88},
	}

	for _, c := range cases {
		minChars, maxChars, err := ID57Range(c.length)
		if err != nil {
			t.Fatalf("ID57Range(%d) failed: %v", c.length, err)
		}
		if minChars != c.minChars || maxChars != c.maxChars {
			t.Fatalf("ID57Range(%d) = (%d,%d), want (%d,%d)", c.length, minChars, maxChars, c.minChars, c.maxChars)
		}
	}
}

// --- FIXED-WIDTH mode (negative length_enum, 7.2) ---

func TestID57FixedWidths_GenerateExactWidthAndRange(t *testing.T) {
	input := []byte("hello id57 fixed widths")

	fixed := []struct {
		length ID57Length
		k      int
	}{
		{ID57Fixed2, 2},
		{ID57Fixed3, 3},
		{ID57Fixed4, 4},
		{ID57Fixed5, 5},
		{ID57Fixed6, 6},
		{ID57Fixed7, 7},
		{ID57Fixed8, 8},
		{ID57Fixed9, 9},
		{ID57Fixed10, 10},
		{ID57Fixed11, 11},
		{ID57Fixed12, 12},
	}

	for _, f := range fixed {
		out, err := ID57Generate(input, f.length)
		if err != nil {
			t.Fatalf("ID57Generate(%d) failed: %v", f.length, err)
		}
		if len(out) != f.k {
			t.Fatalf("ID57Generate(%d) expected exactly %d chars, got %d (%q)", f.length, f.k, len(out), out)
		}

		minChars, maxChars, err := ID57Range(f.length)
		if err != nil {
			t.Fatalf("ID57Range(%d) failed: %v", f.length, err)
		}
		if minChars != f.k || maxChars != f.k {
			t.Fatalf("ID57Range(%d) = (%d,%d), want (%d,%d)", f.length, minChars, maxChars, f.k, f.k)
		}

		ok, err := ID57IsLength(out, f.length)
		if err != nil {
			t.Fatalf("ID57IsLength(%d) unexpected error: %v", f.length, err)
		}
		if !ok {
			t.Fatalf("ID57IsLength(%d) expected true for generated output %q", f.length, out)
		}

		if !ID57Verify(input, out, f.length) {
			t.Fatalf("ID57Verify(%d) failed for output %q", f.length, out)
		}
	}
}

func TestID57FixedWidth_CutPrefixInvariant(t *testing.T) {
	input := []byte("hello id57 cut invariant")

	full, err := ID57Generate(input, ID57Len128)
	if err != nil {
		t.Fatalf("ID57Generate(ID57Len128) failed: %v", err)
	}

	fixedLengths := []struct {
		length ID57Length
		k      int
	}{
		{ID57Fixed2, 2}, {ID57Fixed3, 3}, {ID57Fixed4, 4}, {ID57Fixed5, 5},
		{ID57Fixed6, 6}, {ID57Fixed7, 7}, {ID57Fixed8, 8}, {ID57Fixed9, 9},
		{ID57Fixed10, 10}, {ID57Fixed11, 11}, {ID57Fixed12, 12},
	}

	outputs := make(map[int]string, len(fixedLengths))
	for _, f := range fixedLengths {
		out, err := ID57Generate(input, f.length)
		if err != nil {
			t.Fatalf("ID57Generate(%d) failed: %v", f.length, err)
		}
		if out != full[:f.k] {
			t.Fatalf("ID57Generate(x, FIXED_%d) = %q, want prefix %q of ID57Len128 output %q", f.k, out, full[:f.k], full)
		}
		outputs[f.k] = out
	}

	// FIXED_j output MUST be a prefix of FIXED_k output for j < k.
	for j := 2; j <= 12; j++ {
		for k := j + 1; k <= 12; k++ {
			if outputs[k][:j] != outputs[j] {
				t.Fatalf("FIXED_%d output %q is not a prefix of FIXED_%d output %q", j, outputs[j], k, outputs[k])
			}
		}
	}
}

func TestID57IsLength_ChecksBothConditionsIndependently(t *testing.T) {
	input := []byte("hello id57 is length")

	generated, err := ID57Generate(input, ID57Fixed4)
	if err != nil {
		t.Fatalf("ID57Generate(ID57Fixed4) failed: %v", err)
	}
	if len(generated) != 4 {
		t.Fatalf("expected 4-char output, got %q", generated)
	}

	// Correct length, valid chars -> true (generated output).
	ok, err := ID57IsLength(generated, ID57Fixed4)
	if err != nil || !ok {
		t.Fatalf("expected generated output to validate true, got ok=%v err=%v", ok, err)
	}

	// Correct length, valid chars, but NOT derived from any real
	// generation - id57_is_length MUST NOT decode/canonicalize, only
	// check alphabet + exact length.
	ok, err = ID57IsLength("AAAA", ID57Fixed4)
	if err != nil {
		t.Fatalf("ID57IsLength(\"AAAA\", ID57Fixed4) unexpected error: %v", err)
	}
	if !ok {
		t.Fatalf("ID57IsLength(\"AAAA\", ID57Fixed4) expected true (valid alphabet + exact length, no decode)")
	}

	// Wrong length, valid chars -> false.
	ok, err = ID57IsLength(generated[:3], ID57Fixed4)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if ok {
		t.Fatalf("expected false for truncated (3-char) string against FIXED_4")
	}
	ok, err = ID57IsLength(generated+"A", ID57Fixed4)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if ok {
		t.Fatalf("expected false for extended (5-char) string against FIXED_4")
	}

	// Correct length, invalid chars (B57 excludes 0, O, I, l) -> false.
	ok, err = ID57IsLength("AAA0", ID57Fixed4)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if ok {
		t.Fatalf("expected false for string containing invalid B57 character '0'")
	}
}

func TestID57Length_InvalidAndValidNegativeValues(t *testing.T) {
	input := []byte("hello id57 invalid lengths")

	// -9 (FIXED_9) is a fully valid, defined length - no gap in 2..12.
	if _, err := ID57Generate(input, ID57Length(-9)); err != nil {
		t.Fatalf("ID57Generate(-9) expected success (FIXED_9 is defined), got %v", err)
	}
	if _, _, err := ID57Range(ID57Length(-9)); err != nil {
		t.Fatalf("ID57Range(-9) expected success, got %v", err)
	}

	invalid := []ID57Length{-1, -13, -20, -100}
	for _, l := range invalid {
		if _, err := ID57Generate(input, l); err == nil {
			t.Fatalf("ID57Generate(%d) expected INVALID_LENGTH_ENUM error, got nil", l)
		} else if berr, ok := err.(*Error); !ok || berr.Code != ErrInvalidLengthEnum {
			t.Fatalf("ID57Generate(%d) expected ErrInvalidLengthEnum, got %v", l, err)
		}

		if _, _, err := ID57Range(l); err == nil {
			t.Fatalf("ID57Range(%d) expected INVALID_LENGTH_ENUM error, got nil", l)
		}

		if _, err := ID57IsLength("AAAA", l); err == nil {
			t.Fatalf("ID57IsLength(%d) expected INVALID_LENGTH_ENUM error, got nil", l)
		}
	}

	// Also reject undefined positive values.
	undefinedPositive := []ID57Length{1, 7, 47, 999}
	for _, l := range undefinedPositive {
		if _, err := ID57Generate(input, l); err == nil {
			t.Fatalf("ID57Generate(%d) expected INVALID_LENGTH_ENUM error, got nil", l)
		}
	}
}
