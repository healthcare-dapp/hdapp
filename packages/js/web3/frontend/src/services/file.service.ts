import { autoBind } from "@hdapp/shared/web2-common/utils";
import { Instant, LocalDateTime } from "@js-joda/core";
import { MD5, SHA256 } from "crypto-js";
import { EncryptionProvider } from "../utils/encryption.provider";
import { DbConsumer, DbRecordNotFoundError } from "./db.consumer";
import { DbService, IDbConsumer } from "./db.service";

interface FileBlobDbEntry {
    hash: string
    blob: string
}

interface FileMetadataDbEntry {
    hash: string
    name: string
    owner: string
    type: string
    uploaded_at: string
    byte_length: number
    hash_sum: string
}

export interface FileEntry {
    hash: string
    name: string
    owner: string
    type: string
    uploaded_at: LocalDateTime
    byte_length: number
    hash_sum: string
}

export class FileNotFoundError extends Error {}

const transformer = (dbEntry: FileMetadataDbEntry): FileEntry => {
    return {
        hash: dbEntry.hash,
        name: dbEntry.name,
        owner: dbEntry.owner,
        type: dbEntry.type,
        byte_length: dbEntry.byte_length,
        hash_sum: dbEntry.hash_sum,
        uploaded_at: LocalDateTime.parse(dbEntry.uploaded_at)
    };
};

const blobTransformer = (provider: EncryptionProvider) => (dbEntry: FileBlobDbEntry): Blob => {
    const decryptedResult = provider.decryptString(dbEntry.blob);
    return new Blob(
        [decryptedResult],
        { type: "image/jpeg" }
    );
};

const reverseTransformer = (entry: FileEntry): FileMetadataDbEntry => {
    return {
        hash: entry.hash,
        name: entry.name,
        owner: entry.owner,
        type: entry.type,
        byte_length: entry.byte_length,
        hash_sum: entry.hash_sum,
        uploaded_at: entry.uploaded_at.toString()
    };
};

class FileMetadataService extends DbConsumer {
    protected readonly _storeName = "files";

    constructor(protected _db: DbService) {
        super("file-service");

        autoBind(this);
    }

    async getFileMetadata(hash: string): Promise<FileEntry> {
        try {
            const entity = await this._findOne(hash, transformer);
            return entity;
        } catch (e) {
            if (e instanceof DbRecordNotFoundError)
                throw new FileNotFoundError("File was not found.");

            throw e;
        }
    }

    async getFiles(): Promise<FileEntry[]> {
        try {
            const entities = await this._findMany(transformer, () => true);
            return entities;
        } catch (e) {
            if (e instanceof DbRecordNotFoundError)
                throw new FileNotFoundError("File was not found.");

            throw e;
        }
    }

    async addFileMetadata(
        hash: string,
        hash_sum: string,
        name: string,
        owner_address: string,
        byte_length: number,
        type: string
    ): Promise<void> {
        const metadata: FileEntry = {
            hash,
            hash_sum,
            name,
            owner: owner_address,
            type,
            byte_length,
            uploaded_at: LocalDateTime.now()
        };

        try {
            await this._add(metadata, reverseTransformer);
        } catch (e) {
            if (e instanceof DbRecordNotFoundError)
                throw new FileNotFoundError("File was not found.");
            if (e instanceof DOMException && e.name === "ConstraintError")
                return;
            throw e;
        }
    }

    async upsertFileMetadata(record: FileEntry): Promise<void> {
        try {
            await this._upsertOne(record, reverseTransformer);
        } catch (e) {
            if (e instanceof DbRecordNotFoundError)
                throw new FileNotFoundError("File was not found.");

            throw e;
        }
    }

    onDbUpgrade(db: IDBDatabase): void {
        const store = db.createObjectStore(
            this._storeName,
            { keyPath: "hash" }
        );

        store.createIndex("hash", "hash", { unique: true });
        store.createIndex("name", "name", { unique: false });
        store.createIndex("owner", "owner", { unique: false });
        store.createIndex("type", "type", { unique: false });
        store.createIndex("uploaded_at", "uploaded_at", { unique: false });
    }
}

