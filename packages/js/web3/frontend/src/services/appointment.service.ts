import { autoBind } from "@hdapp/shared/web2-common/utils/auto-bind";
import { Instant, LocalDate, LocalDateTime } from "@js-joda/core";
import { SHA256 } from "crypto-js";
import { EncryptionProvider } from "../utils/encryption.provider";
import { superIncludes } from "../utils/super-includes";
import { DbConsumer, DbRecordNotFoundError } from "./db.consumer";
import { DbService } from "./db.service";

interface AppointmentDbEntry {
    hash: string
    encrypted: string
}

interface AppointmentDbEntryEncryptedData {
    title: string
    description: string
    location: string
    created_at: string
    created_by: string
    participant_ids: string[]
    dateTime: string
}

export interface AppointmentEntry {
    hash: string
    title: string
    description: string
    location: string
    created_at: LocalDateTime
    created_by: string
    participant_ids: string[]
    dateTime: LocalDateTime
}

export interface AppointmentForm {
    title: string
    description: string
    location: string
    created_by: string
    participant_ids: string[]
    dateTime: LocalDateTime
}

export interface AppointmentSearchRequest {
    filters?: {
        query?: string
        created_before?: LocalDate
        created_after?: LocalDate
        created_by?: string
        block_id?: string
        has_attachments?: boolean
        is_archived?: boolean
    }
    sort_by?: "created_at" | "created_by" | "title"
}

export class AppointmentNotFoundError extends Error { }

const transformer = (provider: EncryptionProvider) => (dbEntry: AppointmentDbEntry): AppointmentEntry => {
    const encrypted: AppointmentDbEntryEncryptedData = JSON.parse(
        provider.decrypt(dbEntry.encrypted)
    );

    return {
        hash: dbEntry.hash,
        title: encrypted.title,
        description: encrypted.description,
        created_by: encrypted.created_by,
        location: encrypted.location,
        created_at: LocalDateTime.parse(encrypted.created_at),
        dateTime: LocalDateTime.parse(encrypted.dateTime),
        participant_ids: encrypted.participant_ids,
    };
};

const reverseTransformer = (provider: EncryptionProvider) => (entry: AppointmentEntry): AppointmentDbEntry => {
    const encrypted: AppointmentDbEntryEncryptedData = {
        title: entry.title,
        description: entry.description,
        created_by: entry.created_by,
        location: entry.location,
        participant_ids: entry.participant_ids,
        created_at: entry.created_at.toString(),
        dateTime: entry.dateTime.toString(),
    };

    return {
        hash: entry.hash,
        encrypted: provider.encrypt(JSON.stringify(encrypted))
    };
};

export class AppointmentService extends DbConsumer {
    protected readonly _storeName = "appointments";

    constructor(protected _db: DbService) {
        super("record-service");

        autoBind(this);
    }

    async getAppointment(hash: string, provider: EncryptionProvider): Promise<AppointmentEntry> {
        try {
            const entity = await this._findOne(hash, transformer(provider));
            return entity;
        } catch (e) {
            if (e instanceof DbRecordNotFoundError)
                throw new AppointmentNotFoundError("Appointment was not found.");

            throw e;
        }
    }

    async searchAppointments(request: AppointmentSearchRequest, provider: EncryptionProvider): Promise<AppointmentEntry[]> {
        try {
            const devices = await this._findMany(
                transformer(provider),
                entry => {
                    if (request.filters?.query !== undefined && !superIncludes(request.filters.query, [entry.description, entry.title]))
                        return false;

                    return true;
                }
            );
            return devices;
        } catch (e) {
            if (e instanceof DbRecordNotFoundError)
                throw new AppointmentNotFoundError("Appointment was not found.");

            throw e;
        }
    }

    async addAppointment(form: AppointmentForm, provider: EncryptionProvider): Promise<void> {
        try {
            await this._add({
                ...form,
                is_archived: false,
                hash: SHA256(Instant.now().toString() + " " + form.title + " " + form.created_by).toString(),
                created_at: LocalDateTime.now()
            }, reverseTransformer(provider));
        } catch (e) {
            if (e instanceof DbRecordNotFoundError)
                throw new AppointmentNotFoundError("Appointment was not found.");

            throw e;
        }
    }

    async upsertAppointment(record: AppointmentEntry, provider: EncryptionProvider): Promise<void> {
        try {
            await this._upsertOne(record, reverseTransformer(provider));
        } catch (e) {
            if (e instanceof DbRecordNotFoundError)
                throw new AppointmentNotFoundError("Appointment was not found.");

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
    }
}
