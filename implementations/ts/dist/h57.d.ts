type ByteInput = Uint8Array | Buffer | ArrayBuffer;
export declare const H57Length: Readonly<{
    HASH_AUTO: -1;
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
    HASH_256: 10256;
    HASH_512: 10512;
}>;
export declare const h57BitsByLength: Map<number, number>;
export declare function computeHashBLAKE3XOF(input: ByteInput, outputLen: number): Uint8Array<ArrayBufferLike>;
export declare function h57Hash(input: ByteInput, length?: number): string;
export declare function h57Verify(input: ByteInput, h57String: string, length?: number): boolean;
export declare function h57IsValid(h57String: string): boolean;
export declare function h57IsCanonical(h57String: string): boolean;
export {};
//# sourceMappingURL=h57.d.ts.map