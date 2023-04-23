import { autoBind } from "@hdapp/shared/web2-common/utils";
import { LocalDateTime } from "@js-joda/core";
import { SHA256 } from "crypto-js";
import { DbConsumer, DbRecordNotFoundError } from "./db.consumer";
import { DbService, sharedDbService } from "./db.service";

interface Web3CacheDbEntry {
    hash: string
    response: string
    created_at: string
}

export interface Web3CacheEntry {
    hash: string
    response: string
    created_at: LocalDateTime
}

export class Web3CacheNotFoundError extends Error {}

const transformer = (dbEntry: Web3CacheDbEntry): Web3CacheEntry => {
    return {
        hash: dbEntry.hash,
        response: dbEntry.response,
        created_at: LocalDateTime.parse(dbEntry.created_at)
    };
};

const reverseTransformer = (entry: Web3CacheEntry): Web3CacheDbEntry => {
    return {
        hash: entry.hash,
        response: entry.response,
        created_at: entry.created_at.toString()
    };
};

export class Web3CacheService extends DbConsumer {
    protected readonly _storeName = "blocks";

    constructor(protected _db: DbService) {
        super("block-service");

        autoBind(this);
    }

    async getWeb3Cache(requestObj: unknown): Promise<Web3CacheEntry> {
        const hash = SHA256(JSON.stringify(requestObj)).toString();

        try {
            const entity = await this._findOne(hash, transformer);
            return entity;
        } catch (e) {
            if (e instanceof DbRecordNotFoundError)
                throw new Web3CacheNotFoundError("Web3Cache was not found.");

            throw e;
        }
    }

    async upsertWeb3Cache(requestObj: unknown, responseObj: unknown): Promise<Web3CacheEntry> {
        try {
            const hash = SHA256(JSON.stringify(requestObj)).toString();
            const response = SHA256(JSON.stringify(responseObj)).toString();
            const entity = await this._upsertOne({
                hash,
                response,
                created_at: LocalDateTime.now()
            }, reverseTransformer);
            return entity;
        } catch (e) {
            if (e instanceof DbRecordNotFoundError)
                throw new Web3CacheNotFoundError("Web3Cache was not found.");

            throw e;
        }
    }

    onDbUpgrade(db: IDBDatabase): void {
        const metadataStore = db.createObjectStore(
            this._storeName,
            { keyPath: "hash" }
        );

        metadataStore.createIndex("hash", "hash", { unique: true });
        metadataStore.createIndex("response", "response", { unique: false });
        metadataStore.createIndex("created_at", "created_at", { unique: false });
    }
}

export const web3CacheService = new Web3CacheService(sharedDbService);
sharedDbService.addConsumer(web3CacheService);

// @ts-ignore
BigInt.prototype.toJSON = function () {
    return this.toString();
};

export async function runAndCacheWeb3Call<A extends unknown[], R>(name: string, method: (...args: A) => Promise<R>, ...args: A): Promise<R> {
    const request = { name, args };
    try {
        // @ts-ignore
        const response = await method(...args);
        await web3CacheService.upsertWeb3Cache(request, response);

        return response as R;
    } catch (exception) {
        console.error("web3 operation failed:", { exception, request });
        const cached = await web3CacheService.getWeb3Cache(request);
        if (cached)
            return cached as R;

        throw exception;
    }
}
