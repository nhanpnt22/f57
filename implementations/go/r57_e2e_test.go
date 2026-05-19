package b57

import (
	"testing"
)

func TestR57GenerateE2ELoop(t *testing.T) {
	// Generate many R57 strings to ensure they all have length 22
	// and are valid/canonical.
	iterations := 10000

	for i := 0; i < iterations; i++ {
		s, err := R57Generate(R57ModeCSPRNG)
		if err != nil {
			t.Fatalf("iteration %d: unexpected error: %v", i, err)
		}

		if len(s) != 22 {
			t.Fatalf("iteration %d: expected length 22, got %d for string: %s", i, len(s), s)
		}

		if !R57IsValid(s) {
			t.Fatalf("iteration %d: generated invalid R57 string: %s", i, s)
		}

		if !R57IsCanonical(s) {
			t.Fatalf("iteration %d: generated non-canonical R57 string: %s", i, s)
		}
	}
}
