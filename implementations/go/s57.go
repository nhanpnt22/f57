package b57

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/binary"
	"time"

	"lukechampine.com/blake3"
)

const (
	S57Version byte = 0x01
)

var s57EntropyReader = s57ReadEntropyBytes

// S57Keys holds derived domain-separated keys.
type S57Keys struct {
	B57AES256Key []byte
	H57Key       []byte
	ID57Key      []byte
	KeyID        byte
}

// S57Config configures S57 secure composition.
type S57Config struct {
	ServerSecretKey []byte
	EnvironmentSalt []byte
	KeyID           byte
}

// S57 provides secure composition APIs over B57/H57/ID57/R57.
type S57 struct {
	serverSecret []byte
	envSalt      []byte
	keys         S57Keys
}

// NewS57 constructs an S57 instance and derives domain-separated keys.
func NewS57(config S57Config) (*S57, error) {
	if len(config.ServerSecretKey) < 32 {
		return nil, NewKeyInvalidError()
	}
	if len(config.EnvironmentSalt) == 0 {
		return nil, NewKeyInvalidError()
	}

	s := &S57{
		serverSecret: append([]byte(nil), config.ServerSecretKey...),
		envSalt:      append([]byte(nil), config.EnvironmentSalt...),
	}
	if config.KeyID == 0 {
		config.KeyID = 1
	}

	keys, err := s.ResolveKeys(config.KeyID)
	if err != nil {
		return nil, err
	}
	s.keys = keys
	return s, nil
}

// ResolveKeys derives B57_AES_256_KEY, H57_KEY and ID57_KEY.
func (s *S57) ResolveKeys(keyID byte) (S57Keys, error) {
	seed := append(append([]byte(nil), s.serverSecret...), s.envSalt...)
	if len(seed) < 32 {
		return S57Keys{}, NewKeyInvalidError()
	}

	b57AES := make([]byte, 32)
	h57Key := make([]byte, 32)
	id57Key := make([]byte, 32)

	blake3.DeriveKey(b57AES, "S57/B57_AES_256/v1", seed)
	blake3.DeriveKey(h57Key, "S57/H57_KEY/v1", seed)
	blake3.DeriveKey(id57Key, "S57/ID57_KEY/v1", seed)

	return S57Keys{
		B57AES256Key: b57AES,
		H57Key:       h57Key,
		ID57Key:      id57Key,
		KeyID:        keyID,
	}, nil
}

// Hash computes keyed H57 with S57 profile lengths (128, 256, 512).
func (s *S57) Hash(data []byte, length H57Length) (string, error) {
	bits, err := s.resolveS57H57Bits(length)
	if err != nil {
		return "", err
	}

	requested := (bits + 7) / 8
	digest := blake3.New(requested, s.keys.H57Key)
	_, _ = digest.Write(data)
	out := digest.Sum(nil)
	return Encode(out), nil
}

// ID computes keyed ID57 with S57 profile lengths (128, 256, 512).
func (s *S57) ID(data []byte, length ID57Length) (string, error) {
	b, ok := id57BitsByLength[length]
	if !ok {
		if length == ID57Default {
			b = 128
		} else {
			return "", NewInvalidLengthEnumError(int(length))
		}
	}
	if b != 128 && b != 256 && b != 512 {
		return "", NewInvalidLengthEnumError(int(length))
	}

	requested := (b + 7) / 8
	digest := blake3.New(requested, s.keys.ID57Key)
	_, _ = digest.Write(data)
	out := digest.Sum(nil)
	maskExcessBits(out, b)
	return Encode(out), nil
}

// Random returns CSPRNG-based 128-bit random identifier.
func (s *S57) Random() (string, error) {
	raw, err := s57EntropyReader(16)
	if err != nil {
		return "", NewInsufficientEntropyError()
	}
	return encodeR57128(raw), nil
}

// RandomTime mixes coarse timestamp with randomness.
func (s *S57) RandomTime() (string, error) {
	r, err := s57EntropyReader(12)
	if err != nil {
		return "", NewInsufficientEntropyError()
	}
	t := make([]byte, 4)
	binary.BigEndian.PutUint32(t, uint32(time.Now().Unix()))
	m := blake3.Sum256(append(t, r...))
	return encodeR57128(m[:16]), nil
}

// RandomCounter mixes user counter with randomness.
func (s *S57) RandomCounter(counter uint32) (string, error) {
	r, err := s57EntropyReader(12)
	if err != nil {
		return "", NewInsufficientEntropyError()
	}
	c := make([]byte, 4)
	binary.BigEndian.PutUint32(c, counter)
	m := blake3.Sum256(append(c, r...))
	return encodeR57128(m[:16]), nil
}

