package b57

type HashFunction string

const (
	HashBLAKE3 HashFunction = "blake3"
	HashSHA256 HashFunction = "sha256"
	HashSHA512 HashFunction = "sha512"
)
