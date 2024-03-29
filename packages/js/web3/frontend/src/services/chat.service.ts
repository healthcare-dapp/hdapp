import { autoBind } from "@hdapp/shared/web2-common/utils/auto-bind";
import { Instant, LocalDateTime } from "@js-joda/core";
import { SHA256 } from "crypto-js";
import { DbConsumer, DbRecordNotFoundError } from "./db.consumer";
import { DbService } from "./db.service";

interface ChatDbEntry {
    hash: string
    friendly_name: string
    participant_ids: string[]
    created_at: string
}

export interface ChatEntry {
    hash: string
    friendly_name: string
    participant_ids: string[]
    created_at: LocalDateTime
}

export interface ChatForm {
    friendly_name: string
    participant_ids: string[]
}

export interface ChatSearchRequest {
    filters?: {
        query?: string | null
    }
    sort_by?: "created_by" | null
    limit?: number
}

export class ChatNotFoundError extends Error { }

const transformer = (dbEntry: ChatDbEntry): ChatEntry => {
    return {
        hash: dbEntry.hash,
        friendly_name: dbEntry.friendly_name,
        participant_ids: dbEntry.participant_ids,
        created_at: LocalDateTime.parse(dbEntry.created_at)
    };
};

const reverseTransformer = (entry: ChatEntry): ChatDbEntry => {
    return {
        hash: entry.hash,
        friendly_name: entry.friendly_name,
        participant_ids: entry.participant_ids,
        created_at: entry.created_at.toString()
    };
};

export class ChatService extends DbConsumer {
    protected readonly _storeName = "chats";

    constructor(protected _db: DbService) {
        super("chat-service");

        autoBind(this);
    }

    async getChat(hash: string): Promise<ChatEntry> {
        try {
            const entity = await this._findOne(hash, transformer);
            return entity;
        } catch (e) {
            if (e instanceof DbRecordNotFoundError)
                throw new ChatNotFoundError("Chat was not found.");

            throw e;
        }
    }

    async searchChats(request: ChatSearchRequest): Promise<ChatEntry[]> {
        try {
            const devices = await this._findMany(
                transformer,
                () => true,
                request.limit
            );
            return devices;
        } catch (e) {
            if (e instanceof DbRecordNotFoundError)
                throw new ChatNotFoundError("Chat was not found.");

            throw e;
        }
    }

    async addChat(form: ChatForm): Promise<void> {
        try {
            await this._add({
                ...form,
                hash: SHA256(Instant.now().toString() + " " + form.participant_ids.join(",") + " " + form.friendly_name).toString(),
                created_at: LocalDateTime.now()
            }, reverseTransformer);
        } catch (e) {
            if (e instanceof DbRecordNotFoundError)
                throw new ChatNotFoundError("Chat was not found.");

            throw e;
        }
    }

    async upsertChat(record: ChatEntry): Promise<void> {
        try {
            await this._upsertOne(record, reverseTransformer);
        } catch (e) {
            if (e instanceof DbRecordNotFoundError)
                throw new ChatNotFoundError("Chat was not found.");

            throw e;
        }
    }

    onDbUpgrade(db: IDBDatabase): IDBObjectStore {
        const store = db.createObjectStore(
            this._storeName,
            { keyPath: "hash" }
        );

        store.createIndex("hash", "hash", { unique: true });
        store.createIndex("friendly_name", "friendly_name", { unique: false });
        store.createIndex("created_at", "created_at", { unique: false });
        store.createIndex("participant_ids", "participant_ids", { unique: false });

        return store;
    }
}
