import { Instant, LocalDateTime } from "@js-joda/core";
import { MD5, SHA256 } from "crypto-js";
import { DbConsumer, DbRecordNotFoundError } from "./db.consumer";
import { dbService, DbService } from "./db.service";

interface EventLogDbEntry {
    hash: string
    title: string
    description: string
    created_at: string
    created_by: string
    related_entities: RelatedEntity[]
}

interface RelatedEntity {
    type: string
    value: string
}

export interface EventLogEntry {
    hash: string
    title: string
    description: string
    created_at: Instant
    created_by: string
    related_entities: RelatedEntity[]
}

export interface EventLogForm {
    title: string
    description: string
    created_by: string
    related_entities: RelatedEntity[]
}

export class EventLogNotFoundError extends Error {}

const transformer = (dbEntry: EventLogDbEntry): EventLogEntry => {
    return {
        hash: dbEntry.hash,
        title: dbEntry.title,
        description: dbEntry.description,
        created_by: dbEntry.created_by,
        related_entities: dbEntry.related_entities,
        created_at: Instant.parse(dbEntry.created_at)
    };
};

const reverseTransformer = (entry: EventLogEntry): EventLogDbEntry => {
    return {
        hash: entry.hash,
        title: entry.title,
        description: entry.description,
        created_by: entry.created_by,
        related_entities: entry.related_entities,
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

    async getEventLogsWithRelatedEntity(relatedEntity: RelatedEntity): Promise<EventLogEntry[]> {
        try {
            const entities = await this._findMany(
                transformer,
                entity => entity.related_entities.some(re => re.type === relatedEntity.type && re.value === relatedEntity.value)
            );
            return entities;
        } catch (e) {
            if (e instanceof DbRecordNotFoundError)
                throw new EventLogNotFoundError("Event log was not found.");

            throw e;
        }
    }

    async addEventLog(form: EventLogForm): Promise<void> {
        const hash = MD5(JSON.stringify(form)).toString();
        const eventLog: EventLogEntry = {
            ...form,
            created_at: Instant.now(),
            hash
        };

        try {
            await this._add(eventLog, reverseTransformer);
        } catch (e) {
            if (e instanceof DbRecordNotFoundError)
                throw new EventLogNotFoundError("Event log was not found.");
            if (e instanceof DOMException && e.name === "ConstraintError")
                return;
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
