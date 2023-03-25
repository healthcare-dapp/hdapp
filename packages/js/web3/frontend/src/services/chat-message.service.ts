import { Instant, LocalDate, LocalDateTime } from "@js-joda/core";
import { SHA256 } from "crypto-js";
import { EncryptionProvider } from "../utils/encryption.provider";
import { DbConsumer, DbRecordNotFoundError } from "./db.consumer";
import { dbService, DbService } from "./db.service";

interface ChatMessageDbEntry {
    hash: string
    encrypted: string
    created_at: string
}

interface ChatMessageDbEntryEncryptedData {
    content: string
    attachment_ids: string[]
    created_by: string
    chat_hash: string
}

export interface ChatMessageEntry {
    hash: string
    content: string
    attachment_ids: string[]
    created_by: string
    created_at: LocalDateTime
    chat_hash: string
}

export interface ChatMessageForm {
    content: string
    attachment_ids: string[]
    created_by: string
    chat_hash: string
}

export interface ChatMessageSearchRequest {
    filters?: {
        query?: string | null
        created_by?: string | null
        has_attachments?: string | null
        from_date?: LocalDate | null
        to_date?: LocalDate | null
        chat_hash?: string | null
    }
    sort_by?: "created_at" | null
    limit?: number
}

export class ChatMessageNotFoundError extends Error { }

const transformer = (provider: EncryptionProvider) => (dbEntry: ChatMessageDbEntry): ChatMessageEntry => {
    const encrypted: ChatMessageDbEntryEncryptedData = JSON.parse(
        provider.decrypt(dbEntry.encrypted)
    );

    return {
        hash: dbEntry.hash,
        attachment_ids: encrypted.attachment_ids,
        created_by: encrypted.created_by,
        content: encrypted.content,
        chat_hash: encrypted.chat_hash,
        created_at: LocalDateTime.parse(dbEntry.created_at)
    };
};

const reverseTransformer = (provider: EncryptionProvider) => (entry: ChatMessageEntry): ChatMessageDbEntry => {
    const encrypted: ChatMessageDbEntryEncryptedData = {
        attachment_ids: entry.attachment_ids,
        created_by: entry.created_by,
        content: entry.content,
        chat_hash: entry.chat_hash,
    };

    return {
        hash: entry.hash,
        encrypted: provider.encrypt(JSON.stringify(encrypted)),
        created_at: entry.created_at.toString()
    };
};

export class ChatMessageService extends DbConsumer {
    protected readonly _storeName = "chat-messages";

    constructor(protected _db: DbService) {
        super("chat-message-service");
    }

    readonly getChatMessage = async (hash: string, provider: EncryptionProvider): Promise<ChatMessageEntry> => {
        try {
            const entity = await this._findOne(hash, transformer(provider));
            return entity;
        } catch (e) {
            if (e instanceof DbRecordNotFoundError)
                throw new ChatMessageNotFoundError("Chat message was not found.");

            throw e;
        }
    };

    readonly searchChatMessages = async (request: ChatMessageSearchRequest, provider: EncryptionProvider): Promise<ChatMessageEntry[]> => {
        try {
            const devices = await this._findMany(
                transformer(provider),
                message => {
                    if (request.filters?.chat_hash && message.chat_hash !== request.filters.chat_hash)
                        return false;

                    return true;
                },
                request.limit,
                request.sort_by ?? void 0,
                "prev"
            );
            return devices;
        } catch (e) {
            if (e instanceof DbRecordNotFoundError)
                throw new ChatMessageNotFoundError("Chat message was not found.");

            throw e;
        }
    };

    readonly addChatMessage = async (form: ChatMessageForm, provider: EncryptionProvider): Promise<void> => {
        try {
            await this._add({
                ...form,
                hash: SHA256(Instant.now().toString() + " " + form.content + " " + form.created_by).toString(),
                created_at: LocalDateTime.now()
            }, reverseTransformer(provider));
        } catch (e) {
            if (e instanceof DbRecordNotFoundError)
                throw new ChatMessageNotFoundError("Chat message was not found.");

            throw e;
        }
    };

    async upsertChatMessage(record: ChatMessageEntry, provider: EncryptionProvider): Promise<void> {
        try {
            await this._upsertOne(record, reverseTransformer(provider));
        } catch (e) {
            if (e instanceof DbRecordNotFoundError)
                throw new ChatMessageNotFoundError("Chat message was not found.");

            throw e;
        }
    }

    onDbUpgrade(db: IDBDatabase): void {
        const metadataStore = db.createObjectStore(
            this._storeName,
            { keyPath: "hash" }
        );

        metadataStore.createIndex("hash", "hash", { unique: true });
        metadataStore.createIndex("encrypted", "encrypted", { unique: false });
        metadataStore.createIndex("created_at", "created_at", { unique: false });
    }
}

export const chatMessageService = new ChatMessageService(dbService);
dbService.addConsumer(chatMessageService);
