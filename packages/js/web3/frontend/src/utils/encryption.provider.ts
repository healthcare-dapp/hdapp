import { Buffer } from "buffer";
import CryptoJS, { AES, enc } from "crypto-js";

function convertWordArrayToUint8Array(wordArray: CryptoJS.lib.WordArray) {
    // eslint-disable-next-line no-prototype-builtins
    const arrayOfWords = wordArray.hasOwnProperty("words") ? new Uint8Array(wordArray.words) : new Uint8Array();
    // eslint-disable-next-line no-prototype-builtins
    const length = wordArray.hasOwnProperty("sigBytes") ? wordArray.sigBytes : arrayOfWords.length * 4;
    const uInt8Array = new Uint8Array(length);
    let index = 0;
    let word: number;
    for (let i = 0; i < length; i++) {
        word = arrayOfWords[i];
        uInt8Array[index++] = word >> 24;
        uInt8Array[index++] = (word >> 16) & 0xff;
        uInt8Array[index++] = (word >> 8) & 0xff;
        uInt8Array[index++] = word & 0xff;
    }
    return uInt8Array;
}

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

    decryptString(data: string): Uint8Array {
        if (!this.#password)
            throw new Error("No password available for decryption.");

        // @ts-ignore
        // const encrypted = AES.decrypt(data, this.#password);

        // return encrypted;
        return new Uint8Array(Buffer.from(data, "base64"));
    }

    encryptArrayBuffer(data: Uint8Array): string {
        if (!this.#password)
            throw new Error("No password available for decryption.");

        // @ts-ignore
        // const wordArray = CryptoJS.lib.WordArray.create(data);
        // const encrypted = AES.encrypt(wordArray, this.#password);

        // return encrypted.toString();
        return Buffer.from(data).toString("base64");
    }
}
