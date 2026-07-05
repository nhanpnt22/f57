type ByteInput = Uint8Array | Buffer | ArrayBuffer;
export declare const ID57Length: Readonly<{
    DEFAULT: 0;
    LEN_8: 8;
    LEN_16: 16;
    LEN_23: 23;
    LEN_29: 29;
    LEN_32: 32;
    LEN_47: 47;
    LEN_64: 64;
    LEN_70: 70;
    LEN_93: 93;
    LEN_128: 128;
    LEN_186: 186;
    LEN_256: 256;
    LEN_373: 373;
    LEN_512: 512;
}>;
export declare const id57BitsByLength: Map<number, number>;
export declare function resolveID57Length(length: number): number;
export declare function maskExcessBits(bytes: Uint8Array, bitLength: number): void;
export declare function id57Generate(input: ByteInput, length?: number): string;
export declare function id57GenerateDefault(input: ByteInput): string;
export declare function id57Verify(input: ByteInput, id57String: string, length?: number): boolean;
export declare function id57VerifyDefault(input: ByteInput, id57String: string): boolean;
export declare function id57IsValid(id57String: string): boolean;
export declare function id57IsCanonical(id57String: string): boolean;
export declare function id57Range(length?: number): {
    min: number;
    max: number;
};
export declare function id57IsLength(id57String: string, length?: number): boolean;
export {};
//# sourceMappingURL=id57.d.ts.map