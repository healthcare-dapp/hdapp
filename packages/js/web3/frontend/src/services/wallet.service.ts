import { Logger } from "@hdapp/shared/web2-common/utils";
import { EncryptionProvider } from "../utils/encryption.provider";
import { dbService, DbService, IDbConsumer } from "./db.service";

interface WalletDbEntry {
    address: string
    user_avatar_file_hash: string | null
    user_full_name: string | null
    encrypted: string
}

export enum WalletType {
    MetaMask = "metamask",
    PrivateKey = "private_key",
    Mnemonic = "mnemonic"
}

interface WalletEntryUserAggregatedData {
    avatar_file_id: string | null
    full_name: string | null
}

interface WalletEntryUnencryptedData {
    address: string
    user: WalletEntryUserAggregatedData
}

interface WalletDbEntryEncryptedData {
    type: WalletType
    private_key: string | null
    mnemonic: string | null
}

export type WalletEntryShort = WalletEntryUnencryptedData;
export type WalletEntry = WalletEntryUnencryptedData & WalletDbEntryEncryptedData;

export class WalletNotFoundError extends Error {}

export class WalletService implements IDbConsumer {
    private readonly _storeName = "wallets";

    private readonly _logger = new Logger("wallet-service");

    constructor(private _db: DbService) {
    }

    private _transformDbEntryToEntry(dbEntry: WalletDbEntry, encryptedData: WalletDbEntryEncryptedData): WalletEntry {
        return {
            address: dbEntry.address,
            mnemonic: encryptedData.mnemonic,
            private_key: encryptedData.private_key,
            type: encryptedData.type,
            user: {
                avatar_file_id: dbEntry.user_avatar_file_hash,
                full_name: dbEntry.user_full_name
            }
        };
    }

    private _transformEntryToDbEntry(entry: WalletEntry): [WalletDbEntry, WalletDbEntryEncryptedData] {
        return [
            {
                address: entry.address,
                encrypted: "",
                user_avatar_file_hash: entry.user.avatar_file_id,
                user_full_name: entry.user.full_name
            },
            {
                type: entry.type,
                mnemonic: entry.mnemonic,
                private_key: entry.private_key
            }
        ];
    }

    private _transformDbEntryToEntryShort(dbEntry: WalletDbEntry): WalletEntryShort {
        return {
            address: dbEntry.address,
            user: {
                avatar_file_id: dbEntry.user_avatar_file_hash,
                full_name: dbEntry.user_full_name
            }
        };
    }

    addWallet(entry: WalletEntry, provider: EncryptionProvider): Promise<void> {
        const tsn = this._db.transaction([this._storeName], "readwrite");
        const store = tsn.objectStore(this._storeName);
        const [dbEntry, data] = this._transformEntryToDbEntry(entry);
        const encrypted = provider.encrypt(JSON.stringify(data));
        const request = store.put({
            ...dbEntry,
            encrypted
        });
        return new Promise((resolve, reject) => {
            request.addEventListener("success", () => {
                if (!request.result) {
                    this._logger.debug("Could not save wallet data.", { tsn, request });
                    reject(new Error("Could not save wallet data."));
                }

                resolve();
            });
            request.addEventListener("error", () => {
                this._logger.debug("Could not save wallet data.", { tsn, request });
                reject(new Error("Could not save wallet data."));
            });
        });
    }

    getWallets(): Promise<WalletEntryShort[]> {
        const tsn = this._db.transaction([this._storeName], "readonly");
        const store = tsn.objectStore(this._storeName);
        const request: IDBRequest<WalletDbEntry[]> = store.getAll();
        return new Promise((resolve, reject) => {
            request.addEventListener("success", () => {
                if (!request.result) {
                    this._logger.debug("Could not list wallets.", { tsn, request });
                    reject(new Error("Could not list wallets."));
                }

                resolve(
                    request.result.map(
                        dbEntry => this._transformDbEntryToEntryShort(dbEntry)
                    )
                );
            });
            request.addEventListener("error", () => {
                this._logger.debug("Could not retrieve wallets.", { tsn, request });
                reject(new Error("Could not retrieve wallets."));
            });
        });
    }

    getWallet(address: string, provider: EncryptionProvider): Promise<WalletEntry> {
        const tsn = this._db.transaction([this._storeName], "readonly");
        const store = tsn.objectStore(this._storeName);
        const request: IDBRequest<WalletDbEntry> = store.get(address);
        return new Promise((resolve, reject) => {
            request.addEventListener("success", () => {
                if (!request.result) {
                    this._logger.debug("Could not find the requested wallet.", { tsn, address, request });
                    reject(new WalletNotFoundError("Wallet not found."));
                }
                try {
                    const decryptedResult = provider.decrypt(request.result.encrypted);
                    const data: WalletDbEntryEncryptedData = JSON.parse(decryptedResult);
                    resolve(
                        this._transformDbEntryToEntry(request.result, data)
                    );
                } catch (cause) {
                    this._logger.debug("Wallet blob could not be retrieved.", { tsn, address, cause });
                    reject(
                        new Error("Wallet blob could not be retrieved.")
                    );
                }
            });
            request.addEventListener("error", () => {
                this._logger.debug("Could not retrieve wallet.", { tsn, address, request });
                reject(new Error("Could not retrieve wallet."));
            });
        });
    }

    onDbUpgrade(db: IDBDatabase): void {
        const store = db.createObjectStore(
            this._storeName,
            { keyPath: "address" }
        );

        store.createIndex("address", "address", { unique: true });
        store.createIndex("user_avatar_file_hash", "user_avatar_file_hash", { unique: false });
        store.createIndex("user_full_name", "user_full_name", { unique: false });
        store.createIndex("encrypted", "encrypted", { unique: false });
    }
}

export const walletService = new WalletService(dbService);
dbService.addConsumer(walletService);
