package b57

import (
	"strings"
	"testing"
)

func TestErrorConstructorsAndStrings(t *testing.T) {
	err1 := NewInvalidCharError(2, 'x')
	if err1.Code != ErrInvalidChar || !strings.Contains(err1.Error(), "position 2") {
		t.Fatalf("invalid char error mismatch: %+v", err1)
	}

	err2 := NewNonCanonicalError()
	if err2.Code != ErrNonCanonical || !strings.Contains(err2.Error(), "non-canonical") {
		t.Fatalf("non canonical error mismatch: %+v", err2)
	}

	err3 := NewInvalidLengthEnumError(999)
	if err3.Code != ErrInvalidLengthEnum {
		t.Fatalf("invalid length enum code mismatch: %+v", err3)
	}

	err4 := NewEntropyExceededError(10, 5)
	if err4.Code != ErrEntropyExceeded {
		t.Fatalf("entropy exceeded code mismatch: %+v", err4)
	}

	err5 := NewInsufficientEntropyError()
	if err5.Code != ErrInsufficientEntropy {
		t.Fatalf("insufficient entropy code mismatch: %+v", err5)
	}

	err6 := NewInvalidModeError(42)
	if err6.Code != ErrInvalidMode {
		t.Fatalf("invalid mode code mismatch: %+v", err6)
	}

	err7 := NewInvalidInputError("bad")
	if err7.Code != ErrInvalidInput {
		t.Fatalf("invalid input code mismatch: %+v", err7)
	}
}

func TestID57WrappersAndHelpers(t *testing.T) {
	id, err := ID57GenerateDefault([]byte("hello"))
	if err != nil || id == "" {
		t.Fatalf("ID57GenerateDefault failed: id=%q err=%v", id, err)
	}

	if !ID57VerifyDefault([]byte("hello"), id) {
		t.Fatalf("ID57VerifyDefault should pass")
	}
	if ID57VerifyDefault([]byte("hello!"), id) {
		t.Fatalf("ID57VerifyDefault should fail for different input")
	}

	if !ID57IsValid(id) || !ID57IsCanonical(id) {
		t.Fatalf("expected generated id to be valid and canonical")
	}

	if _, err := resolveID57Length(ID57Length(999)); err == nil {
		t.Fatalf("expected invalid length enum error")
	}

	buf := []byte{0xFF}
	maskExcessBits(buf, 5)
	if buf[0] != 0xF8 {
		t.Fatalf("maskExcessBits expected 0xF8, got 0x%X", buf[0])
	}

	// no-op branches
	maskExcessBits(nil, 8)
	maskExcessBits([]byte{0xAA}, 8)
}

func TestID57ShortWrappersAndHelpers(t *testing.T) {
	id, err := ID57ShortGenerateDefault([]byte("hello-short"))
	if err != nil || id == "" {
		t.Fatalf("ID57ShortGenerateDefault failed: id=%q err=%v", id, err)
	}

	if !ID57ShortVerifyDefault([]byte("hello-short"), id) {
		t.Fatalf("ID57ShortVerifyDefault should pass")
	}
	if ID57ShortVerifyDefault([]byte("hello-short!"), id) {
		t.Fatalf("ID57ShortVerifyDefault should fail for different input")
	}

	if !ID57ShortIsValid(id) || !ID57ShortIsCanonical(id) {
		t.Fatalf("expected generated short id to be valid and canonical")
	}

	if _, err := resolveID57ShortLength(ID57ShortLength(999)); err == nil {
		t.Fatalf("expected invalid short length enum error")
	}
}

func TestH57HelpersAndValidation(t *testing.T) {
	h, err := H57Hash([]byte("hello-h57"), H57Len128)
	if err != nil || h == "" {
		t.Fatalf("H57Hash failed: h=%q err=%v", h, err)
	}

	if !H57Verify([]byte("hello-h57"), h, H57Len128) {
		t.Fatalf("H57Verify should pass")
	}
	if H57Verify([]byte("hello-h57!"), h, H57Len128) {
		t.Fatalf("H57Verify should fail for different input")
	}
	if !H57IsValid(h) || !H57IsCanonical(h) {
		t.Fatalf("expected h57 output to be valid and canonical")
	}

	if _, err := selectEffectiveHashBytes([]byte{1, 2, 3}, H57Len512); err == nil {
		t.Fatalf("expected entropy exceeded error")
	}
	if _, err := selectEffectiveHashBytes([]byte{1, 2, 3}, H57Length(999)); err == nil {
		t.Fatalf("expected invalid length enum error")
	}
	if out, err := selectEffectiveHashBytes([]byte{1, 2, 3}, H57HashAuto); err != nil || len(out) != 3 {
		t.Fatalf("expected hash auto passthrough")
	}

	if got := computeHashBLAKE3XOF([]byte("x"), 0); len(got) != 0 {
		t.Fatalf("expected zero-length hash output")
	}
	if got := computeHashBLAKE3XOF([]byte("x"), 16); len(got) != 16 {
		t.Fatalf("expected 16-byte hash output")
	}
	if got := computeHashBLAKE3XOF([]byte("x"), 48); len(got) != 48 {
		t.Fatalf("expected 48-byte hash output")
	}
	if got := computeHashBLAKE3XOF([]byte("x"), 80); len(got) != 80 {
		t.Fatalf("expected 80-byte hash output")
	}
}

func TestI57WrapperFunctions(t *testing.T) {
	encoded := I57Encode([]byte("i57-wrap"))
	decoded, err := I57Decode(encoded)
	if err != nil || string(decoded) != "i57-wrap" {
		t.Fatalf("I57 encode/decode failed: %v", err)
	}

	h, err := I57Hash([]byte("i57-wrap"), H57Len128)
	if err != nil || h == "" {
		t.Fatalf("I57Hash failed: %v", err)
	}

	id, err := I57Id([]byte("i57-wrap"), ID57Default)
	if err != nil || id == "" {
		t.Fatalf("I57Id failed: %v", err)
	}

	r, err := I57Random(R57ModeCSPRNG)
	if err != nil || len(r) == 0 {
		t.Fatalf("I57Random failed: %v", err)
	}

	if !I57IsValid(encoded) || !I57IsCanonical(encoded) {
		t.Fatalf("expected encoded wrapper output to be valid/canonical")
	}
	if I57IsValid("") || I57IsCanonical("") {
		t.Fatalf("empty string must be invalid/non-canonical at I57 layer")
	}
}
