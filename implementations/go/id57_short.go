package b57

// ID57ShortLength represents the constrained ID57-SHORT length profile.
type ID57ShortLength int

const (
	// ID57ShortDefault resolves to ID57ShortLen47 (8-character default).
	ID57ShortDefault ID57ShortLength = 0

	ID57ShortLen23 ID57ShortLength = 23
	ID57ShortLen29 ID57ShortLength = 29
	ID57ShortLen32 ID57ShortLength = 32
	ID57ShortLen47 ID57ShortLength = 47
	ID57ShortLen70 ID57ShortLength = 70
)

var id57ShortToID57Length = map[ID57ShortLength]ID57Length{
	ID57ShortLen23: ID57Len23,
	ID57ShortLen29: ID57Len29,
	ID57ShortLen32: ID57Len32,
	ID57ShortLen47: ID57Len47,
	ID57ShortLen70: ID57Len70,
}

// ID57ShortGenerate constructs canonical ID57-SHORT representation.
//
// Pipeline: HASH(input) -> byte-level prefix truncation -> B57 encoding.
// If hashFn is empty, HashBLAKE3 is used as the default hash function.
func ID57ShortGenerate(input []byte, hashFn HashFunction, length ID57ShortLength) (string, error) {
	effective, err := resolveID57ShortLength(length)
	if err != nil {
		return "", err
	}
	return ID57Generate(input, hashFn, effective)
}

// ID57ShortGenerateDefault constructs canonical ID57-SHORT with
// HashBLAKE3 + ID57ShortDefault (ID57ShortLen47 -> 8 chars).
func ID57ShortGenerateDefault(input []byte) (string, error) {
	return ID57ShortGenerate(input, HashBLAKE3, ID57ShortDefault)
}

// ID57ShortVerify verifies that id57String matches
// ID57ShortGenerate(input, hashFn, length).
func ID57ShortVerify(input []byte, hashFn HashFunction, id57String string, length ID57ShortLength) bool {
	expected, err := ID57ShortGenerate(input, hashFn, length)
	if err != nil {
		return false
	}
	return expected == id57String
}

// ID57ShortVerifyDefault verifies that id57String matches
// ID57ShortGenerateDefault(input).
func ID57ShortVerifyDefault(input []byte, id57String string) bool {
	return ID57ShortVerify(input, HashBLAKE3, id57String, ID57ShortDefault)
}

// ID57ShortIsValid checks whether a candidate ID57-SHORT string is valid per B57 rules.
func ID57ShortIsValid(id57String string) bool {
	return IsValid(id57String)
}

// ID57ShortIsCanonical checks canonical form using B57 canonical rules.
func ID57ShortIsCanonical(id57String string) bool {
	return IsCanonical(id57String)
}

func resolveID57ShortLength(length ID57ShortLength) (ID57Length, error) {
	if length == ID57ShortDefault {
		return ID57Len47, nil
	}

	effective, ok := id57ShortToID57Length[length]
	if !ok {
		return 0, NewInvalidLengthEnumError(int(length))
	}

	return effective, nil
}
