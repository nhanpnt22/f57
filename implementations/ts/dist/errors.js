export class B57Error extends Error {
    code;
    rawMessage;
    index;
    constructor(code, message) {
        super(`b57: ${message}`);
        this.name = 'B57Error';
        this.code = code;
        this.rawMessage = message;
        this.index = -1;
    }
}
export const ErrorCode = Object.freeze({
    INVALID_CHAR: 'INVALID_CHAR',
    NON_CANONICAL: 'NON_CANONICAL',
    INVALID_LENGTH_ENUM: 'INVALID_LENGTH_ENUM',
    ENTROPY_EXCEEDED: 'ENTROPY_EXCEEDED',
    INVALID_MODE: 'INVALID_MODE',
    INVALID_VERSION: 'INVALID_VERSION',
    AUTH_FAILURE: 'AUTH_FAILURE',
    KEY_INVALID: 'KEY_INVALID',
    KEY_UNAVAILABLE: 'KEY_UNAVAILABLE'
});
export class InvalidCharError extends B57Error {
    char;
    constructor(char, index = -1) {
        super(ErrorCode.INVALID_CHAR, `invalid character '${char}'${index >= 0 ? ` at index ${index}` : ''}`);
        this.char = char;
        this.index = index;
    }
}
export class NonCanonicalError extends B57Error {
    constructor() {
        super(ErrorCode.NON_CANONICAL, 'string contains non-canonical encoding');
    }
}
export class InvalidLengthEnumError extends B57Error {
    constructor(lengthValue) {
        super(ErrorCode.INVALID_LENGTH_ENUM, `invalid length enum ${lengthValue}`);
    }
}
export class EntropyExceededError extends B57Error {
    constructor(requested, available) {
        super(ErrorCode.ENTROPY_EXCEEDED, `requested ${requested} bytes of entropy but only ${available} available`);
    }
}
export class InvalidModeError extends B57Error {
    constructor(mode) {
        super(ErrorCode.INVALID_MODE, `invalid r57 mode ${mode}`);
    }
}
export class InvalidVersionError extends B57Error {
    constructor(version) {
        super(ErrorCode.INVALID_VERSION, `invalid envelope version ${version}`);
    }
}
export class AuthFailureError extends B57Error {
    constructor() {
        super(ErrorCode.AUTH_FAILURE, 'authentication failed');
    }
}
export class KeyInvalidError extends B57Error {
    constructor() {
        super(ErrorCode.KEY_INVALID, 'invalid key material');
    }
}
export class KeyUnavailableError extends B57Error {
    keyId;
    constructor(keyId) {
        super(ErrorCode.KEY_UNAVAILABLE, `key unavailable for key_id ${keyId}`);
        this.keyId = keyId;
    }
}
export function newInvalidCharError(char, index = -1) {
    return new InvalidCharError(char, index);
}
export function newNonCanonicalError() {
    return new NonCanonicalError();
}
export function newInvalidLengthEnumError(lengthValue) {
    return new InvalidLengthEnumError(lengthValue);
}
export function newEntropyExceededError(requested, available) {
    return new EntropyExceededError(requested, available);
}
export function newInvalidR57ModeError(mode) {
    return new InvalidModeError(mode);
}
export function newInvalidVersionError(version) {
    return new InvalidVersionError(version);
}
export function newAuthFailureError() {
    return new AuthFailureError();
}
export function newKeyInvalidError() {
    return new KeyInvalidError();
}
export function newKeyUnavailableError(keyId) {
    return new KeyUnavailableError(keyId);
}
//# sourceMappingURL=errors.js.map