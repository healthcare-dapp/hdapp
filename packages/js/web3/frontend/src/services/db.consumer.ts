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

        const stack = [new Error().stack];
        this._logger.debug("Find one transaction", { key, storeName: this._storeName, stack });

        return new Promise((resolve, reject) => {
            request.addEventListener("success", () => {
                if (!request.result) {
                    this._logger.debug("Could not find the record.", { tsn, key, request });
                    return reject(new DbRecordNotFoundError("Record not found."));
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

    protected _removeOne<K extends IDBValidKey>(
        key: K
    ): Promise<void> {
        const tsn = this._db.transaction([this._storeName], "readwrite");
        const dataStore = tsn.objectStore(this._storeName);
        const request = dataStore.delete(key);

        const stack = [new Error().stack];
        this._logger.debug("Remove one transaction", { key, storeName: this._storeName, stack });

        return new Promise((resolve, reject) => {
            request.addEventListener("success", () => {
                if (request.result !== undefined) {
                    this._logger.debug("Could not find the record.", { tsn, key, request });
                    return reject(new DbRecordNotFoundError("Record not found."));
                }

                resolve();
            });
            request.addEventListener("error", () => {
                this._logger.debug("Could not retrieve file data.", { tsn, key, request });
                reject(new Error("Could not retrieve file data."));
            });
        });
    }

    protected _findMany<DbT, T>(
        processor: (dbEntity: DbT) => T,
        predicate: (entity: T) => boolean,
        limit?: number,
        index?: string,
        cursorDirection?: IDBCursorDirection
    ): Promise<T[]> {
        const tsn = this._db.transaction([this._storeName], "readonly");
        const dataStore = tsn.objectStore(this._storeName);
        const request = index
            ? dataStore.index(index).openCursor(undefined, cursorDirection)
            : dataStore.openCursor(undefined, cursorDirection);
        if (!request)
            return Promise.resolve([]);

        const stack = [new Error().stack];
        this._logger.debug("Find many transaction", { storeName: this._storeName, stack });

        const entries: T[] = [];

        return new Promise((resolve, reject) => {
            request.addEventListener("success", () => {
                if (!request.result)
                    return resolve(entries);

                try {
                    const entry = processor(request.result.value);
                    if (predicate(entry))
                        entries.push(entry);

                    if (limit && entries.length === limit)
                        return resolve(entries);

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

    protected _upsertOne<DbT, T>(
        object: T,
        reverseProcessor: (entity: T) => DbT
    ): Promise<T> {
        const tsn = this._db.transaction([this._storeName], "readwrite");
        const dataStore = tsn.objectStore(this._storeName);
        const request: IDBRequest<IDBValidKey> = dataStore.put(reverseProcessor(object));

        const stack = [new Error().stack];
        this._logger.debug("Upsert one transaction", { object, storeName: this._storeName, stack });

        return new Promise((resolve, reject) => {
            request.addEventListener("success", () => {
                if (!request.result) {
                    this._logger.debug("Could not find the record.", { tsn, request });
                    return reject(new DbRecordNotFoundError("Record not found."));
                }
                try {
                    resolve(object);
                } catch (cause) {
                    this._logger.debug("Record could not be retrieved.", { tsn, cause });
                    reject(
                        new Error("Record could not be retrieved.")
                    );
                }
            });
            request.addEventListener("error", () => {
                this._logger.debug("Could not retrieve file data.", { tsn, request });
                reject(new Error("Could not retrieve file data."));
            });
        });
    }

    protected async _patchOne<K extends IDBValidKey, DbT, T>(
        key: K,
        partialObject: Partial<T> | ((object: T) => T),
        processor: (dbEntity: DbT) => T,
        reverseProcessor: (entity: T) => DbT
    ): Promise<T> {
        let object: T = await this._findOne<K, DbT, T>(key, processor);

        if (typeof partialObject === "function")
            object = partialObject(object);
        else
            object = Object.assign({}, object, partialObject);

        return await this._upsertOne(object, reverseProcessor);
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

        const stack = [new Error().stack];
        this._logger.debug("Patch many transaction", { storeName: this._storeName, stack });

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

        const stack = [new Error().stack];
        this._logger.debug("Add transaction", { object, storeName: this._storeName, stack });

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
