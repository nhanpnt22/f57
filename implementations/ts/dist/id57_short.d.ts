import { id57GenerateDefault, id57Verify, id57VerifyDefault } from './id57.js';
type ByteInput = Uint8Array | Buffer | ArrayBuffer;
export declare const ID57ShortLength: Readonly<{
    DEFAULT: 0;
    LEN_23: 23;
    LEN_29: 29;
    LEN_32: 32;
    LEN_47: 47;
    LEN_70: 70;
}>;
export declare function resolveID57ShortLength(length: number): number;
export declare function id57ShortGenerate(input: ByteInput, length?: number): string;
export declare function id57ShortGenerateDefault(input: ByteInput): string;
export declare function id57ShortVerify(input: ByteInput, id57String: string, length?: number): boolean;
export declare function id57ShortVerifyDefault(input: ByteInput, id57String: string): boolean;
export declare function id57ShortIsValid(id57String: string): boolean;
export declare function id57ShortIsCanonical(id57String: string): boolean;
export { id57GenerateDefault, id57Verify, id57VerifyDefault };
//# sourceMappingURL=id57_short.d.ts.map