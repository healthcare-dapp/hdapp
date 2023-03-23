import { EncryptionProvider } from "../utils/encryption.provider";
import { DbConsumer, DbRecordNotFoundError } from "./db.consumer";
import { dbService, DbService } from "./db.service";

interface RecordNoteDbEntry {
    hash: string
    address: string
    encryptedText: string
}

export interface RecordNoteEntry {
    hash: string
    address: string
    text: string
}

export class RecordNoteNotFoundError extends Error { }

const transformer = (provider: EncryptionProvider) => (dbEntry: RecordNoteDbEntry): RecordNoteEntry => {
    return {
        hash: dbEntry.hash,
        address: dbEntry.address,
        text: provider.decrypt(dbEntry.encryptedText)
    };
};

const reverseTransformer = (provider: EncryptionProvider) => (entry: RecordNoteEntry): RecordNoteDbEntry => {
    return {
        hash: entry.hash,
        address: entry.address,
        encryptedText: provider.encrypt(entry.text)
    };
};

export class RecordNoteService extends DbConsumer {
    protected readonly _storeName = "records";

    constructor(protected _db: DbService) {
        super("record-service");
    }

    readonly getRecordNote = async (hash: string, provider: EncryptionProvider): Promise<RecordNoteEntry> => {
        try {
            const entity = await this._findOne(hash, transformer(provider));
            return entity;
        } catch (e) {
            if (e instanceof DbRecordNotFoundError)
                throw new RecordNoteNotFoundError("Record was not found.");

            throw e;
        }
    };

    readonly addRecordNote = async (form: RecordNoteEntry, provider: EncryptionProvider): Promise<void> => {
        try {
            await this._add(form, reverseTransformer(provider));
        } catch (e) {
            if (e instanceof DbRecordNotFoundError)
                throw new RecordNoteNotFoundError("Record was not found.");

            throw e;
        }
    };

    onDbUpgrade(db: IDBDatabase): void {
        const metadataStore = db.createObjectStore(
            this._storeName,
            { keyPath: "hash" }
        );

        metadataStore.createIndex("hash", "hash", { unique: true });
        metadataStore.createIndex("address", "address", { unique: false });
        metadataStore.createIndex("encryptedText", "encryptedText", { unique: false });
    }
}

export const recordNoteService = new RecordNoteService(dbService);
dbService.addConsumer(recordNoteService);
