package b57

import "fmt"

// ErrorCode represents the type of B57 error.
type ErrorCode int

const (
	// ErrInvalidChar indicates an invalid character was encountered during decoding.
	ErrInvalidChar ErrorCode = iota
	// ErrNonCanonical indicates the input is not in canonical form.
	ErrNonCanonical
	// ErrInvalidLengthEnum indicates an unsupported H57 length enum.
	ErrInvalidLengthEnum
	// ErrEntropyExceeded indicates requested entropy exceeds hash output entropy.
	ErrEntropyExceeded
		// ErrInsufficientEntropy indicates RNG failed to provide enough entropy.
	ErrInsufficientEntropy
	// ErrInvalidMode indicates an unsupported random generation mode.
	ErrInvalidMode
	// ErrInvalidInput indicates bad input to random mode wrapper.
	ErrInvalidInput
)

// Error represents a B57 error with a specific code and context.
type Error struct {
	Code    ErrorCode
	Message string
	Index   int // position in string where error occurred (or -1 if not applicable)
}

func (e *Error) Error() string {
	if e.Index >= 0 {
		return fmt.Sprintf("b57: %s at position %d", e.Message, e.Index)
	}
	return fmt.Sprintf("b57: %s", e.Message)
}

// NewInvalidCharError creates an error for invalid characters.
func NewInvalidCharError(index int, char byte) *Error {
	return &Error{
		Code:    ErrInvalidChar,
		Message: fmt.Sprintf("invalid character %q", char),
		Index:   index,
	}
}

// NewNonCanonicalError creates an error for non-canonical encoding.
func NewNonCanonicalError() *Error {
	return &Error{
		Code:    ErrNonCanonical,
		Message: "non-canonical encoding",
		Index:   -1,
	}
}

// NewInvalidLengthEnumError creates an error for unsupported H57 length enums.
func NewInvalidLengthEnumError(lengthEnum int) *Error {
	return &Error{
		Code:    ErrInvalidLengthEnum,
		Message: fmt.Sprintf("invalid length enum %d", lengthEnum),
		Index:   -1,
	}
}

// NewEntropyExceededError creates an error when requested entropy exceeds available hash entropy.
func NewEntropyExceededError(requestedBytes, availableBytes int) *Error {
	return &Error{
		Code:    ErrEntropyExceeded,
		Message: fmt.Sprintf("requested entropy exceeds hash output (%d bytes requested, %d available)", requestedBytes, availableBytes),
		Index:   -1,
	}
}

// NewInsufficientEntropyError creates an error for RNG failure.
func NewInsufficientEntropyError() *Error {
	return &Error{
		Code:    ErrInsufficientEntropy,
		Message: "insufficient entropy generated",
		Index:   -1,
	}
}

// NewInvalidModeError creates an error for invalid mode enum.
func NewInvalidModeError(mode int) *Error {
	return &Error{
		Code:    ErrInvalidMode,
		Message: fmt.Sprintf("invalid random generation mode %d", mode),
		Index:   -1,
	}
}

// NewInvalidInputError creates an error for invalid input provided to a random mode.
func NewInvalidInputError(msg string) *Error {
	return &Error{
		Code:    ErrInvalidInput,
		Message: fmt.Sprintf("invalid input: %s", msg),
		Index:   -1,
	}
}
