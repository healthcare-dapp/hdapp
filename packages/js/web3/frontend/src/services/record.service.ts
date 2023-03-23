import { autoBind } from "@hdapp/shared/web2-common/utils/auto-bind";
import { Instant, LocalDateTime } from "@js-joda/core";
import { SHA256 } from "crypto-js";
import { EncryptionProvider } from "../utils/encryption.provider";
import { DbConsumer, DbRecordNotFoundError } from "./db.consumer";
import { dbService, DbService } from "./db.service";

interface RecordDbEntry {
    hash: string
    is_archived: boolean
    encrypted: string
}

interface RecordDbEntryEncryptedData {
    title: string
    description: string
    owned_by: string
    created_by: string
    type: string
    block_ids: string[]
    attachment_ids: string[]
    created_at: string
}

export interface RecordEntry {
    hash: string
    is_archived: boolean
    title: string
    description: string
    owned_by: string
    created_by: string
    type: string
    block_ids: string[]
    attachment_ids: string[]
    created_at: LocalDateTime
}

export interface RecordForm {
    title: string
    description: string
    owned_by: string
    created_by: string
    type: string
    block_ids: string[]
    attachment_ids: string[]
}

export interface RecordSearchRequest {
    filters?: {
        query?: string | null
        created_by?: string | null
        block_id?: string | null
    }
    sort_by?: "created_by" | null
}

export class RecordNotFoundError extends Error { }

const transformer = (provider: EncryptionProvider) => (dbEntry: RecordDbEntry): RecordEntry => {
    const encrypted: RecordDbEntryEncryptedData = JSON.parse(
        provider.decrypt(dbEntry.encrypted)
    );

    return {
        hash: dbEntry.hash,
        is_archived: dbEntry.is_archived,
        title: encrypted.title,
        description: encrypted.description,
        attachment_ids: encrypted.attachment_ids,
        block_ids: encrypted.block_ids,
        created_by: encrypted.created_by,
        owned_by: encrypted.owned_by,
        type: encrypted.type,
        created_at: LocalDateTime.parse(encrypted.created_at)
    };
};

const reverseTransformer = (provider: EncryptionProvider) => (entry: RecordEntry): RecordDbEntry => {
    const encrypted: RecordDbEntryEncryptedData = {
        title: entry.title,
        description: entry.description,
        attachment_ids: entry.attachment_ids,
        block_ids: entry.block_ids,
        created_by: entry.created_by,
        owned_by: entry.owned_by,
        type: entry.type,
        created_at: entry.created_at.toString()
    };

    return {
        hash: entry.hash,
        is_archived: entry.is_archived,
        encrypted: provider.encrypt(JSON.stringify(encrypted))
    };
};

export class RecordService extends DbConsumer {
    protected readonly _storeName = "records";

    constructor(protected _db: DbService) {
        super("record-service");

        autoBind(this);
    }

    async getRecord(hash: string, provider: EncryptionProvider): Promise<RecordEntry> {
        try {
            const entity = await this._findOne(hash, transformer(provider));
            return entity;
        } catch (e) {
            if (e instanceof DbRecordNotFoundError)
                throw new RecordNotFoundError("Record was not found.");

            throw e;
        }
    }

    async searchRecords(_searchRequest: RecordSearchRequest, provider: EncryptionProvider): Promise<RecordEntry[]> {
        try {
            const devices = await this._findMany(
                transformer(provider),
                () => true
            );
            return devices;
        } catch (e) {
            if (e instanceof DbRecordNotFoundError)
                throw new RecordNotFoundError("Record was not found.");

            throw e;
        }
    }

    async addRecord(form: RecordForm, provider: EncryptionProvider): Promise<void> {
        try {
            await this._add({
                ...form,
                is_archived: false,
                hash: SHA256(Instant.now().toString() + " " + form.title + " " + form.owned_by).toString(),
                created_at: LocalDateTime.now()
            }, reverseTransformer(provider));
        } catch (e) {
            if (e instanceof DbRecordNotFoundError)
                throw new RecordNotFoundError("Record was not found.");

            throw e;
        }
    }

    async archiveRecord(hash: string, provider: EncryptionProvider): Promise<void> {
        try {
            await this._patchOne(hash, { is_archived: true }, transformer(provider), reverseTransformer(provider));
        } catch (e) {
            if (e instanceof DbRecordNotFoundError)
                throw new RecordNotFoundError("Record was not found.");

            throw e;
        }
    }

    onDbUpgrade(db: IDBDatabase): void {
        const metadataStore = db.createObjectStore(
            this._storeName,
            { keyPath: "hash" }
        );

        metadataStore.createIndex("hash", "hash", { unique: true });
        metadataStore.createIndex("is_archived", "is_archived", { unique: false });
        metadataStore.createIndex("encrypted", "encrypted", { unique: false });
    }
}

export const recordService = new RecordService(dbService);
dbService.addConsumer(recordService);
