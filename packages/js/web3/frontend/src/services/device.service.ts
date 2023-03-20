import { LocalDateTime } from "@js-joda/core";
import { EncryptionProvider } from "../utils/encryption.provider";
import { DbConsumer, DbRecordNotFoundError } from "./db.consumer";
import { dbService, DbService } from "./db.service";

interface DeviceDbEntry {
    hash: string
    owned_by: string
    encrypted: string
    is_current: boolean
    is_pending: boolean
}

interface DeviceDbEntryEncryptedData {
    friendly_name: string
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
    is_pending: boolean
}

export class DeviceNotFoundError extends Error {}

const transformer = (provider: EncryptionProvider) => (dbEntry: DeviceDbEntry): DeviceEntry => {
    const encrypted: DeviceDbEntryEncryptedData = JSON.parse(
        provider.decrypt(dbEntry.encrypted)
    );

    return {
        hash: dbEntry.hash,
        is_current: dbEntry.is_current,
        is_pending: dbEntry.is_pending,
        owned_by: dbEntry.owned_by,
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
        type: entry.type
    };

    return {
        hash: entry.hash,
        is_current: entry.is_current,
        is_pending: entry.is_pending,
        owned_by: entry.owned_by,
        encrypted: provider.encrypt(JSON.stringify(encrypted))
    };
};

export class DeviceService extends DbConsumer {
    protected readonly _storeName = "devices";

    constructor(protected _db: DbService) {
        super("device-service");
    }

    async activateAllDevicesOwnedBy(user: string, provider: EncryptionProvider): Promise<void> {
        try {
            await this._patchMany(
                transformer(provider),
                device => device.owned_by === user && device.is_pending ? { ...device, is_pending: false } : null,
                reverseTransformer(provider),
            );
        } catch (e) {
            if (e instanceof DbRecordNotFoundError)
                throw new DeviceNotFoundError("Device was not found.");

            throw e;
        }
    }

    async getDevice(hash: string, provider: EncryptionProvider): Promise<DeviceEntry> {
        try {
            const entity = await this._findOne(hash, transformer(provider));
            return entity;
        } catch (e) {
            if (e instanceof DbRecordNotFoundError)
                throw new DeviceNotFoundError("Device was not found.");

            throw e;
        }
    }

    async getDevicesOwnedBy(owner: string, provider: EncryptionProvider): Promise<DeviceEntry[]> {
        try {
            const devices = await this._findMany(
                transformer(provider),
                entity => entity.owned_by === owner
            );
            return devices;
        } catch (e) {
            if (e instanceof DbRecordNotFoundError)
                throw new DeviceNotFoundError("Device was not found.");

            throw e;
        }
    }

    async getDevicesNotOwnedBy(owner: string, provider: EncryptionProvider): Promise<DeviceEntry[]> {
        try {
            const devices = await this._findMany(
                transformer(provider),
                entity => entity.owned_by !== owner
            );
            return devices;
        } catch (e) {
            if (e instanceof DbRecordNotFoundError)
                throw new DeviceNotFoundError("Device was not found.");

            throw e;
        }
    }

    async getCurrentDevice(provider: EncryptionProvider): Promise<DeviceEntry | null> {
        try {
            const [entity] = await this._findMany(
                transformer(provider),
                device => device.is_current
            );
            return entity ?? null;
        } catch (e) {
            if (e instanceof DbRecordNotFoundError)
                throw new DeviceNotFoundError("Device was not found.");

            throw e;
        }
    }

    async addDevice(form: DeviceEntry, provider: EncryptionProvider): Promise<void> {
        try {
            await this._add(form, reverseTransformer(provider));
        } catch (e) {
            if (e instanceof DbRecordNotFoundError)
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
        store.createIndex("is_pending", "is_pending", { unique: false });
        store.createIndex("owned_by", "owned_by", { unique: false });
    }
}

export const deviceService = new DeviceService(dbService);
dbService.addConsumer(deviceService);
