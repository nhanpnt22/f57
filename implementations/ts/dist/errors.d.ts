export declare class B57Error extends Error {
    code: string;
    rawMessage: string;
    index: number;
    constructor(code: string, message: string);
}
export declare const ErrorCode: Readonly<{
    INVALID_CHAR: "INVALID_CHAR";
    NON_CANONICAL: "NON_CANONICAL";
    INVALID_LENGTH_ENUM: "INVALID_LENGTH_ENUM";
    ENTROPY_EXCEEDED: "ENTROPY_EXCEEDED";
    INVALID_MODE: "INVALID_MODE";
    INVALID_VERSION: "INVALID_VERSION";
    AUTH_FAILURE: "AUTH_FAILURE";
    KEY_INVALID: "KEY_INVALID";
    KEY_UNAVAILABLE: "KEY_UNAVAILABLE";
}>;
export declare class InvalidCharError extends B57Error {
    char: string | number;
    constructor(char: string | number, index?: number);
}
export declare class NonCanonicalError extends B57Error {
    constructor();
}
export declare class InvalidLengthEnumError extends B57Error {
    constructor(lengthValue: number);
}
export declare class EntropyExceededError extends B57Error {
    constructor(requested: number, available: number);
}
export declare class InvalidModeError extends B57Error {
    constructor(mode: number);
}
export declare class InvalidVersionError extends B57Error {
    constructor(version: number);
}
export declare class AuthFailureError extends B57Error {
    constructor();
}
export declare class KeyInvalidError extends B57Error {
    constructor();
}
export declare class KeyUnavailableError extends B57Error {
    keyId: number;
    constructor(keyId: number);
}
export declare function newInvalidCharError(char: string | number, index?: number): InvalidCharError;
export declare function newNonCanonicalError(): NonCanonicalError;
export declare function newInvalidLengthEnumError(lengthValue: number): InvalidLengthEnumError;
export declare function newEntropyExceededError(requested: number, available: number): EntropyExceededError;
export declare function newInvalidR57ModeError(mode: number): InvalidModeError;
export declare function newInvalidVersionError(version: number): InvalidVersionError;
export declare function newAuthFailureError(): AuthFailureError;
export declare function newKeyInvalidError(): KeyInvalidError;
export declare function newKeyUnavailableError(keyId: number): KeyUnavailableError;
//# sourceMappingURL=errors.d.ts.map