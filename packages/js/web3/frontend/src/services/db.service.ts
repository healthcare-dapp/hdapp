import { Logger, autoBind, formatBytes } from "@hdapp/shared/web2-common/utils";
import EventEmitter from "events";

const dbName = "hdapp";

export interface IDbConsumer {
    onDbReady?(db: IDBDatabase): void
    onDbUpgrade?(db: IDBDatabase): void
}

const { error, debug, warn } = new Logger("db-service");

export class DbService {
    private readonly _events = new EventEmitter();
    private readonly _consumers: IDbConsumer[] = [];

    private _db: IDBDatabase | null = null;
    private _storage: StorageEstimate | null = null;
    private _channel: BroadcastChannel;

    constructor(private _web3Address?: string) {
        this._channel = new BroadcastChannel(_web3Address
            ? "db_channel_" + _web3Address
            : "shared_db_channel"
        );
        this._channel.addEventListener("message", event => {
            this._emit(event.data);
            debug("Received message from channel:", event.data);
        });
        this._channel.addEventListener("messageerror", event => {
            error("Error in broadcast channel. ", { event });
        });

        autoBind(this);
    }

    reset(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this._db)
                return reject("no db");

            this._db.addEventListener("close", () => {
                const request = indexedDB.deleteDatabase(dbName);
                request.addEventListener(
                    "success",
                    () => {
                        debug("Database has been successfully deleted.");
                        resolve();
                    }
                );
                request.addEventListener(
                    "error",
                    err => {
                        error("Error clearing the database.", err);
                        reject();
                    }
                );
            });

            this._db.close();
        });
    }

    addConsumer<C extends IDbConsumer>(consumer: C): C {
        this._consumers.push(consumer);
        return consumer;
    }

    private async _calculateStorage() {
        const storage = await navigator.storage.estimate();
        this._storage = storage;
        debug("Using", formatBytes(storage.usage ?? -1), "out of", formatBytes(storage.quota ?? -1));
    }

    load(): Promise<void> {
        void this._calculateStorage();
        debug("Opening IndexedDB");
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(
                this._web3Address
                    ? dbName + "-" + this._web3Address
                    : dbName,
                3
            );
            request.addEventListener(
                "success",
                () => {
                    debug("Database has been successfully opened.");
                    this._initDb(request.result);
                    this._emit("ready");
                    resolve();
                }
            );
            request.addEventListener(
                "error",
                err => {
                    error("IndexedDB initialization failed.", err);
                    reject(err);
                }
            );
            request.addEventListener(
                "upgradeneeded",
                event => {
                    debug("Database upgrade to version", event.newVersion, "has started.");
                    const db = (event.target as IDBOpenDBRequest).result;

                    for (const consumer of this._consumers)
                        consumer.onDbUpgrade?.(db);

                    debug("Database upgrade to version", event.newVersion, "has ended.");
                }
            );
        });
    }

    private _initDb(db: IDBDatabase) {
        this._db = db;
        db.addEventListener(
            "close",
            () => {
                debug("Database has been closed.");
                this._db = null;
            }
        );
        db.addEventListener(
            "versionchange",
            event => {
                debug("Database has been upgraded to version", event.newVersion);
            }
        );

        for (const consumer of this._consumers)
            consumer.onDbReady?.(db);
    }

    transaction(storeNames: string[], mode: IDBTransactionMode) {
        if (!this._db)
            throw new Error("Db was not initialized yet.");

        const transaction = this._db.transaction(storeNames, mode);
        const stack = [new Error().stack];

        transaction.addEventListener("complete", () => {
            if (mode === "readwrite") {
                debug("RW transaction completed.", { storeNames, mode, transaction, stack });
                void this._calculateStorage();
                this._channel.postMessage("txn_completed");
                this._emit("txn_completed", storeNames);
            }
        });
        transaction.addEventListener("abort", event => {
            warn("Transaction was aborted.", { storeNames, mode, transaction, event, stack });
        });
        transaction.addEventListener("error", event => {
            error("Transaction has errored.", { storeNames, mode, transaction, event, stack });
        });

        return transaction;
    }

    get isInitialized() {
        return !!this._db;
    }

    get storage() {
        return this._storage;
    }

    on = this._events.addListener.bind(this._events);
    off = this._events.removeListener.bind(this._events);
    private _emit = this._events.emit.bind(this._events);
}

export const sharedDbService = new DbService();
sharedDbService.load();
