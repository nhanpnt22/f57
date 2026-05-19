// Package b57 implements the B57 binary-to-text encoding scheme.
//
// B57 provides a minimal, bijective, deterministic encoding for binary data
// into human-readable ASCII strings. It eliminates visually ambiguous characters
// and preserves all input entropy.
//
// The alphabet is: ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz123456789
// (excludes 0, O, I, l)
package b57

import (
	"math"
	"math/big"
)

const (
	// Alphabet defines the canonical B57 character set.
	Alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz123456789"
	// Base is the base for B57 encoding.
	Base = 57
)

// alphaIndex maps each ASCII character to its position in the alphabet.
// A value of 255 indicates an invalid character.
var alphaIndex [256]byte

func init() {
	// Initialize alphaIndex with all 255 values.
	for i := range alphaIndex {
		alphaIndex[i] = 255
	}
	// Map each character in Alphabet to its index.
	for i, c := range []byte(Alphabet) {
		alphaIndex[c] = byte(i)
	}
}

// Encode converts raw bytes into a canonical B57 string.
//
// The encoding is deterministic, bijective, and preserves all input entropy.
// Empty input returns an empty string.
//
// Rules:
//   - Input bytes are interpreted as a big-endian unsigned integer
//   - Encoding is canonical (one unique output per input)
//   - No bias is introduced
func Encode(data []byte) string {
	// Handle empty input.
	if len(data) == 0 {
		return ""
	}

	// Count leading zero bytes to preserve them.
	leadingZeros := 0
	for _, b := range data {
		if b == 0 {
			leadingZeros++
		} else {
			break
		}
	}

	// If all bytes are zero, encode as many 'A' characters.
	if leadingZeros == len(data) {
		result := make([]byte, len(data))
		for i := range result {
			result[i] = Alphabet[0] // 'A'
		}
		return string(result)
	}

	// Convert non-zero bytes to a big.Int (big-endian).
	nonZeroData := data[leadingZeros:]
	num := new(big.Int).SetBytes(nonZeroData)

	// Base for arithmetic.
	base := big.NewInt(int64(Base))

	// Generate encoded string by repeatedly dividing by base.
	var result []byte
	for num.Sign() > 0 {
		remainder := new(big.Int)
		num.DivMod(num, base, remainder)
		result = append(result, Alphabet[remainder.Int64()])
	}

	// Reverse to get correct order (we built it backwards).
	for i, j := 0, len(result)-1; i < j; i, j = i+1, j-1 {
		result[i], result[j] = result[j], result[i]
	}

	// Prepend leading zeros (encoded as first alphabet character).
	prefix := make([]byte, leadingZeros)
	for i := range prefix {
		prefix[i] = Alphabet[0] // 'A'
	}

	return string(append(prefix, result...))
}

// Decode converts a B57 string into raw bytes.
//
// Validation rules:
//   - All characters must be in the B57 alphabet
//   - Encoding must be canonical
//   - Invalid input causes decoding to fail
//
// Returns an error if the input is invalid or non-canonical.
func Decode(s string) ([]byte, error) {
	// Handle empty input.
	if len(s) == 0 {
		return []byte{}, nil
	}

	// Validate all characters and check for canonical form.
	if err := validateCharacters(s); err != nil {
		return nil, err
	}

	// Count leading 'A' characters (which represent zero bytes).
	leadingZeros := 0
	for i := 0; i < len(s); i++ {
		idx := alphaIndex[s[i]]
		if idx == 0 { // 'A' maps to 0
			leadingZeros++
		} else {
			break
		}
	}

	// If all characters are 'A', return all zeros.
	if leadingZeros == len(s) {
		result := make([]byte, len(s))
		// All zeros, verify canonical form.
		if err := verifyCanonical(s, result); err != nil {
			return nil, err
		}
		return result, nil
	}

	// Convert remaining characters to big.Int using base-57 arithmetic.
	numStr := s[leadingZeros:]
	num := big.NewInt(0)
	base := big.NewInt(int64(Base))

	for i := 0; i < len(numStr); i++ {
		idx := alphaIndex[numStr[i]]
		num.Mul(num, base)
		num.Add(num, big.NewInt(int64(idx)))
	}

	// Convert big.Int back to bytes (big-endian).
	numBytes := num.Bytes()

	// Combine leading zeros with the converted bytes.
	result := make([]byte, leadingZeros+len(numBytes))
	copy(result[leadingZeros:], numBytes)

	// Verify canonical form by re-encoding and comparing.
	if err := verifyCanonical(s, result); err != nil {
		return nil, err
	}

	return result, nil
}

// IsValid checks if the input string contains only valid B57 characters.
//
// Returns true only if all characters are in the B57 alphabet.
// Empty string is considered valid.
func IsValid(s string) bool {
	if len(s) == 0 {
		return true
	}

	for i := 0; i < len(s); i++ {
		if alphaIndex[s[i]] == 255 {
			return false
		}
	}
	return true
}

// IsCanonical verifies if the input string is in canonical form.
//
// A string is canonical if, when decoded and re-encoded, it produces
// an identical string.
func IsCanonical(s string) bool {
	if len(s) == 0 {
		return true
	}

	// First validate characters.
	if !IsValid(s) {
		return false
	}

	// Decode and re-encode.
	decoded, err := Decode(s)
	if err != nil {
		return false
	}

	reencoded := Encode(decoded)
	return s == reencoded
}

// EncodedLength returns the expected length of the B57 encoded string
// for the given number of bytes.
//
// Formula: ceil(byte_length * 8 / log2(57))
// Approximation: for precise length, use actual encoding.
func EncodedLength(byteLen int) int {
	if byteLen <= 0 {
		return 0
	}
	return int(math.Ceil((float64(byteLen) * 8.0) / math.Log2(57.0)))
}

// DecodedLength returns an estimate of the decoded byte length
// for the given number of B57 characters.
//
// Formula: floor(char_length * log2(57) / 8)
// This is an estimate; actual length may be 1 byte shorter.
func DecodedLength(charLen int) int {
	if charLen <= 0 {
		return 0
	}
	return int(math.Floor((float64(charLen) * math.Log2(57.0)) / 8.0))
}

// validateCharacters checks that all characters in the string are valid.
func validateCharacters(s string) error {
	for i := 0; i < len(s); i++ {
		if alphaIndex[s[i]] == 255 {
			return NewInvalidCharError(i, s[i])
		}
	}
	return nil
}

// verifyCanonical ensures the decoded bytes encode back to the original string.
func verifyCanonical(original string, decoded []byte) error {
	reencoded := Encode(decoded)
	if original != reencoded {
		return NewNonCanonicalError()
	}
	return nil
}
