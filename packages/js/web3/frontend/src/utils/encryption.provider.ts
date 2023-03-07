import { Buffer } from "buffer";
import { AES, enc } from "crypto-js";

export class EncryptionProvider {
    #password: string | null = null;

    constructor(password: string) {
        this.#password = password;
    }

    decryptUint8Array(encryptedBase64Data: string): Uint8Array {
        if (!this.#password)
            throw new Error("No password available for decryption.");

        const encrypted = Buffer.from(String(encryptedBase64Data), "base64")
            .toString("base64");

        try {
            const decrypted = new Uint8Array(
                AES.decrypt(encrypted, this.#password).words
            );

            return decrypted;
        } catch (e) {
            throw new Error("Can't decrypt data.");
        }
    }

    decrypt(encryptedBase64Data: string): string {
        if (!this.#password)
            throw new Error("No password available for decryption.");
        const encrypted = Buffer.from(String(encryptedBase64Data), "base64")
            .toString("base64");
        try {
            const decrypted = AES.decrypt(encrypted, this.#password)
                .toString(enc.Utf8);

            return decrypted;
        } catch (e) {
            throw new Error("Can't decrypt data.");
        }
    }

    encrypt(data: string): string {
        if (!this.#password)
            throw new Error("No password available for decryption.");

        const decrypted = Buffer.from(data, "utf8")
            .toString("utf8");
        const encrypted = Buffer.from(AES.encrypt(decrypted, this.#password).toString(), "base64")
            .toString("base64");

        return encrypted;
    }

    encryptArrayBuffer(arrayBuffer: ArrayBuffer): string {
        if (!this.#password)
            throw new Error("No password available for decryption.");

        const decrypted = Buffer.from(arrayBuffer)
            .toString("base64");
        const encrypted = Buffer.from(AES.encrypt(decrypted, this.#password).toString(), "base64")
            .toString("base64");

        return encrypted;
    }
}
