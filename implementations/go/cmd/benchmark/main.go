package main

import (
	"fmt"
	"time"

	b57 "github.com/aco/b57"
)

func main() {
	const iterations = 100000
	data := make([]byte, 32)
	encodedStrs := make([]string, iterations)

	// Benchmark Encode
	start := time.Now()
	for i := 0; i < iterations; i++ {
		data[0] = byte(i)
		data[1] = byte(i >> 8)
		encodedStrs[i] = b57.Encode(data)
	}
	encodeDuration := time.Since(start).Milliseconds()

	// Benchmark Decode
	start = time.Now()
	for i := 0; i < iterations; i++ {
		_, _ = b57.Decode(encodedStrs[i])
	}
	decodeDuration := time.Since(start).Milliseconds()

	// Benchmark ID57
	start = time.Now()
	for i := 0; i < iterations; i++ {
		data[0] = byte(i)
		data[1] = byte(i >> 8)
		_, _ = b57.ID57GenerateDefault(data)
	}
	idDuration := time.Since(start).Milliseconds()

	fmt.Printf("{\"language\": \"Go\", \"encode_ms\": %d, \"decode_ms\": %d, \"id57_ms\": %d, \"iterations\": %d}\n", encodeDuration, decodeDuration, idDuration, iterations)
}
