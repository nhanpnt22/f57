# R57 Go Implementation

This implements the R57 (Random → B57 Canonical Representation Interface) v0.1.0 FINAL specification.

## Overview
R57 Core API defines a minimal, secure interface for generating ≥128-bit entropy identifiers encoded in canonical B57 format.

## Features
- Provides `R57Generate` to generate a 22-character canonical B57 string from exactly 128-bits of entropy.
- Supports all declared mode enums and derives 128-bit raw values per mode-specific logic.
- Uses Go's `crypto/rand` as the secure entropy source.
- Includes functions for validation and canonical checks: `R57IsValid` and `R57IsCanonical`.

## Modes
- `R57ModeCSPRNG`
- `R57ModeHashEntropy`
- `R57ModeKDFDerived`
- `R57ModeCounterKDF`
- `R57ModeTimestampKDF`
- `R57ModeHardwareRNG`
- `R57ModeUUIDv4Compat`
- `R57ModeHybridEntropy`

Only unknown enum values return `ErrInvalidMode`.

## Usage
```go
package main

import (
	"fmt"
	"github.com/aco/f57"
)

func main() {
	id, err := b57.R57Generate(b57.R57ModeCSPRNG)
	if err != nil {
		panic(err)
	}
	fmt.Println("New R57 ID:", id)
	fmt.Println("Is Valid?", b57.R57IsValid(id))
}
```
