package b57

import (
	"lukechampine.com/blake3"
)

// H57Length represents controlled H57 output length modes.
type H57Length int

const (
	// H57HashAuto preserves full hash entropy without truncation.
	H57HashAuto H57Length = -1

	// Minimum security thresholds.
	H57Len8   H57Length = 8
	H57Len16  H57Length = 16
	H57Len23  H57Length = 23
	H57Len29  H57Length = 29
	H57Len32  H57Length = 32
	H57Len47  H57Length = 47
	H57Len64  H57Length = 64
	H57Len70  H57Length = 70
	H57Len93  H57Length = 93
	H57Len128 H57Length = 128
	H57Len186 H57Length = 186
	H57Len256 H57Length = 256
	H57Len373 H57Length = 373
	H57Len512 H57Length = 512

	// Hash-aligned canonical lengths.
	H57Hash256 H57Length = 10256
	H57Hash512 H57Length = 10512
)

var h57BitsByLength = map[H57Length]int{
	H57Len8:   8,
	H57Len16:  16,
	H57Len23:  23,
	H57Len29:  29,
	H57Len32:  32,
	H57Len47:  47,
	H57Len64:  64,
	H57Len70:  70,
	H57Len93:  93,
	H57Len128: 128,
	H57Len186: 186,
	H57Len256: 256,
	H57Len373: 373,
	H57Len512: 512,

	H57Hash256: 256,
	H57Hash512: 512,
}

// H57Hash computes canonical H57 representation from input bytes, hash function, and length mode.
//
// Truncation is applied to raw hash bytes before B57 encoding.
// BLAKE3 (preferred) supports all LENGTH ENUMERATION values via XOF.
// SHA-512 also supports all LENGTH ENUMERATION values via its 64-byte output.
func H57Hash(input []byte, length H57Length) (string, error) {
	var hashBytes []byte
	if length == H57HashAuto {
		// Default 32 bytes (256-bit) for BLAKE3
		sum := blake3.Sum256(input)
		hashBytes = sum[:]
	} else {
		bits, ok := h57BitsByLength[length]
		if !ok {
			return "", NewInvalidLengthEnumError(int(length))
		}
		requestedBytes := (bits + 7) / 8
		hashBytes = computeHashBLAKE3XOF(input, requestedBytes)
	}

	return Encode(hashBytes), nil
}

// H57Verify verifies that h57String matches H57Hash(input, hashFn, length).
func H57Verify(input []byte, h57String string, length H57Length) bool {
	expected, err := H57Hash(input, length)
	if err != nil {
		return false
	}
	return expected == h57String
}

// H57IsValid checks whether a candidate H57 string is valid per B57 rules.
func H57IsValid(h57String string) bool {
	return IsValid(h57String)
}

// H57IsCanonical checks canonical form using B57 canonical rules.
func H57IsCanonical(h57String string) bool {
	return IsCanonical(h57String)
}

// computeHashBLAKE3XOF computes variable-length BLAKE3 output using its native Sum256/Sum512 functions.
// BLAKE3 supports 256-bit (32-byte) and 512-bit (64-byte) native outputs.
func computeHashBLAKE3XOF(input []byte, outputLen int) []byte {
	if outputLen <= 0 {
		return []byte{}
	}

	// For up to 32 bytes: use blake3.Sum256() (32-byte output)
	if outputLen <= 32 {
		sum := blake3.Sum256(input)
		return sum[:outputLen]
	}

	// For 33-64 bytes: use blake3.Sum512() (64-byte output)
	if outputLen <= 64 {
		sum := blake3.Sum512(input)
		return sum[:outputLen]
	}

	// For > 64 bytes: extend using deterministic counter-based chaining
	// This maintains cryptographic properties for arbitrary lengths
	output := make([]byte, outputLen)

	// First 64 bytes: standard BLAKE3 512-bit
	sum512 := blake3.Sum512(input)
	copy(output[:64], sum512[:])

	// For additional bytes beyond 64, use counter-based extension
	blockNum := 1
	for i := 64; i < outputLen; {
		h := blake3.New(0, nil)
		h.Write(input)
		h.Write([]byte{byte(blockNum)})
		sum := blake3.Sum256(h.Sum(nil))

		chunkSize := 32
		if i+chunkSize > outputLen {
			chunkSize = outputLen - i
		}
		copy(output[i:i+chunkSize], sum[:chunkSize])

		i += chunkSize
		blockNum++
	}

	return output[:outputLen]
}

// selectEffectiveHashBytes applies truncation rules per spec section 8.
// Returns the appropriate byte slice based on length enum, or error if insufficient entropy.
func selectEffectiveHashBytes(hashBytes []byte, length H57Length) ([]byte, error) {
	if length == H57HashAuto {
		return hashBytes, nil
	}

	bits, ok := h57BitsByLength[length]
	if !ok {
		return nil, NewInvalidLengthEnumError(int(length))
	}

	requestedBytes := (bits + 7) / 8
	if requestedBytes > len(hashBytes) {
		return nil, NewEntropyExceededError(requestedBytes, len(hashBytes))
	}

	// Prefix truncation per spec guidance (section 8).
	return hashBytes[:requestedBytes], nil
}
