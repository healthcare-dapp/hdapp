import { Logger, formatBytes } from "@hdapp/shared/web2-common/utils";
import EventEmitter from "events";

const dbName = "hdapp-pwa-frontend";

export interface IDbConsumer {
    onDbReady?(db: IDBDatabase): void
    onDbUpgrade?(db: IDBDatabase): void
}

const { error, debug, warn } = new Logger("db-service");

export class DbService {
    private readonly _events = new EventEmitter();
    private readonly _consumers: IDbConsumer[] = [];

    private _db: IDBDatabase | null = null;
    private _channel = new BroadcastChannel("db_channel");

    constructor() {
        this._requestDb();
        this._channel.addEventListener("message", event => {
            this._emit(event.data);
            debug("Received message from channel:", event.data);
        });
        this._channel.addEventListener("messageerror", event => {
            error("Error in broadcast channel. ", { event });
        });
    }

    reset() {
        return new Promise<void>((resolve, reject) => {
            this._db?.close();
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
    }

    addConsumer(consumer: IDbConsumer) {
        this._consumers.push(consumer);
    }

    private async _calculateStorage() {
        const storageSize = await navigator.storage.estimate();
        debug("Using", formatBytes(storageSize.usage ?? -1), "out of", formatBytes(storageSize.quota ?? -1));
    }

    private _requestDb() {
        void this._calculateStorage();
        debug("Opening IndexedDB");
        const request = indexedDB.open(dbName, 3);
        request.addEventListener(
            "success",
            () => {
                debug("Database has been successfully opened.");
                this._initDb(request.result);
                this._emit("ready");
            }
        );
        request.addEventListener(
            "error",
            err => {
                error("IndexedDB initialization failed.", err);
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

    on = this._events.addListener;
    off = this._events.removeListener;
    private _emit = this._events.emit;
}

export const dbService = new DbService();
