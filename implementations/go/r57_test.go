package b57

import (
	"errors"
	"testing"
)

func withRandReadStub(t *testing.T, stub func([]byte) (int, error)) {
	t.Helper()
	originalRandRead := randRead
	randRead = stub
	t.Cleanup(func() { randRead = originalRandRead })
}

func TestR57GenerateValidMode(t *testing.T) {
	s, err := R57Generate(R57ModeCSPRNG)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if len(s) != 22 {
		t.Errorf("expected length 22, got %d", len(s))
	}
	if !R57IsValid(s) {
		t.Errorf("expected valid R57, got invalid: %s", s)
	}
	if !R57IsCanonical(s) {
		t.Errorf("expected canonical R57, got non-canonical: %s", s)
	}
}

func TestR57GenerateAllDocumentedModes(t *testing.T) {
	modes := []R57Mode{
		R57ModeCSPRNG,
		R57ModeHashEntropy,
		R57ModeKDFDerived,
		R57ModeCounterKDF,
		R57ModeTimestampKDF,
		R57ModeHardwareRNG,
		R57ModeUUIDv4Compat,
		R57ModeHybridEntropy,
	}

	for _, mode := range modes {
		s, err := R57Generate(mode)
		if err != nil {
			t.Fatalf("mode %d failed: %v", mode, err)
		}
		if len(s) != 22 {
			t.Fatalf("mode %d produced length %d, want 22", mode, len(s))
		}
		if !R57IsValid(s) || !R57IsCanonical(s) {
			t.Fatalf("mode %d produced invalid/canonical output: %s", mode, s)
		}
	}
}

func TestR57GenerateRandReadError(t *testing.T) {
	withRandReadStub(t, func(b []byte) (n int, err error) {
		return 0, errors.New("mock read error")
	})

	_, err := R57Generate(R57ModeCSPRNG)
	if err == nil || err.Error() != "mock read error" {
		t.Errorf("expected mock read error, got %v", err)
	}
}

func TestR57GenerateRandReadShortRead(t *testing.T) {
	withRandReadStub(t, func(b []byte) (n int, err error) {
		return 15, nil
	})

	_, err := R57Generate(R57ModeCSPRNG)
	if err == nil || err.Error() != "failed to read 16 bytes of entropy" {
		t.Errorf("expected short read error, got %v", err)
	}
}

func TestR57GenerateInvalidMode(t *testing.T) {
	_, err := R57Generate(R57Mode(99))
	if err == nil {
		t.Fatal("expected error for invalid mode, got nil")
	}
	if e, ok := err.(*Error); !ok || e.Code != ErrInvalidMode {
		t.Errorf("expected ErrInvalidMode, got %v", err)
	}
}

func TestR57IsValid(t *testing.T) {
	valid, _ := R57Generate(R57ModeCSPRNG)

	tests := []struct {
		name     string
		input    string
		expected bool
	}{
		{"Valid", valid, true},
		{"Too short", "123", false},
		{"Too long", "12345678901234567890123", false},
		{"Invalid chars (length 22)", "12345678901234567890 0", false},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got := R57IsValid(tc.input)
			if got != tc.expected {
				t.Errorf("R57IsValid(%q) = %v; want %v", tc.input, got, tc.expected)
			}
		})
	}
}

func TestR57IsCanonical(t *testing.T) {
	valid, _ := R57Generate(R57ModeCSPRNG)

	tests := []struct {
		name     string
		input    string
		expected bool
	}{
		{"Valid", valid, true},
		{"Too short", "123", false},
		{"Too long", "12345678901234567890123", false},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got := R57IsCanonical(tc.input)
			if got != tc.expected {
				t.Errorf("R57IsCanonical(%q) = %v; want %v", tc.input, got, tc.expected)
			}
		})
	}
}
