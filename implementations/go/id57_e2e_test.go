package b57

import "testing"

func TestID57EndToEnd(t *testing.T) {
	inputs := [][]byte{
		[]byte(""),
		[]byte("abc"),
		[]byte("id57-e2e"),
		{0x80, 0x01, 0x02, 0x03, 0x04, 0x05},
	}

	lengths := []ID57Length{ID57Default, ID57Len8, ID57Len16, ID57Len32, ID57Len64, ID57Len128}

	for _, in := range inputs {
		for _, ln := range lengths {
			h, err := ID57Generate(in, HashBLAKE3, ln)
			if err != nil {
				t.Fatalf("ID57Generate failed (ln=%d): %v", ln, err)
			}
			if !ID57IsValid(h) {
				t.Fatalf("invalid ID57 output: %q", h)
			}
			if !ID57IsCanonical(h) {
				t.Fatalf("non-canonical ID57 output: %q", h)
			}
			if !ID57Verify(in, HashBLAKE3, h, ln) {
				t.Fatalf("verify failed (ln=%d)", ln)
			}
		}
	}
}

func TestID57DefaultProfileEndToEnd(t *testing.T) {
	input := []byte{0x80, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15}
	id, err := ID57GenerateDefault(input)
	if err != nil {
		t.Fatalf("ID57GenerateDefault failed: %v", err)
	}
	if len(id) != 22 {
		t.Fatalf("default ID57 length = %d, want 22", len(id))
	}
	if !ID57VerifyDefault(input, id) {
		t.Fatalf("ID57VerifyDefault failed")
	}
}
