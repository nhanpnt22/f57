package main

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"os"

	b57 "github.com/aco/b57"
)

const datasetSize = 10000

type parityRecord struct {
	Index                   int    `json:"index"`
	InputHex                string `json:"inputHex"`
	B57Encode               string `json:"b57Encode"`
	B57DecodeHex            string `json:"b57DecodeHex"`
	B57IsValid              bool   `json:"b57IsValid"`
	B57IsCanonical          bool   `json:"b57IsCanonical"`
	B57EncodedLength        int    `json:"b57EncodedLength"`
	B57DecodedLength        int    `json:"b57DecodedLength"`
	H57Blake3Len128         string `json:"h57Blake3Len128"`
	H57SHA256Len128         string `json:"h57Sha256Len128"`
	H57SHA512Len128         string `json:"h57Sha512Len128"`
	H57Blake3Auto           string `json:"h57Blake3Auto"`
	ID57Default             string `json:"id57Default"`
	ID57Len47SHA256         string `json:"id57Len47Sha256"`
	ID57Len70Blake3         string `json:"id57Len70Blake3"`
	ID57ShortDefault        string `json:"id57ShortDefault"`
	ID57ShortLen23          string `json:"id57ShortLen23"`
	I57Encode               string `json:"i57Encode"`
	I57DecodeHex            string `json:"i57DecodeHex"`
	I57HashBlake3Len128     string `json:"i57HashBlake3Len128"`
	I57IDDefault            string `json:"i57IdDefault"`
	I57IsValid              bool   `json:"i57IsValid"`
	I57IsCanonical          bool   `json:"i57IsCanonical"`
	I57ValidateIdentifier   bool   `json:"i57ValidateIdentifier"`
	I57ValidateEntropy      bool   `json:"i57ValidateEntropy"`
	R57IsValidOnI57ID       bool   `json:"r57IsValidOnI57Id"`
	R57IsCanonicalOnI57ID   bool   `json:"r57IsCanonicalOnI57Id"`
	ID57VerifyDefault       bool   `json:"id57VerifyDefault"`
	ID57ShortVerifyDefault  bool   `json:"id57ShortVerifyDefault"`
	H57VerifyBlake3Len128   bool   `json:"h57VerifyBlake3Len128"`
	I57ValidateIdentifierID bool   `json:"i57ValidateIdentifierId"`
}

func main() {
	records := make([]parityRecord, datasetSize)
	for i := 0; i < datasetSize; i++ {
		rec, err := buildRecord(i)
		if err != nil {
			fmt.Fprintf(os.Stderr, "failed building record %d: %v\n", i, err)
			os.Exit(1)
		}
		records[i] = rec
	}

	enc := json.NewEncoder(os.Stdout)
	if err := enc.Encode(records); err != nil {
		fmt.Fprintf(os.Stderr, "failed encoding JSON: %v\n", err)
		os.Exit(1)
	}
}

func buildRecord(i int) (parityRecord, error) {
	input := datasetAt(i)

	b57Encoded := b57.Encode(input)
	b57Decoded, err := b57.Decode(b57Encoded)
	if err != nil {
		return parityRecord{}, err
	}

	h57Blake3Len128, err := b57.H57Hash(input, b57.H57Len128)
	if err != nil {
		return parityRecord{}, err
	}
	h57SHA256Len128, err := b57.H57Hash(input, b57.H57Len128)
	if err != nil {
		return parityRecord{}, err
	}
	h57SHA512Len128, err := b57.H57Hash(input, b57.H57Len128)
	if err != nil {
		return parityRecord{}, err
	}
	h57Blake3Auto, err := b57.H57Hash(input, b57.H57HashAuto)
	if err != nil {
		return parityRecord{}, err
	}

	id57Default, err := b57.ID57GenerateDefault(input)
	if err != nil {
		return parityRecord{}, err
	}
	id57Len47SHA256, err := b57.ID57Generate(input, b57.ID57Len47)
	if err != nil {
		return parityRecord{}, err
	}
	id57Len70Blake3, err := b57.ID57Generate(input, b57.ID57Len70)
	if err != nil {
		return parityRecord{}, err
	}
	id57ShortDefault, err := b57.ID57ShortGenerateDefault(input)
	if err != nil {
		return parityRecord{}, err
	}
	id57ShortLen23, err := b57.ID57ShortGenerate(input, b57.ID57ShortLen23)
	if err != nil {
		return parityRecord{}, err
	}

	i57Encoded := b57.I57Encode(input)
	i57Decoded, err := b57.I57Decode(i57Encoded)
	if err != nil {
		return parityRecord{}, err
	}
	i57HashBlake3Len128, err := b57.I57Hash(input, b57.H57Len128)
	if err != nil {
		return parityRecord{}, err
	}
	i57IDDefault, err := b57.I57Id(input, b57.ID57Default)
	if err != nil {
		return parityRecord{}, err
	}

	rec := parityRecord{
		Index:                   i,
		InputHex:                hex.EncodeToString(input),
		B57Encode:               b57Encoded,
		B57DecodeHex:            hex.EncodeToString(b57Decoded),
		B57IsValid:              b57.IsValid(b57Encoded),
		B57IsCanonical:          b57.IsCanonical(b57Encoded),
		B57EncodedLength:        b57.EncodedLength(len(input)),
		B57DecodedLength:        b57.DecodedLength(len(b57Encoded)),
		H57Blake3Len128:         h57Blake3Len128,
		H57SHA256Len128:         h57SHA256Len128,
		H57SHA512Len128:         h57SHA512Len128,
		H57Blake3Auto:           h57Blake3Auto,
		ID57Default:             id57Default,
		ID57Len47SHA256:         id57Len47SHA256,
		ID57Len70Blake3:         id57Len70Blake3,
		ID57ShortDefault:        id57ShortDefault,
		ID57ShortLen23:          id57ShortLen23,
		I57Encode:               i57Encoded,
		I57DecodeHex:            hex.EncodeToString(i57Decoded),
		I57HashBlake3Len128:     i57HashBlake3Len128,
		I57IDDefault:            i57IDDefault,
		I57IsValid:              b57.I57IsValid(i57Encoded),
		I57IsCanonical:          b57.I57IsCanonical(i57Encoded),
		I57ValidateIdentifier:   b57.I57ValidateIdentifier(i57IDDefault),
		I57ValidateEntropy:      b57.I57ValidateEntropy(i57IDDefault),
		R57IsValidOnI57ID:       b57.R57IsValid(i57IDDefault),
		R57IsCanonicalOnI57ID:   b57.R57IsCanonical(i57IDDefault),
		ID57VerifyDefault:       b57.ID57VerifyDefault(input, id57Default),
		ID57ShortVerifyDefault:  b57.ID57ShortVerifyDefault(input, id57ShortDefault),
		H57VerifyBlake3Len128:   b57.H57Verify(input, h57Blake3Len128, b57.H57Len128),
		I57ValidateIdentifierID: b57.I57ValidateIdentifier(i57IDDefault),
	}

	return rec, nil
}

func datasetAt(i int) []byte {
	seed := sha256.Sum256([]byte(fmt.Sprintf("cross-language-dataset-%d", i)))

	length := i % 65
	if i%10 == 0 {
		length = 0
	}

	data := make([]byte, length)
	for j := 0; j < length; j++ {
		data[j] = seed[(j+i)%len(seed)] ^ byte((j*31+i)%256)
	}

	if length > 0 && i%7 == 0 {
		data[0] = 0
	}
	if length > 1 && i%11 == 0 {
		data[1] = 0
	}

	return data
}