class FileBlobService extends DbConsumer {
    protected readonly _storeName = "file_blobs";

    constructor(protected _db: DbService) {
        super("file-blob-service");

        autoBind(this);
    }

    async getFileBlob(hash: string, provider: EncryptionProvider): Promise<Blob> {
        try {
            const entity = await this._findOne(hash, blobTransformer(provider));
            return entity;
        } catch (e) {
            if (e instanceof DbRecordNotFoundError)
                throw new FileNotFoundError("File was not found.");

            throw e;
        }
    }

    async getFileBlobHashes(): Promise<string[]> {
        try {
            const entityHashes = await this._findMany((dbEntity: FileBlobDbEntry) => dbEntity.hash, () => true);
            return entityHashes;
        } catch (e) {
            if (e instanceof DbRecordNotFoundError)
                throw new FileNotFoundError("File was not found.");

            throw e;
        }
    }

    async addFileBlob(hash: string, encryptedBlob: string): Promise<void> {
        const metadata: FileBlobDbEntry = {
            hash,
            blob: encryptedBlob
        };

        try {
            await this._add(metadata, a => a);
        } catch (e) {
            if (e instanceof DbRecordNotFoundError)
                throw new FileNotFoundError("File was not found.");
            if (e instanceof DOMException && e.name === "ConstraintError")
                return;
            throw e;
        }
    }

    async upsertFileBlob(hash: string, encryptedBlob: string): Promise<void> {
        const metadata: FileBlobDbEntry = {
            hash,
            blob: encryptedBlob
        };

        try {
            await this._upsertOne(metadata, a => a);
        } catch (e) {
            if (e instanceof DbRecordNotFoundError)
                throw new FileNotFoundError("File was not found.");
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
        store.createIndex("blob", "blob", { unique: false });
    }
}

export class FileService implements IDbConsumer {
    private _metadata: FileMetadataService;
    private _blob: FileBlobService;

    constructor(db: DbService) {
        this._metadata = new FileMetadataService(db);
        this._blob = new FileBlobService(db);

        autoBind(this);
    }

    getFileBlob(hash: string, provider: EncryptionProvider): Promise<Blob> {
        return this._blob.getFileBlob(hash, provider);
    }

    getFileMetadata(hash: string): Promise<FileEntry> {
        return this._metadata.getFileMetadata(hash);
    }

    getFiles(): Promise<FileEntry[]> {
        return this._metadata.getFiles();
    }

    getFileBlobHashes(): Promise<string[]> {
        return this._blob.getFileBlobHashes();
    }

    async uploadFile(blob: Blob, owner: string, provider: EncryptionProvider): Promise<string> {
        const text = await blob.text();
        const hash = SHA256(owner + Instant.now().toString()).toString();
        const hashSum = MD5(text).toString();

        const arrayBuffer = await blob.arrayBuffer();
        const encryptedBlob = provider.encryptArrayBuffer(new Uint8Array(arrayBuffer));

        await this._blob.addFileBlob(hash, encryptedBlob);
        await this._metadata.addFileMetadata(hash, hashSum, blob.name, owner, arrayBuffer.byteLength, blob.type);

        return hash;
    }

    async upsertFileBlob(hash: string, blob: Blob, provider: EncryptionProvider): Promise<string> {
        const arrayBuffer = await blob.arrayBuffer();
        const encryptedBlob = provider.encryptArrayBuffer(new Uint8Array(arrayBuffer));

        await this._blob.upsertFileBlob(hash, encryptedBlob);
        return hash;
    }

    async upsertFileMetadata(record: FileEntry): Promise<void> {
        try {
            await this._metadata.upsertFileMetadata(record);
        } catch (e) {
            if (e instanceof DbRecordNotFoundError)
                throw new FileNotFoundError("File was not found.");

            throw e;
        }
    }

    onDbUpgrade(db: IDBDatabase): void {
        this._metadata.onDbUpgrade(db);
        this._blob.onDbUpgrade(db);
    }
}
