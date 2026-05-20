package b57

// ID57Length represents controlled ID57 output length modes.
type ID57Length int

const (
	// ID57Default resolves to ID57Len128 as the required default behavior.
	ID57Default ID57Length = 0

	// Security thresholds.
	ID57Len8   ID57Length = 8
	ID57Len16  ID57Length = 16
	ID57Len23  ID57Length = 23
	ID57Len29  ID57Length = 29
	ID57Len32  ID57Length = 32
	ID57Len47  ID57Length = 47
	ID57Len64  ID57Length = 64
	ID57Len70  ID57Length = 70
	ID57Len93  ID57Length = 93
	ID57Len128 ID57Length = 128
	ID57Len186 ID57Length = 186
	ID57Len256 ID57Length = 256
	ID57Len373 ID57Length = 373
	ID57Len512 ID57Length = 512
)

var id57BitsByLength = map[ID57Length]int{
	ID57Len8:   8,
	ID57Len16:  16,
	ID57Len23:  23,
	ID57Len29:  29,
	ID57Len32:  32,
	ID57Len47:  47,
	ID57Len64:  64,
	ID57Len70:  70,
	ID57Len93:  93,
	ID57Len128: 128,
	ID57Len186: 186,
	ID57Len256: 256,
	ID57Len373: 373,
	ID57Len512: 512,
}

// ID57Generate constructs canonical ID57 representation via one-way transformation:
// HASH(input) -> byte-level prefix truncation -> B57 encoding.
func ID57Generate(input []byte, length ID57Length) (string, error) {
	effectiveLength, err := resolveID57Length(length)
	if err != nil {
		return "", err
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

// ID57Verify verifies that id57String matches ID57Generate(input, hashFn, length).
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
func ID57IsCanonical(id57String string) bool {
	return IsCanonical(id57String)
}

func resolveID57Length(length ID57Length) (ID57Length, error) {
	if length == ID57Default {
		return ID57Len128, nil
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
