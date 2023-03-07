import { Logger } from "@hdapp/shared/web2-common/utils";
import { LocalDateTime } from "@js-joda/core";
import { makeAutoObservable } from "mobx";
import { EncryptionProvider } from "../utils/encryption.provider";
import { dbService, DbService, IDbConsumer } from "./db.service";

interface RecordDbEntry {
    hash: string
    encrypted: string
}

interface RecordDbEntryEncryptedData {
    title: string
    description: string
    owned_by: string
    created_by: string
    type: string
    block_ids: string[]
    appointment_ids: string[]
    attachment_ids: string[]
    created_at: string
}

export interface RecordEntry {
    hash: string
    title: string
    description: string
    owned_by: string
    created_by: string
    type: string
    block_ids: string[]
    appointment_ids: string[]
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
    appointment_ids: string[]
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

export class RecordService implements IDbConsumer {
    private readonly _storeName = "records";

    private readonly _logger = new Logger("record-service");

    constructor(private _db: DbService) {
        makeAutoObservable(this, {}, { autoBind: true });
    }

    private _transformDbEntryToEntry(dbEntry: RecordDbEntry, encrypted: RecordDbEntryEncryptedData): RecordEntry {
        return {
            hash: dbEntry.hash,
            title: encrypted.title,
            description: encrypted.description,
            appointment_ids: encrypted.appointment_ids,
            attachment_ids: encrypted.attachment_ids,
            block_ids: encrypted.block_ids,
            created_by: encrypted.created_by,
            owned_by: encrypted.owned_by,
            type: encrypted.type,
            created_at: LocalDateTime.parse(encrypted.created_at)
        };
    }

    getRecord(hash: string, provider: EncryptionProvider): Promise<RecordEntry> {
        const tsn = this._db.transaction([this._storeName], "readonly");
        const dataStore = tsn.objectStore(this._storeName);
        const request: IDBRequest<RecordDbEntry> = dataStore.get(hash);
        return new Promise((resolve, reject) => {
            request.addEventListener("success", () => {
                if (!request.result) {
                    this._logger.debug("Could not find the requested file's data.", { tsn, hash, request });
                    reject(new RecordNotFoundError("File not found."));
                }
                try {
                    const decryptedResult: RecordDbEntryEncryptedData = JSON.parse(provider.decrypt(request.result.encrypted));
                    resolve(this._transformDbEntryToEntry(request.result, decryptedResult));
                } catch (cause) {
                    this._logger.debug("Record data could not be retrieved.", { tsn, hash, cause });
                    reject(
                        new Error("Record data could not be retrieved.")
                    );
                }
            });
            request.addEventListener("error", () => {
                this._logger.debug("Could not retrieve file data.", { tsn, hash, request });
                reject(new Error("Could not retrieve file data."));
            });
        });
    }

    searchRecords(searchRequest: RecordSearchRequest, provider: EncryptionProvider): Promise<RecordEntry[]> {
        const tsn = this._db.transaction([this._storeName], "readonly");
        const dataStore = tsn.objectStore(this._storeName);
        const request = dataStore.openCursor();
        if (!request)
            return Promise.resolve([]);

        const entries: RecordEntry[] = [];

        return new Promise((resolve, reject) => {
            request.addEventListener("success", () => {
                if (!request.result)
                    return resolve(entries);

                try {
                    const dbEntry: RecordDbEntry = request.result.value;
                    const encrypted: RecordDbEntryEncryptedData = JSON.parse(provider.decrypt(dbEntry.encrypted));
                    entries.push(this._transformDbEntryToEntry(dbEntry, encrypted));
                    request.result.continue();
                } catch (cause) {
                    this._logger.debug("Record data could not be retrieved.", { tsn, cause });
                    reject(
                        new Error("Record data could not be retrieved.")
                    );
                }
            });
            request.addEventListener("error", () => {
                this._logger.debug("Could not retrieve file data.", { tsn, request });
                reject(new Error("Could not retrieve file data."));
            });
        });
    }

    addRecord(form: RecordForm, provider: EncryptionProvider): Promise<void> {
        const tsn = this._db.transaction([this._storeName], "readwrite");
        const dataStore = tsn.objectStore(this._storeName);
        const hash = Date.now().toString();
        const dataEntry: RecordDbEntryEncryptedData = {
            ...form,
            created_at: LocalDateTime.now().toString()
        };
        const encrypted = provider.encrypt(JSON.stringify(dataEntry));
        const dbEntry: RecordDbEntry = {
            hash,
            encrypted
        };
        const request: IDBRequest<IDBValidKey> = dataStore.add(dbEntry);
        return new Promise((resolve, reject) => {
            request.addEventListener("success", () => {
                if (!request.result) {
                    this._logger.debug("Could not add a new record.", { tsn, hash, request });
                    reject(new RecordNotFoundError("File not found."));
                    return;
                }

                resolve();
            });
            request.addEventListener("error", () => {
                this._logger.debug("Could not add a new record.", { tsn, hash, request });
                reject(new Error("Could not add a new record."));
            });
        });
    }

    onDbUpgrade(db: IDBDatabase): void {
        const metadataStore = db.createObjectStore(
            this._storeName,
            { keyPath: "hash" }
        );

        metadataStore.createIndex("hash", "hash", { unique: true });
        metadataStore.createIndex("encrypted", "encrypted", { unique: false });
    }
}

export const recordService = new RecordService(dbService);
dbService.addConsumer(recordService);
