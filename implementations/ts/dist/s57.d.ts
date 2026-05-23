type ByteInput = Uint8Array | Buffer | ArrayBuffer;
type ByteOrStringInput = ByteInput | string;
type S57Config = {
    server_secret_key: ByteOrStringInput;
    environment_salt: ByteOrStringInput;
    key_id?: number;
};
type ResolvedKeys = {
    key_id: number;
    b57_aes_256_key: Uint8Array;
    h57_key: Uint8Array;
    id57_key: Uint8Array;
};
declare const S57_VERSION = 1;
declare const S57Length: Readonly<{
    LEN_128: 128;
    LEN_256: 256;
    LEN_512: 512;
}>;
export declare class S57 {
    serverSecretKey: Uint8Array;
    environmentSalt: Uint8Array;
    activeKeyId: number;
    keys: ResolvedKeys;
    counter: number;
    constructor(config: S57Config);
    resolveKeys(): ResolvedKeys;
    hash(data: ByteOrStringInput, lengthEnum?: number): string;
    id(data: ByteOrStringInput, lengthEnum?: number): string;
    random(): string;
    random_time(): string;
    random_counter(counter: number): string;
    random_session(session_secret: ByteOrStringInput): string;
    random_device(device_secret: ByteOrStringInput): string;
    random_derived(master_secret: ByteOrStringInput, unique_input: ByteOrStringInput): string;
    random_hardened(): string;
    random_hybrid(...sources: ByteOrStringInput[]): string;
    encrypt(plaintext: ByteOrStringInput, aad?: ByteOrStringInput): string;
    decrypt(b57String: string, aad?: ByteOrStringInput, expectedKeyId?: number | undefined): Uint8Array<ArrayBuffer>;
}
export { S57Length, S57_VERSION };
//# sourceMappingURL=s57.d.ts.map