package b57

import "testing"

func TestEndToEndVectors(t *testing.T) {
	for _, tv := range TestVectors {
		encoded := Encode(tv.Bytes)
		if encoded != tv.Encoded {
			t.Fatalf("encode mismatch for %s: got %q want %q", tv.Name, encoded, tv.Encoded)
		}

		decoded, err := Decode(encoded)
		if err != nil {
			t.Fatalf("decode failed for %s: %v", tv.Name, err)
		}

		reencoded := Encode(decoded)
		if reencoded != encoded {
			t.Fatalf("non-canonical roundtrip for %s: got %q want %q", tv.Name, reencoded, encoded)
		}
	}
}

func TestEndToEndRejectsInvalidInput(t *testing.T) {
	badInputs := []string{
		"ABC0",     // forbidden zero
		"ABC DEF",  // whitespace
		"ABC\nDEF", // control char
		"ABCO",     // forbidden O
		"ABCI",     // forbidden I
		"ABCl",     // forbidden l
		"\u00e9",   // non-ASCII
	}

	for _, in := range badInputs {
		if _, err := Decode(in); err == nil {
			t.Fatalf("expected decode failure for %q", in)
		}
	}
}
