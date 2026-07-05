package b57

// ID57Length represents controlled ID57 output length modes.
//
// The SIGN of the value selects the generation mode (id57-core-api.txt
// section 5.1/7):
//
//   - length_enum == ID57Default (0): resolves to ID57Len128.
//   - length_enum  > 0: BIT-LENGTH mode (7.1). Character width is a
//     [min_chars, max_chars] BOUND, never a fixed count, because B57 is
//     a bignum-style positional encoding.
//   - length_enum  < 0: FIXED-WIDTH mode (7.2). The magnitude is the
//     EXACT output character count, produced by cutting the ID57Len128
//     output to that many characters (5.2).
type ID57Length int

const (
	// ID57Default resolves to ID57Len128 as the required default behavior.
	ID57Default ID57Length = 0

	// Security lengths (7.1) - BIT-LENGTH mode. Character width is a
	// [min_chars, max_chars] bound; see ID57Range.
	ID57Len8   ID57Length = 8
	ID57Len16  ID57Length = 16
	ID57Len32  ID57Length = 32
	ID57Len64  ID57Length = 64
	ID57Len128 ID57Length = 128
	ID57Len256 ID57Length = 256
	ID57Len512 ID57Length = 512

	// Fixed lengths (7.2) - FIXED-WIDTH mode, NON-SECURITY. The magnitude
	// of the value is the exact output character count, always. Produced
	// by cutting the ID57Len128 output to the first k characters (5.2).
	ID57Fixed2  ID57Length = -2
	ID57Fixed3  ID57Length = -3
	ID57Fixed4  ID57Length = -4
	ID57Fixed5  ID57Length = -5
	ID57Fixed6  ID57Length = -6
	ID57Fixed7  ID57Length = -7
	ID57Fixed8  ID57Length = -8
	ID57Fixed9  ID57Length = -9
	ID57Fixed10 ID57Length = -10
	ID57Fixed11 ID57Length = -11
	ID57Fixed12 ID57Length = -12
)

// id57BitsByLength maps every defined BIT-LENGTH (positive) ID57Length to
// its bit width. Fixed (negative) lengths are handled separately since
// their "width" is a character count, not a bit count.
var id57BitsByLength = map[ID57Length]int{
	ID57Len8:   8,
	ID57Len16:  16,
	ID57Len32:  32,
	ID57Len64:  64,
	ID57Len128: 128,
	ID57Len256: 256,
	ID57Len512: 512,
}

// id57MinFixedWidth and id57MaxFixedWidth bound the defined FIXED_k set
// (7.2): all magnitudes 2..12 are defined, with no gaps.
const (
	id57MinFixedWidth = 2
	id57MaxFixedWidth = 12
)

// ID57Generate constructs canonical ID57 representation via one-way transformation:
// HASH(input) -> byte-level prefix truncation -> B57 encoding (BIT-LENGTH mode,
// length_enum > 0), or via cutting the ID57Len128 output to an exact character
// count (FIXED-WIDTH mode, length_enum < 0). See id57-core-api.txt 5.1/5.2.
func ID57Generate(input []byte, length ID57Length) (string, error) {
	effectiveLength, err := resolveID57Length(length)
	if err != nil {
		return "", err
	}

	if effectiveLength < 0 {
		k := int(-effectiveLength)
		full, err := ID57Generate(input, ID57Len128)
		if err != nil {
			return "", err
		}
		return full[:k], nil
	}

	bits := id57BitsByLength[effectiveLength]
	requestedBytes := (bits + 7) / 8

	hashBytes := computeHashBLAKE3XOF(input, requestedBytes)
	effective := make([]byte, requestedBytes)
	copy(effective, hashBytes[:requestedBytes])
	maskExcessBits(effective, bits)

	return Encode(effective), nil
}

// ID57GenerateDefault constructs canonical ID57 using HashBLAKE3 + ID57Default (ID57Len128).
func ID57GenerateDefault(input []byte) (string, error) {
	return ID57Generate(input, ID57Default)
}

// ID57Verify verifies that id57String matches ID57Generate(input, length).
func ID57Verify(input []byte, id57String string, length ID57Length) bool {
	expected, err := ID57Generate(input, length)
	if err != nil {
		return false
	}
	return expected == id57String
}

// ID57VerifyDefault verifies that id57String matches ID57GenerateDefault(input).
func ID57VerifyDefault(input []byte, id57String string) bool {
	return ID57Verify(input, id57String, ID57Default)
}

// ID57IsValid checks whether a candidate ID57 string is valid per B57 rules.
func ID57IsValid(id57String string) bool {
	return IsValid(id57String)
}

// ID57IsCanonical checks canonical form using B57 canonical rules.
//
// This applies only to BIT-LENGTH (positive length_enum) outputs.
// FIXED-WIDTH outputs (7.2) are prefixes of a bignum encoding, not
// canonical B57 values, and MUST NOT be checked with this function
// (see ID57IsLength instead).
func ID57IsCanonical(id57String string) bool {
	return IsCanonical(id57String)
}

// ID57Range returns the (min_chars, max_chars) character bounds for a
// given length_enum (id57-core-api.txt 11.4).
//
//   - length_enum > 0 (BIT LENGTH): returns [byte_length, b57_encoded_length]
//     as a genuine bound; the two values may differ.
//   - length_enum < 0 (FIXED WIDTH): returns (k, k); min == max.
func ID57Range(length ID57Length) (minChars int, maxChars int, err error) {
	effective, err := resolveID57Length(length)
	if err != nil {
		return 0, 0, err
	}

	if effective < 0 {
		k := int(-effective)
		return k, k, nil
	}

	bits := id57BitsByLength[effective]
	byteLength := (bits + 7) / 8
	return byteLength, EncodedLength(byteLength), nil
}

// ID57IsLength reports whether id57String is a valid FIXED-WIDTH (7.2)
// ID57 output for length_enum.
//
// id57_is_length (11.5) is defined ONLY for fixed widths (negative
// length_enum); it is not a general bit-length validator. Fixed-width
// outputs are prefixes of a bignum encoding, not canonical B57, so they
// are validated by exact width + alphabet - never by decoding. Calling
// this with a non-negative length_enum (a bit length or DEFAULT) raises
// INVALID_LENGTH_ENUM; for bit lengths, use ID57Range for the bound and
// ID57IsCanonical / ID57Verify for validation instead.
func ID57IsLength(id57String string, length ID57Length) (bool, error) {
	effective, err := resolveID57Length(length)
	if err != nil {
		return false, err
	}

	if effective >= 0 {
		return false, NewInvalidLengthEnumError(int(length))
	}

	k := int(-effective)
	if len(id57String) != k {
		return false, nil
	}
	if !ID57IsValid(id57String) {
		return false, nil
	}
	return true, nil
}

func resolveID57Length(length ID57Length) (ID57Length, error) {
	if length == ID57Default {
		return ID57Len128, nil
	}

	if length < 0 {
		k := int(-length)
		if k < id57MinFixedWidth || k > id57MaxFixedWidth {
			return 0, NewInvalidLengthEnumError(int(length))
		}
		return length, nil
	}

	if _, ok := id57BitsByLength[length]; !ok {
		return 0, NewInvalidLengthEnumError(int(length))
	}

	return length, nil
}

func maskExcessBits(b []byte, bitLength int) {
	if len(b) == 0 {
		return
	}

	excessBits := len(b)*8 - bitLength
	if excessBits <= 0 {
		return
	}

	mask := byte(0xFF << excessBits)
	b[len(b)-1] &= mask
}
