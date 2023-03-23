import { Logger } from "@hdapp/shared/web2-common/utils/logger";
import { DbService, IDbConsumer } from "./db.service";

export class DbRecordNotFoundError extends Error {}

export abstract class DbConsumer implements IDbConsumer {
    protected abstract _storeName: string;
    protected abstract _db: DbService;
    protected readonly _logger: Logger;

    constructor(
        ...loggerScope: string[]
    ) {
        this._logger = new Logger(...loggerScope);
    }

    protected _findOne<K extends IDBValidKey, DbT, T>(
        key: K,
        processor: (dbEntity: DbT) => T
    ): Promise<T> {
        const tsn = this._db.transaction([this._storeName], "readonly");
        const dataStore = tsn.objectStore(this._storeName);
        const request: IDBRequest<DbT> = dataStore.get(key);
        return new Promise((resolve, reject) => {
            request.addEventListener("success", () => {
                if (!request.result) {
                    this._logger.debug("Could not find the record.", { tsn, key, request });
                    reject(new DbRecordNotFoundError("Record not found."));
                }
                try {
                    resolve(processor(request.result));
                } catch (cause) {
                    this._logger.debug("Record could not be retrieved.", { tsn, key, cause });
                    reject(
                        new Error("Record could not be retrieved.")
                    );
                }
            });
            request.addEventListener("error", () => {
                this._logger.debug("Could not retrieve file data.", { tsn, key, request });
                reject(new Error("Could not retrieve file data."));
            });
        });
    }

    protected _findMany<DbT, T>(
        processor: (dbEntity: DbT) => T,
        predicate: (entity: T) => boolean
    ): Promise<T[]> {
        const tsn = this._db.transaction([this._storeName], "readonly");
        const dataStore = tsn.objectStore(this._storeName);
        const request = dataStore.openCursor();
        if (!request)
            return Promise.resolve([]);

        const entries: T[] = [];

        return new Promise((resolve, reject) => {
            request.addEventListener("success", () => {
                if (!request.result)
                    return resolve(entries);

                try {
                    const entry = processor(request.result.value);
                    if (predicate(entry))
                        entries.push(entry);

                    request.result.continue();
                } catch (cause) {
                    this._logger.debug("Records could not be retrieved.", { tsn, cause });
                    reject(
                        new Error("Records could not be retrieved.")
                    );
                }
            });
            request.addEventListener("error", () => {
                this._logger.debug("Could not retrieve records.", { tsn, request });
                reject(new Error("Could not retrieve records."));
            });
        });
    }

    protected _patchMany<DbT, T>(
        processor: (dbEntity: DbT) => T,
        patcher: (entity: T) => T | null,
        reverseProcessor: (entity: T) => DbT
    ): Promise<void> {
        const tsn = this._db.transaction([this._storeName], "readwrite");
        const dataStore = tsn.objectStore(this._storeName);
        const request = dataStore.openCursor();
        if (!request)
            return Promise.resolve();

        return new Promise((resolve, reject) => {
            request.addEventListener("success", () => {
                if (!request.result)
                    return resolve();

                try {
                    const entry = processor(request.result.value);
                    const updatedEntry = patcher(request.result.value);
                    if (updatedEntry !== entry && updatedEntry !== null)
                        request.result.update(reverseProcessor(updatedEntry));

                    request.result.continue();
                } catch (cause) {
                    this._logger.debug("Records could not be retrieved.", { tsn, cause });
                    reject(
                        new Error("Records could not be retrieved.")
                    );
                }
            });
            request.addEventListener("error", () => {
                this._logger.debug("Could not retrieve records.", { tsn, request });
                reject(new Error("Could not retrieve records."));
            });
        });
    }

    protected _add<DbT, T>(
        object: T,
        reverseProcessor: (entity: T) => DbT
    ): Promise<T> {
        const tsn = this._db.transaction([this._storeName], "readwrite");
        const dataStore = tsn.objectStore(this._storeName);
        const request: IDBRequest<IDBValidKey> = dataStore.add(
            reverseProcessor(object)
        );
        return new Promise((resolve, reject) => {
            request.addEventListener("success", () => {
                if (!request.result) {
                    this._logger.debug("Could not add a new record.", { tsn, object, request });
                    reject(new DbRecordNotFoundError("Record not found."));
                    return;
                }

                resolve(object);
            });
            request.addEventListener("error", () => {
                this._logger.debug("Could not add a new record.", { tsn, object, request });
                reject(new Error("Could not add a new record."));
            });
        });
    }

    abstract onDbUpgrade(db: IDBDatabase): void;
}
