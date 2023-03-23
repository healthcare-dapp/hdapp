import { autoBind } from "@hdapp/shared/web2-common/utils";
import { EncryptionProvider } from "../utils/encryption.provider";
import { DbConsumer, DbRecordNotFoundError } from "./db.consumer";
import { dbService, DbService } from "./db.service";

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

const transformer = (provider: EncryptionProvider) => (dbEntry: WalletDbEntry): WalletEntry => {
    const encrypted: WalletDbEntryEncryptedData = JSON.parse(
        provider.decrypt(dbEntry.encrypted)
    );

    return {
        address: dbEntry.address,
        mnemonic: encrypted.mnemonic,
        private_key: encrypted.private_key,
        type: encrypted.type,
        user: {
            avatar_file_id: dbEntry.user_avatar_file_hash,
            full_name: dbEntry.user_full_name
        }
    };
};

const shortTransformer = (dbEntry: WalletDbEntry): WalletEntryShort => {
    return {
        address: dbEntry.address,
        user: {
            avatar_file_id: dbEntry.user_avatar_file_hash,
            full_name: dbEntry.user_full_name
        }
    };
};

const reverseTransformer = (provider: EncryptionProvider) => (entry: WalletEntry): WalletDbEntry => {
    const encrypted: WalletDbEntryEncryptedData = {
        type: entry.type,
        mnemonic: entry.mnemonic,
        private_key: entry.private_key
    };

    return {
        address: entry.address,
        user_avatar_file_hash: entry.user.avatar_file_id,
        user_full_name: entry.user.full_name,
        encrypted: provider.encrypt(JSON.stringify(encrypted))
    };
};

export class WalletService extends DbConsumer {
    protected readonly _storeName = "wallets";

    constructor(protected _db: DbService) {
        super("wallet-service");

        autoBind(this);
    }

    async addWallet(entry: WalletEntry, provider: EncryptionProvider): Promise<void> {
        try {
            await this._add(entry, reverseTransformer(provider));
        } catch (e) {
            if (e instanceof DbRecordNotFoundError)
                throw new WalletNotFoundError("Wallet was not found.");

            throw e;
        }
    }

    async getWallets(): Promise<WalletEntryShort[]> {
        try {
            const devices = await this._findMany(
                shortTransformer,
                () => true
            );
            return devices;
        } catch (e) {
            if (e instanceof DbRecordNotFoundError)
                throw new WalletNotFoundError("Wallet was not found.");

            throw e;
        }
    }

    async getWallet(address: string, provider: EncryptionProvider): Promise<WalletEntry> {
        try {
            const entity = await this._findOne(address, transformer(provider));
            return entity;
        } catch (e) {
            if (e instanceof DbRecordNotFoundError)
                throw new WalletNotFoundError("Wallet was not found.");

            throw e;
        }
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