// RandomSession uses keyed derivation based on session secret and nonce.
func (s *S57) RandomSession(sessionSecret []byte) (string, error) {
	nonce, err := s57EntropyReader(16)
	if err != nil {
		return "", NewInsufficientEntropyError()
	}
	key := make([]byte, 32)
	blake3.DeriveKey(key, "S57/R57_SESSION/v1", sessionSecret)
	h := blake3.New(16, key)
	_, _ = h.Write(nonce)
	return encodeR57128(h.Sum(nil)), nil
}

// RandomDevice uses keyed derivation based on device secret and nonce.
func (s *S57) RandomDevice(deviceSecret []byte) (string, error) {
	nonce, err := s57EntropyReader(16)
	if err != nil {
		return "", NewInsufficientEntropyError()
	}
	key := make([]byte, 32)
	blake3.DeriveKey(key, "S57/R57_DEVICE/v1", deviceSecret)
	h := blake3.New(16, key)
	_, _ = h.Write(nonce)
	return encodeR57128(h.Sum(nil)), nil
}

// RandomDerived is deterministic for identical (masterSecret, uniqueInput).
func (s *S57) RandomDerived(masterSecret, uniqueInput []byte) (string, error) {
	key := make([]byte, 32)
	blake3.DeriveKey(key, "S57/R57_DERIVED/v1", masterSecret)
	h := blake3.New(16, key)
	_, _ = h.Write(uniqueInput)
	return encodeR57128(h.Sum(nil)), nil
}

// RandomHardened re-hashes CSPRNG output.
func (s *S57) RandomHardened() (string, error) {
	raw, err := s57EntropyReader(16)
	if err != nil {
		return "", NewInsufficientEntropyError()
	}
	m := blake3.Sum256(raw)
	return encodeR57128(m[:16]), nil
}

// RandomHybrid mixes one or more entropy sources.
func (s *S57) RandomHybrid(sources ...[]byte) (string, error) {
	if len(sources) == 0 {
		return "", NewInvalidInputError("random_hybrid requires at least one source")
	}
	total := 0
	for _, src := range sources {
		total += len(src)
	}
	buf := make([]byte, 0, total)
	for _, src := range sources {
		buf = append(buf, src...)
	}
	m := blake3.Sum256(buf)
	return encodeR57128(m[:16]), nil
}

// Encrypt encrypts plaintext with AES-256-GCM envelope encoded in B57.
func (s *S57) Encrypt(plaintext, aad []byte) (string, error) {
	if len(s.keys.B57AES256Key) != 32 {
		return "", NewKeyInvalidError()
	}
	nonce, err := s57EntropyReader(12)
	if err != nil {
		return "", NewInsufficientEntropyError()
	}

	block, err := aes.NewCipher(s.keys.B57AES256Key)
	if err != nil {
		return "", err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	ciphertextWithTag := gcm.Seal(nil, nonce, plaintext, aad)
	env := make([]byte, 0, 2+len(nonce)+len(ciphertextWithTag))
	env = append(env, S57Version)
	env = append(env, s.keys.KeyID)
	env = append(env, nonce...)
	env = append(env, ciphertextWithTag...)

	return Encode(env), nil
}

// Decrypt decrypts a B57-encoded AES-256-GCM envelope.
func (s *S57) Decrypt(b57String string, aad []byte, expectedKeyID ...byte) ([]byte, error) {
	env, err := Decode(b57String)
	if err != nil {
		return nil, err
	}
	if len(env) < 2+12+16 {
		return nil, NewInvalidInputError("invalid envelope length")
	}

	version := env[0]
	if version != S57Version {
		return nil, NewInvalidVersionError(version)
	}

	keyID := env[1]
	if len(expectedKeyID) > 0 && keyID != expectedKeyID[0] {
		return nil, NewKeyUnavailableError(keyID)
	}
	if keyID != s.keys.KeyID {
		return nil, NewKeyUnavailableError(keyID)
	}

	if len(s.keys.B57AES256Key) != 32 {
		return nil, NewKeyUnavailableError(keyID)
	}

	nonce := env[2:14]
	ciphertextWithTag := env[14:]

	block, err := aes.NewCipher(s.keys.B57AES256Key)
	if err != nil {
		return nil, err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	pt, err := gcm.Open(nil, nonce, ciphertextWithTag, aad)
	if err != nil {
		return nil, NewAuthFailureError()
	}
	return pt, nil
}

func (s *S57) resolveS57H57Bits(length H57Length) (int, error) {
	if length == H57HashAuto {
		return 256, nil
	}
	b, ok := h57BitsByLength[length]
	if !ok {
		return 0, NewInvalidLengthEnumError(int(length))
	}
	if b != 128 && b != 256 && b != 512 {
		return 0, NewInvalidLengthEnumError(int(length))
	}
	return b, nil
}

func s57ReadEntropyBytes(length int) ([]byte, error) {
	buf := make([]byte, length)
	_, err := rand.Read(buf)
	if err != nil {
		return nil, err
	}
	return buf, nil
}
