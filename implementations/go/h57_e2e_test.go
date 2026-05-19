package b57

import "testing"

func TestH57EndToEnd(t *testing.T) {
	inputs := [][]byte{
		[]byte(""),
		[]byte("abc"),
		[]byte("hello world"),
		{0x00, 0x01, 0x02, 0x03, 0x04},
	}

	lengths := []H57Length{H57HashAuto, H57Len8, H57Len16, H57Len32, H57Len64, H57Len128, H57Len256}
	hashes := []HashFunction{HashSHA256, HashSHA512}

	for _, in := range inputs {
		for _, hf := range hashes {
			for _, ln := range lengths {
				h, err := H57Hash(in, hf, ln)
				if err != nil {
					t.Fatalf("H57Hash failed (hf=%s ln=%d): %v", hf, ln, err)
				}
				if !H57IsValid(h) {
					t.Fatalf("invalid H57 output: %q", h)
				}
				if !H57IsCanonical(h) {
					t.Fatalf("non-canonical H57 output: %q", h)
				}
				if !H57Verify(in, h, hf, ln) {
					t.Fatalf("verify failed (hf=%s ln=%d)", hf, ln)
				}
			}
		}
	}
}

func TestH57EndToEndLengthThresholds(t *testing.T) {
	in := []byte("length-thresholds")

	tests := []struct {
		name   string
		hashFn HashFunction
		len    H57Length
		minLen int
	}{
		{"8bit", HashSHA256, H57Len8, 2},
		{"16bit", HashSHA256, H57Len16, 3},
		{"32bit", HashSHA256, H57Len32, 6},
		{"64bit", HashSHA256, H57Len64, 11},
		{"128bit", HashSHA256, H57Len128, 22},
		{"256bit", HashSHA256, H57Len256, 44},
		{"512bit", HashSHA512, H57Len512, 88},
	}

	for _, tt := range tests {
		h, err := H57Hash(in, tt.hashFn, tt.len)
		if err != nil {
			t.Fatalf("%s failed: %v", tt.name, err)
		}
		if len(h) < tt.minLen {
			t.Fatalf("%s length=%d, want at least %d", tt.name, len(h), tt.minLen)
		}
	}
}
