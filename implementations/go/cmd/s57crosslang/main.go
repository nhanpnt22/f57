package main

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"os"
	"strconv"

	b57 "github.com/aco/b57"
)

const defaultDatasetSize = 1000

type Output struct {
	DatasetSize int      `json:"datasetSize"`
	Hashes      []string `json:"hashes"`
}

func main() {
	datasetSize := datasetSizeFromEnv(defaultDatasetSize)
	s, err := b57.NewS57(b57.S57Config{
		ServerSecretKey: []byte("S57_SERVER_SECRET_KEY_MUST_BE_LONG_1234567890"),
		EnvironmentSalt: []byte("prod-v1"),
		KeyID:           7,
	})
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}

	hashes := make([]string, 0, datasetSize)
	for i := 0; i < datasetSize; i++ {
		input := datasetAt(i)
		inputHex := hex.EncodeToString(input)

		h, err := s.Hash(input, b57.H57Len256)
		if err != nil {
			fmt.Fprintln(os.Stderr, err)
			os.Exit(1)
		}
		id128, err := s.ID(input, b57.ID57Default)
		if err != nil {
			fmt.Fprintln(os.Stderr, err)
			os.Exit(1)
		}
		id256, err := s.ID(input, b57.ID57Len256)
		if err != nil {
			fmt.Fprintln(os.Stderr, err)
			os.Exit(1)
		}
		id512, err := s.ID(input, b57.ID57Len512)
		if err != nil {
			fmt.Fprintln(os.Stderr, err)
			os.Exit(1)
		}
		rd, err := s.RandomDerived([]byte("master-secret"), []byte(fmt.Sprintf("u-%d", i)))
		if err != nil {
			fmt.Fprintln(os.Stderr, err)
			os.Exit(1)
		}

		row := fmt.Sprintf("%d|%s|%s|%s|%s|%s|%s", i, inputHex, h, id128, id256, id512, rd)
		sum := sha256.Sum256([]byte(row))
		hashes = append(hashes, hex.EncodeToString(sum[:]))
	}

	_ = json.NewEncoder(os.Stdout).Encode(Output{DatasetSize: datasetSize, Hashes: hashes})
}

func datasetSizeFromEnv(defaultValue int) int {
	value := os.Getenv("DATASET_SIZE")
	if value == "" {
		return defaultValue
	}
	parsed, err := strconv.Atoi(value)
	if err != nil || parsed <= 0 {
		return defaultValue
	}
	return parsed
}

func datasetAt(index int) []byte {
	seed := sha256.Sum256([]byte(fmt.Sprintf("cross-language-dataset-%d", index)))
	length := index % 65
	if index%10 == 0 {
		length = 0
	}

	out := make([]byte, length)
	for j := 0; j < length; j++ {
		out[j] = seed[(j+index)%len(seed)] ^ byte((j*31+index)&0xff)
	}
	if length > 0 && index%7 == 0 {
		out[0] = 0
	}
	if length > 1 && index%11 == 0 {
		out[1] = 0
	}
	return out
}
