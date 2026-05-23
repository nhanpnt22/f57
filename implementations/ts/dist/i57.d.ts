type ByteInput = Uint8Array | Buffer | ArrayBuffer;
export declare function i57Encode(input: ByteInput): string;
export declare function i57Decode(s: string): Uint8Array<any>;
export declare function i57Hash(input: ByteInput, length?: number): string;
export declare function i57Random(mode: number): string;
export declare function i57Id(input: ByteInput, length?: number): string;
export declare function i57IsValid(s: string): boolean;
export declare function i57IsCanonical(s: string): boolean;
export declare function i57ValidateIdentifier(s: string): boolean;
export declare function i57ValidateEntropy(s: string): boolean;
export {};
//# sourceMappingURL=i57.d.ts.map