package main

import (
	"fmt"
	b57 "github.com/aco/b57"
)

func main() {
	// Generate test vectors
	testCases := []struct {
		name  string
		bytes []byte
	}{
		{"zero", []byte{0x00}},
		{"one", []byte{0x01}},
		{"two", []byte{0x02}},
		{"max_uint8", []byte{0xFF}},
		{"two_zeros", []byte{0x00, 0x00}},
		{"zero_one", []byte{0x00, 0x01}},
		{"one_zero", []byte{0x01, 0x00}},
		{"0x0102", []byte{0x01, 0x02}},
		{"all_ff_4bytes", []byte{0xFF, 0xFF, 0xFF, 0xFF}},
		{"sequence_01020304", []byte{0x01, 0x02, 0x03, 0x04}},
		{"empty", []byte{}},
	}

	for _, tc := range testCases {
		encoded := b57.Encode(tc.bytes)
		fmt.Printf("{\"%s\", []byte{", tc.name)
		for i, b := range tc.bytes {
			if i > 0 {
				fmt.Printf(", ")
			}
			fmt.Printf("0x%02X", b)
		}
		fmt.Printf("}, \"%s\"},\n", encoded)
	}
}
