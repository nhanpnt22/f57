package b57

import "strings"

// I57Encode encodes arbitrary bytes to a string using B57.
// It proxies directly to Encode.
func I57Encode(input []byte) string {
	return Encode(input)
}

// I57Decode decodes a B57 string back to bytes.
// It proxies directly to Decode.
func I57Decode(input string) ([]byte, error) {
	return Decode(input)
}

// I57Hash generates a B57-encoded hash using the specified hash function and length.
// It proxies directly to H57Hash.
func I57Hash(input []byte, length H57Length) (string, error) {
	return H57Hash(input, length)
}

// I57Random generates a random B57 string according to the specified mode.
// It proxies directly to R57Generate.
func I57Random(mode R57Mode) (string, error) {
	return R57Generate(mode)
}

// I57Id generates an identifier by hashing the input and truncating to the specified ID length.
// It proxies directly to ID57Generate.
func I57Id(input []byte, length ID57Length) (string, error) {
	return ID57Generate(input, length)
}

// I57IsValid checks if a string is a valid B57 value under integration-layer rules.
// The integration layer rejects empty strings by default.
func I57IsValid(input string) bool {
	if input == "" {
		return false
	}
	return IsValid(input)
}

// I57IsCanonical checks if a string is canonically encoded in B57.
func I57IsCanonical(input string) bool {
	if input == "" {
		return false
	}
	return IsCanonical(input)
}

// I57ValidateIdentifier validates input as an ID57 identifier produced for
// length_enum, dispatching on the sign of length_enum (i57-core-api.txt 5.3):
//
//   - length_enum < 0 (FIXED width): delegates entirely to ID57IsLength
//     (valid B57 alphabet AND exact length == -length_enum). The string
//     MUST NOT be decoded/canonicalized - fixed-width output is a prefix
//     of a bignum encoding, not canonical B57.
//   - length_enum >= 0 (BIT length, including ID57Default): ID57IsLength
//     does not apply, so the bound + canonical + decoded-byte-length +
//     excess-bit check is implemented directly here.
func I57ValidateIdentifier(input string, length ID57Length) bool {
	effective, err := resolveID57Length(length)
	if err != nil {
		return false
	}

	if effective < 0 {
		ok, err := ID57IsLength(input, effective)
		if err != nil {
			return false
		}
		return ok
	}

	minChars, maxChars, err := ID57Range(effective)
	if err != nil {
		return false
	}
	if len(input) < minChars || len(input) > maxChars {
		return false
	}
	if !ID57IsCanonical(input) {
		return false
	}

	decoded, err := Decode(input)
	if err != nil {
		return false
	}

	bits := id57BitsByLength[effective]
	byteLength := (bits + 7) / 8
	if len(decoded) != byteLength {
		return false
	}

	excessBits := byteLength*8 - bits
	if excessBits > 0 {
		lastByte := decoded[byteLength-1]
		mask := byte((1 << excessBits) - 1)
		if lastByte&mask != 0 {
			return false
		}
	}

	return true
}

// I57ValidateEntropy performs a lightweight heuristic check for obviously
// low-entropy-looking identifiers. It must not be used for security decisions.
func I57ValidateEntropy(input string) bool {
	if !I57ValidateIdentifier(input, ID57Default) {
		return false
	}
	if !passesCharacterDiversity(input) {
		return false
	}
	if hasRepeatedHalfPattern(input) {
		return false
	}
	if isSingleRepeatedPattern(strings.ToLower(input)) {
		return false
	}

	return true
}

func passesCharacterDiversity(input string) bool {
	unique := make(map[byte]struct{}, len(input))
	maxRun := 1
	run := 1

	for i := 0; i < len(input); i++ {
		unique[input[i]] = struct{}{}
		if i > 0 {
			if input[i] == input[i-1] {
				run++
				if run > maxRun {
					maxRun = run
				}
			} else {
				run = 1
			}
		}
	}

	if len(unique) < 4 {
		return false
	}
	if maxRun > len(input)/2 {
		return false
	}
	return true
}

func hasRepeatedHalfPattern(input string) bool {
	if len(input)%2 != 0 {
		return false
	}
	halfLen := len(input) / 2
	firstHalf := input[:halfLen]
	secondHalf := input[halfLen:]
	return firstHalf == secondHalf
}

func isSingleRepeatedPattern(input string) bool {
	if input == "" {
		return false
	}
	return input == strings.Repeat(string(input[0]), len(input))
}
