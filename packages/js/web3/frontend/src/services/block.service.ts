import { Logger } from "@hdapp/shared/web2-common/utils";
import { LocalDateTime } from "@js-joda/core";
import { makeAutoObservable } from "mobx";
import { dbService, DbService, IDbConsumer } from "./db.service";

interface BlockDbEntry {
    hash: string
    friendly_name: string
    meta_tag_ids: string[]
    created_by: string
    owned_by: string
    created_at: string
}

export interface BlockEntry {
    hash: string
    friendly_name: string
    meta_tag_ids: string[]
    created_by: string
    owned_by: string
    created_at: LocalDateTime
}

export interface BlockForm {
    friendly_name: string
    meta_tag_ids: string[]
    created_by: string
    owned_by: string
}

export interface BlockSearchRequest {
    filters?: {
        query?: string | null
    }
    sort_by?: "friendly_name" | null
}

export class BlockNotFoundError extends Error {}

export class BlockService implements IDbConsumer {
    private readonly _storeName = "blocks";

    private readonly _logger = new Logger("block-service");

    constructor(private _db: DbService) {
        makeAutoObservable(this, {}, { autoBind: true });
    }

    private _transformDbEntryToEntry(dbEntry: BlockDbEntry): BlockEntry {
        return {
            hash: dbEntry.hash,
            friendly_name: dbEntry.friendly_name,
            created_by: dbEntry.created_by,
            meta_tag_ids: dbEntry.meta_tag_ids,
            owned_by: dbEntry.owned_by,
            created_at: LocalDateTime.parse(dbEntry.created_at)
        };
    }

    getBlock(hash: string): Promise<BlockEntry> {
        const tsn = this._db.transaction([this._storeName], "readonly");
        const dataStore = tsn.objectStore(this._storeName);
        const request: IDBRequest<BlockDbEntry> = dataStore.get(hash);
        return new Promise((resolve, reject) => {
            request.addEventListener("success", () => {
                if (!request.result) {
                    this._logger.debug("Could not find the requested file's data.", { tsn, hash, request });
                    reject(new BlockNotFoundError("File not found."));
                }
                try {
                    resolve(this._transformDbEntryToEntry(request.result));
                } catch (cause) {
                    this._logger.debug("Block data could not be retrieved.", { tsn, hash, cause });
                    reject(
                        new Error("Block data could not be retrieved.")
                    );
                }
            });
            request.addEventListener("error", () => {
                this._logger.debug("Could not retrieve file data.", { tsn, hash, request });
                reject(new Error("Could not retrieve file data."));
            });
        });
    }

    getBlocks(): Promise<BlockEntry[]> {
        const tsn = this._db.transaction([this._storeName], "readonly");
        const dataStore = tsn.objectStore(this._storeName);
        const request = dataStore.openCursor();
        if (!request)
            return Promise.resolve([]);

        const entries: BlockEntry[] = [];

        return new Promise((resolve, reject) => {
            request.addEventListener("success", () => {
                if (!request.result)
                    return resolve(entries);

                try {
                    const dbEntry: BlockDbEntry = request.result.value;
                    const entry: BlockEntry = this._transformDbEntryToEntry(dbEntry);
                    entries.push(entry);
                    request.result.continue();
                } catch (cause) {
                    this._logger.debug("Block data could not be retrieved.", { tsn, cause });
                    reject(
                        new Error("Block data could not be retrieved.")
                    );
                }
            });
            request.addEventListener("error", () => {
                this._logger.debug("Could not retrieve file data.", { tsn, request });
                reject(new Error("Could not retrieve file data."));
            });
        });
    }

    addBlock(form: BlockForm): Promise<void> {
        const tsn = this._db.transaction([this._storeName], "readwrite");
        const dataStore = tsn.objectStore(this._storeName);
        const hash = Date.now().toString();
        const dbEntry: BlockDbEntry = {
            ...form,
            hash,
            created_at: LocalDateTime.now().toString(),
        };
        const request: IDBRequest<IDBValidKey> = dataStore.add(dbEntry);
        return new Promise((resolve, reject) => {
            request.addEventListener("success", () => {
                if (!request.result) {
                    this._logger.debug("Could not add a new record.", { tsn, hash, request });
                    reject(new BlockNotFoundError("File not found."));
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
        metadataStore.createIndex("friendly_name", "friendly_name", { unique: false });
        metadataStore.createIndex("meta_tag_ids", "meta_tag_ids", { unique: false });
        metadataStore.createIndex("created_by", "created_by", { unique: false });
        metadataStore.createIndex("owned_by", "owned_by", { unique: false });
        metadataStore.createIndex("created_at", "created_at", { unique: false });
    }
}

export const blockService = new BlockService(dbService);
dbService.addConsumer(blockService);
