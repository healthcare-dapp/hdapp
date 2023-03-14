import { Logger } from "@hdapp/shared/web2-common/utils";
import { LocalDateTime } from "@js-joda/core";
import { EncryptionProvider } from "../utils/encryption.provider";
import { dbService, DbService, IDbConsumer } from "./db.service";
import { makeAutoObservable } from "mobx";

interface FileBlobDbEntry {
    hash: string
    mimeType: string
    blob: string
}

interface FileMetadataDbEntry {
    hash: string
    name: string
    owner: string
    type: string
    uploaded_at: string
}

export interface FileEntry {
    hash: string
    name: string
    owner: string
    type: string
    uploaded_at: LocalDateTime
}

export class FileNotFoundError extends Error {}

export class FileService implements IDbConsumer {
    private readonly _metadataStoreName = "files";
    private readonly _blobStoreName = "file_blobs";

    private readonly _logger = new Logger("file-service");

    constructor(private _db: DbService) {
        makeAutoObservable(this, {}, { autoBind: true });
    }

    private _transformDbEntryToEntry(dbEntry: FileMetadataDbEntry): FileEntry {
        return {
            hash: dbEntry.hash,
            name: dbEntry.name,
            owner: dbEntry.owner,
            type: dbEntry.type,
            uploaded_at: LocalDateTime.parse(dbEntry.uploaded_at)
        };
    }

    getFileBlob(hash: string, provider: EncryptionProvider): Promise<Blob> {
        const tsn = this._db.transaction([this._blobStoreName], "readonly");
        const blobStore = tsn.objectStore(this._blobStoreName);
        const request: IDBRequest<FileBlobDbEntry> = blobStore.get(hash);
        return new Promise((resolve, reject) => {
            request.addEventListener("success", () => {
                if (!request.result) {
                    this._logger.debug("Could not find the requested file's blob.", { tsn, hash, request });
                    reject(new FileNotFoundError("File not found."));
                }
                try {
                    const decryptedResult = provider.decryptString(request.result.blob);
                    resolve(
                        new Blob(
                            [decryptedResult],
                            { type: "image/jpeg" }
                        )
                    );
                } catch (cause) {
                    this._logger.debug("File blob could not be retrieved.", { tsn, hash, cause });
                    reject(
                        new Error("File blob could not be retrieved.")
                    );
                }
            });
            request.addEventListener("error", () => {
                this._logger.debug("Could not retrieve file blob.", { tsn, hash, request });
                reject(new Error("Could not retrieve file blob."));
            });
        });
    }

    getFileMetadata(hash: string): Promise<FileEntry> {
        const tsn = this._db.transaction([this._metadataStoreName], "readonly");
        const metadataStore = tsn.objectStore(this._metadataStoreName);
        const request: IDBRequest<FileMetadataDbEntry> = metadataStore.get(hash);
        return new Promise((resolve, reject) => {
            request.addEventListener("success", () => {
                if (!request.result) {
                    this._logger.debug("Could not find the requested file's metadata.", { tsn, hash, request });
                    reject(new FileNotFoundError("File not found."));
                }
                try {
                    resolve(this._transformDbEntryToEntry(request.result));
                } catch (cause) {
                    this._logger.debug("Could not convert file metadata.", { tsn, hash, cause });
                    reject(new Error("Could not convert file metadata."));
                }
            });
            request.addEventListener("error", () => {
                this._logger.debug("Could not retrieve file metadata.", { tsn, hash, request });
                reject(new Error("Could not retrieve file metadata."));
            });
        });
    }

    getFiles(): Promise<FileEntry[]> {
        const tsn = this._db.transaction([this._metadataStoreName], "readonly");
        const metadataStore = tsn.objectStore(this._metadataStoreName);
        const request: IDBRequest<FileMetadataDbEntry[]> = metadataStore.getAll();
        return new Promise((resolve, reject) => {
            request.addEventListener("success", () => {
                if (!request.result) {
                    this._logger.debug("Could not list files.", { tsn, request });
                    reject(new Error("Could not list files."));
                }

                resolve(
                    request.result.map(
                        dbEntry => this._transformDbEntryToEntry(dbEntry)
                    )
                );
            });
            request.addEventListener("error", () => {
                this._logger.debug("Could not retrieve files.", { tsn, request });
                reject(new Error("Could not retrieve files."));
            });
        });
    }

    async uploadFile(file: File, owner: string, provider: EncryptionProvider): Promise<string> {
        const arrayBuffer = await new Promise<ArrayBuffer>(resolve => {
            const fileReader = new FileReader();
            fileReader.onload = function (event) {
                resolve(event.target!.result as ArrayBuffer);
            };
            fileReader.readAsArrayBuffer(file);
        });
        const encryptedBlob = provider.encryptArrayBuffer(new Uint8Array(arrayBuffer));
        const tsn = this._db.transaction([
            this._blobStoreName,
            this._metadataStoreName
        ], "readwrite");
        const blobStore = tsn.objectStore(this._blobStoreName);
        const metadataStore = tsn.objectStore(this._metadataStoreName);
        const hash = Date.now().toString();
        const metadata: FileMetadataDbEntry = {
            hash,
            name: file.name,
            owner,
            type: file.type,
            uploaded_at: LocalDateTime.now().toJSON()
        };
        const blobRequest: IDBRequest<IDBValidKey> = blobStore.put({ hash, blob: encryptedBlob });
        const metadataRequest: IDBRequest<IDBValidKey> = metadataStore.put(metadata);
        await Promise.all([
            new Promise<void>((resolve, reject) => {
                blobRequest.addEventListener("success", () => {
                    if (!blobRequest.result) {
                        this._logger.debug("Could not find the requested file's blob.", { tsn, hash });
                        reject(new FileNotFoundError("File not found."));
                    }
                    resolve();
                });
                blobRequest.addEventListener("error", () => {
                    this._logger.debug("Could not retrieve file blob.", { tsn, hash });
                    reject(new Error("Could not retrieve file blob."));
                });
            }),
            new Promise<void>((resolve, reject) => {
                metadataRequest.addEventListener("success", () => {
                    if (!metadataRequest.result) {
                        this._logger.debug("Could not find the requested file's blob.", { tsn, hash });
                        reject(new FileNotFoundError("File not found."));
                    }
                    resolve();
                });
                metadataRequest.addEventListener("error", () => {
                    this._logger.debug("Could not retrieve file blob.", { tsn, hash });
                    reject(new Error("Could not retrieve file blob."));
                });
            }),
        ]);

        return hash;
    }

    onDbUpgrade(db: IDBDatabase): void {
        const metadataStore = db.createObjectStore(
            this._metadataStoreName,
            { keyPath: "hash" }
        );

        metadataStore.createIndex("hash", "hash", { unique: true });
        metadataStore.createIndex("name", "name", { unique: false });
        metadataStore.createIndex("owner", "owner", { unique: false });
        metadataStore.createIndex("type", "type", { unique: false });
        metadataStore.createIndex("uploaded_at", "uploaded_at", { unique: false });

        const blobStore = db.createObjectStore(
            this._blobStoreName,
            { keyPath: "hash" }
        );
        blobStore.createIndex("hash", "hash", { unique: true });
        blobStore.createIndex("blob", "blob", { unique: false });
    }
}

export const fileService = new FileService(dbService);
dbService.addConsumer(fileService);
