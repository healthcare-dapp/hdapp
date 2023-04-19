import { autoBind } from "@hdapp/shared/web2-common/utils";
import { Instant, LocalDateTime } from "@js-joda/core";
import { SHA256 } from "crypto-js";
import { DbConsumer, DbRecordNotFoundError } from "./db.consumer";
import { DbService } from "./db.service";

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

const transformer = (dbEntry: BlockDbEntry): BlockEntry => {
    return {
        hash: dbEntry.hash,
        friendly_name: dbEntry.friendly_name,
        created_by: dbEntry.created_by,
        meta_tag_ids: dbEntry.meta_tag_ids,
        owned_by: dbEntry.owned_by,
        created_at: LocalDateTime.parse(dbEntry.created_at)
    };
};

const reverseTransformer = (entry: BlockEntry): BlockDbEntry => {
    return {
        hash: entry.hash,
        friendly_name: entry.friendly_name,
        created_by: entry.created_by,
        meta_tag_ids: entry.meta_tag_ids,
        owned_by: entry.owned_by,
        created_at: entry.created_at.toString()
    };
};

export class BlockService extends DbConsumer {
    protected readonly _storeName = "blocks";

    constructor(protected _db: DbService) {
        super("block-service");

        autoBind(this);
    }

    async getBlock(hash: string): Promise<BlockEntry> {
        try {
            const entity = await this._findOne(hash, transformer);
            return entity;
        } catch (e) {
            if (e instanceof DbRecordNotFoundError)
                throw new BlockNotFoundError("Block was not found.");

            throw e;
        }
    }

    async getBlocks(): Promise<BlockEntry[]> {
        try {
            const devices = await this._findMany(
                transformer,
                () => true
            );
            return devices;
        } catch (e) {
            if (e instanceof DbRecordNotFoundError)
                throw new BlockNotFoundError("Block was not found.");

            throw e;
        }
    }

    async addBlock(form: BlockForm): Promise<BlockEntry> {
        try {
            const hash = SHA256(Instant.now().toString() + " " + form.friendly_name + " " + form.owned_by).toString();
            const block = await this._add({
                ...form,
                hash,
                created_at: LocalDateTime.now()
            }, reverseTransformer);
            return block;
        } catch (e) {
            if (e instanceof DbRecordNotFoundError)
                throw new BlockNotFoundError("Block was not found.");

            throw e;
        }
    }

    async patchBlock(hash: string, form: BlockForm): Promise<void> {
        try {
            await this._patchOne(hash, form, transformer, reverseTransformer);
        } catch (e) {
            if (e instanceof DbRecordNotFoundError)
                throw new BlockNotFoundError("Block was not found.");

            throw e;
        }
    }

    async upsertBlock(record: BlockEntry): Promise<void> {
        try {
            await this._upsertOne(record, reverseTransformer);
        } catch (e) {
            if (e instanceof DbRecordNotFoundError)
                throw new BlockNotFoundError("Block was not found.");

            throw e;
        }
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
