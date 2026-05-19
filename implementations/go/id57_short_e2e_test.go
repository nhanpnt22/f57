package b57

import "testing"

func TestID57ShortEndToEnd(t *testing.T) {
	inputs := [][]byte{
		[]byte(""),
		[]byte("abc"),
		[]byte("id57-short-e2e"),
		{0x80, 0x01, 0x02, 0x03, 0x04, 0x05},
	}

	lengths := []ID57ShortLength{
		ID57ShortDefault,
		ID57ShortLen23,
		ID57ShortLen29,
		ID57ShortLen32,
		ID57ShortLen47,
		ID57ShortLen70,
	}

	for _, in := range inputs {
		for _, ln := range lengths {
			s, err := ID57ShortGenerate(in, HashBLAKE3, ln)
			if err != nil {
				t.Fatalf("ID57ShortGenerate failed (ln=%d): %v", ln, err)
			}
			if !ID57ShortIsValid(s) {
				t.Fatalf("invalid ID57-SHORT output: %q", s)
			}
			if !ID57ShortIsCanonical(s) {
				t.Fatalf("non-canonical ID57-SHORT output: %q", s)
			}
			if !ID57ShortVerify(in, HashBLAKE3, s, ln) {
				t.Fatalf("verify failed (ln=%d)", ln)
			}
		}
	}
}
