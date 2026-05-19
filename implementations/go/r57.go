package b57

import (
	"crypto/rand"
	"encoding/binary"
	"errors"
	"sync"
	"sync/atomic"
	"time"

	"lukechampine.com/blake3"
)

var randRead = rand.Read

var r57Counter atomic.Uint32

var (
	r57SessionSecretOnce sync.Once
	r57SessionSecret     [32]byte
	r57SessionSecretErr  error

	r57DeviceSecretOnce sync.Once
	r57DeviceSecret     [32]byte
	r57DeviceSecretErr  error

	r57MasterSecretOnce sync.Once
	r57MasterSecret     [32]byte
	r57MasterSecretErr  error
)

// R57Mode defines the random generation mode for R57 identifiers.
type R57Mode int

const (
	// R57ModeCSPRNG is the default mode, generating 128-bit entropy via CSPRNG.
	R57ModeCSPRNG R57Mode = 1
	// R57ModeHashEntropy generates deterministic randomness from high-entropy source.
	R57ModeHashEntropy R57Mode = 2
	// R57ModeKDFDerived generates deterministic randomness via KDF.
	R57ModeKDFDerived R57Mode = 3
	// R57ModeCounterKDF generates sequence randomness via KDF and counter.
	R57ModeCounterKDF R57Mode = 4
	// R57ModeTimestampKDF generates time-bound randomness via KDF.
	R57ModeTimestampKDF R57Mode = 5
	// R57ModeHardwareRNG generates randomness from a hardware source.
	R57ModeHardwareRNG R57Mode = 6
	// R57ModeUUIDv4Compat provides UUIDv4 compatibility.
	R57ModeUUIDv4Compat R57Mode = 7
	// R57ModeHybridEntropy generates randomness mixing multiple sources.
	R57ModeHybridEntropy R57Mode = 8
)

// R57Generate creates a new R57 identifier using the specified mode.
// It generates exactly 128-bit entropy and returns a 22-character B57 string.
func R57Generate(mode R57Mode) (string, error) {
	raw, err := generateR57Entropy(mode)
	if err != nil {
		return "", err
	}
	return encodeR57128(raw), nil
}

func generateR57Entropy(mode R57Mode) ([]byte, error) {
	switch mode {
	case R57ModeCSPRNG:
		return readEntropyBytes(16)
	case R57ModeHashEntropy:
		return generateHashEntropy()
	case R57ModeKDFDerived:
		return generateKDFDerivedEntropy()
	case R57ModeCounterKDF:
		return generateCounterKDFEntropy()
	case R57ModeTimestampKDF:
		return generateTimestampKDFEntropy()
	case R57ModeHardwareRNG:
		// No hardware-specific source is exposed here; fall back to the system CSPRNG.
		return readEntropyBytes(16)
	case R57ModeUUIDv4Compat:
		return generateUUIDv4CompatEntropy()
	case R57ModeHybridEntropy:
		return generateHybridEntropy()
	default:
		return nil, NewInvalidModeError(int(mode))
	}
}

func generateHashEntropy() ([]byte, error) {
	seed, err := readEntropyBytes(16)
	if err != nil {
		return nil, err
	}
	return mixEntropy128(seed), nil
}

func generateKDFDerivedEntropy() ([]byte, error) {
	context, err := readEntropyBytes(16)
	if err != nil {
		return nil, err
	}
	secret, err := r57GetSecret(&r57MasterSecretOnce, &r57MasterSecret, &r57MasterSecretErr)
	if err != nil {
		return nil, err
	}
	return mixEntropy128(secret, context), nil
}

func generateCounterKDFEntropy() ([]byte, error) {
	randomComponent, err := readEntropyBytes(12)
	if err != nil {
		return nil, err
	}
	counter := make([]byte, 4)
	binary.BigEndian.PutUint32(counter, r57Counter.Add(1))
	return mixEntropy128(counter, randomComponent), nil
}

func generateTimestampKDFEntropy() ([]byte, error) {
	randomComponent, err := readEntropyBytes(12)
	if err != nil {
		return nil, err
	}
	timestamp := make([]byte, 4)
	binary.BigEndian.PutUint32(timestamp, uint32(time.Now().Unix()/60))
	secret, err := r57GetSecret(&r57DeviceSecretOnce, &r57DeviceSecret, &r57DeviceSecretErr)
	if err != nil {
		return nil, err
	}
	return mixEntropy128(secret, timestamp, randomComponent), nil
}

func generateUUIDv4CompatEntropy() ([]byte, error) {
	raw, err := readEntropyBytes(16)
	if err != nil {
		return nil, err
	}
	raw[6] = (raw[6] & 0x0F) | 0x40
	raw[8] = (raw[8] & 0x3F) | 0x80
	return raw, nil
}

func generateHybridEntropy() ([]byte, error) {
	seed, err := readEntropyBytes(16)
	if err != nil {
		return nil, err
	}
	counter := make([]byte, 4)
	binary.BigEndian.PutUint32(counter, r57Counter.Add(1))
	timestamp := make([]byte, 8)
	binary.BigEndian.PutUint64(timestamp, uint64(time.Now().UnixNano()))
	secret, err := r57GetSecret(&r57SessionSecretOnce, &r57SessionSecret, &r57SessionSecretErr)
	if err != nil {
		return nil, err
	}
	return mixEntropy128(seed, counter, timestamp, secret), nil
}

func readEntropyBytes(length int) ([]byte, error) {
	buf := make([]byte, length)
	n, err := randRead(buf)
	if err != nil {
		return nil, err
	}
	if n != length {
		return nil, errors.New("failed to read 16 bytes of entropy")
	}
	return buf, nil
}

func r57GetSecret(once *sync.Once, target *[32]byte, targetErr *error) ([]byte, error) {
	once.Do(func() {
		buf, err := readEntropyBytes(len(target))
		if err != nil {
			*targetErr = err
			return
		}
		copy(target[:], buf)
	})
	if *targetErr != nil {
		return nil, *targetErr
	}
	return target[:], nil
}

func mixEntropy128(parts ...[]byte) []byte {
	hasher := blake3.New(32, nil)
	for _, part := range parts {
		_, _ = hasher.Write(part)
	}
	sum := hasher.Sum(nil)
	return append([]byte(nil), sum[:16]...)
}

func encodeR57128(raw []byte) string {
	encoded := Encode(raw)
	if len(encoded) == 22 {
		return encoded
	}

	derived := append([]byte(nil), raw...)
	for len(encoded) < 22 {
		derived = mixEntropy128(derived, []byte{0x57})
		encoded = Encode(derived)
	}
	return encoded
}

// R57IsValid checks if the provided string is a valid R57 identifier
// (length 22 and contains only valid B57 characters).
func R57IsValid(s string) bool {
	if len(s) != 22 {
		return false
	}
	return IsValid(s)
}

// R57IsCanonical verifies if the output string is canonical according to R57 and B57.
func R57IsCanonical(s string) bool {
	if len(s) != 22 {
		return false
	}
	return IsCanonical(s)
}
