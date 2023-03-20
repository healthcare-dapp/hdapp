import { Instant, LocalDateTime } from "@js-joda/core";
import { SHA256 } from "crypto-js";
import { DbConsumer, DbRecordNotFoundError } from "./db.consumer";
import { dbService, DbService } from "./db.service";

interface EventLogDbEntry {
    hash: string
    title: string
    description: string
    created_at: string
}

export interface EventLogEntry {
    hash: string
    title: string
    description: string
    created_at: Instant
}

export interface EventLogForm {
    title: string
    description: string
}

export class EventLogNotFoundError extends Error {}

const transformer = (dbEntry: EventLogDbEntry): EventLogEntry => {
    return {
        hash: dbEntry.hash,
        title: dbEntry.title,
        description: dbEntry.description,
        created_at: Instant.parse(dbEntry.created_at)
    };
};

const reverseTransformer = (entry: EventLogEntry): EventLogDbEntry => {
    return {
        hash: entry.hash,
        title: entry.title,
        description: entry.description,
        created_at: entry.created_at.toString()
    };
};

export class EventLogService extends DbConsumer {
    protected _storeName = "event-logs";

    constructor(protected _db: DbService) {
        super("event-log-service");
    }

    async getEventLogs(): Promise<EventLogEntry[]> {
        try {
            const entities = await this._findMany(transformer, () => true);
            return entities;
        } catch (e) {
            if (e instanceof DbRecordNotFoundError)
                throw new EventLogNotFoundError("Event log was not found.");

            throw e;
        }
    }

    async addEventLog(form: EventLogForm): Promise<void> {
        try {
            const createdAt = Instant.now();
            const eventLog: EventLogEntry = {
                ...form,
                created_at: createdAt,
                hash: SHA256(createdAt.toString() + "-" + form.title + "-" + form.description).toString()
            };
            await this._add(eventLog, reverseTransformer);
        } catch (e) {
            if (e instanceof DbRecordNotFoundError)
                throw new EventLogNotFoundError("Event log was not found.");

            throw e;
        }
    }

    onDbUpgrade(db: IDBDatabase): void {
        const store = db.createObjectStore(
            this._storeName,
            { keyPath: "hash" }
        );

        store.createIndex("hash", "hash", { unique: true });
        store.createIndex("title", "title", { unique: false });
        store.createIndex("description", "description", { unique: false });
        store.createIndex("created_at", "created_at", { unique: false });
    }
}

export const eventLogService = new EventLogService(dbService);
dbService.addConsumer(eventLogService);
