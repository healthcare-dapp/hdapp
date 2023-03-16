import { LocalDateTime } from "@js-joda/core";
import { EncryptionProvider } from "../utils/encryption.provider";
import { DbConsumer, RecordNotFoundError } from "./db.consumer";
import { dbService, DbService } from "./db.service";

interface DeviceDbEntry {
    hash: string
    encrypted: string
    is_current: boolean
}

interface DeviceDbEntryEncryptedData {
    friendly_name: string
    owned_by: string
    private_key: string
    type: string
    added_at: string
}

export interface DeviceEntry {
    hash: string
    owned_by: string
    friendly_name: string
    private_key: string
    type: string
    added_at: LocalDateTime
    is_current: boolean
}

export class DeviceNotFoundError extends Error {}

const transformer = (provider: EncryptionProvider) => (dbEntry: DeviceDbEntry): DeviceEntry => {
    const encrypted: DeviceDbEntryEncryptedData = JSON.parse(
        provider.decrypt(dbEntry.encrypted)
    );

    return {
        hash: dbEntry.hash,
        is_current: dbEntry.is_current,
        owned_by: encrypted.owned_by,
        friendly_name: encrypted.friendly_name,
        private_key: encrypted.private_key,
        type: encrypted.type,
        added_at: LocalDateTime.parse(encrypted.added_at)
    };
};

const reverseTransformer = (provider: EncryptionProvider) => (entry: DeviceEntry): DeviceDbEntry => {
    const encrypted: DeviceDbEntryEncryptedData = {
        added_at: entry.added_at.toString(),
        friendly_name: entry.friendly_name,
        private_key: entry.private_key,
        owned_by: entry.owned_by,
        type: entry.type
    };

    return {
        hash: entry.hash,
        is_current: entry.is_current,
        encrypted: provider.encrypt(JSON.stringify(encrypted))
    };
};

export class DeviceService extends DbConsumer {
    protected _storeName = "devices";

    constructor(protected _db: DbService) {
        super("device-service");
    }

    async getDevice(hash: string, provider: EncryptionProvider): Promise<DeviceEntry> {
        try {
            const entity = await this._findOne(hash, transformer(provider));
            return entity;
        } catch (e) {
            if (e instanceof RecordNotFoundError)
                throw new DeviceNotFoundError("Device was not found.");

            throw e;
        }
    }

    async getCurrentDevice(provider: EncryptionProvider): Promise<DeviceEntry | null> {
        try {
            const [entity] = await this._findMany((dbEntity: DeviceDbEntry) => {
                if (dbEntity.is_current)
                    return transformer(provider)(dbEntity);
                return null;
            });
            return entity ?? null;
        } catch (e) {
            if (e instanceof RecordNotFoundError)
                throw new DeviceNotFoundError("Device was not found.");

            throw e;
        }
    }

    async addDevice(form: DeviceEntry, provider: EncryptionProvider): Promise<void> {
        try {
            await this._add(form, reverseTransformer(provider));
        } catch (e) {
            if (e instanceof RecordNotFoundError)
                throw new DeviceNotFoundError("Device was not found.");

            throw e;
        }
    }

    onDbUpgrade(db: IDBDatabase): void {
        const store = db.createObjectStore(
            this._storeName,
            { keyPath: "hash" }
        );

        store.createIndex("hash", "hash", { unique: true });
        store.createIndex("encrypted", "encrypted", { unique: false });
        store.createIndex("is_current", "is_current", { unique: false });
    }
}

export const deviceService = new DeviceService(dbService);
dbService.addConsumer(deviceService);
