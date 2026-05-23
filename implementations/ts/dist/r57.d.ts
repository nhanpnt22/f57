export declare const R57Mode: Readonly<{
    R57_1_CSPRNG: 1;
    R57_2_HASH_ENTROPY: 2;
    R57_3_KDF_DERIVED: 3;
    R57_4_COUNTER_KDF: 4;
    R57_5_TIMESTAMP_KDF: 5;
    R57_6_HARDWARE_RNG: 6;
    R57_7_UUIDV4_COMPAT: 7;
    R57_8_HYBRID_ENTROPY: 8;
}>;
export declare function r57Generate(mode: any): string;
export declare function r57IsValid(s: any): boolean;
export declare function r57IsCanonical(s: any): boolean;
//# sourceMappingURL=r57.d.ts.map