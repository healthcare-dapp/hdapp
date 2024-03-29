import { AsyncAction, Logger } from "@hdapp/shared/web2-common/utils";
import { Instant, LocalDateTime } from "@js-joda/core";
import { SHA256 } from "crypto-js";
import { ethers, toBigInt } from "ethers";
import EventEmitter from "events";
import { makeAutoObservable } from "mobx";
import { runAndCacheWeb3Call } from "../services/web3-cache.service";
import { EncryptionProvider } from "../utils/encryption.provider";
import { DbManager } from "./db.manager";
import { NotificationsManager, Urgency } from "./notifications.manager";
import { sessionManager } from "./session.manager";
import { Web3Manager } from "./web3.manager";

export type DataPermissions = {
    hash: bigint
    parentHash: bigint
    owner: string
    user: string
    isRevoked: boolean
    expiresAt: bigint
};

interface Web3Account {
    isBanned: boolean
    isDoctor: boolean
}

const { error, warn } = new Logger("access-control-manager");

export class AccessControlManager {
    private _account: Web3Account | null = null;

    private _currentConnectionKey: string | null = null;
    private _connectionKeyGeneratedAt: number | null = null;

    private _events = new EventEmitter();

    private _emit = this._events.emit;
    on = this._events.addListener;
    off = this._events.removeListener;

    get currentConnectionKey() {
        return this._currentConnectionKey;
    }

    get connectionKeyGeneratedAt() {
        return this._connectionKeyGeneratedAt;
    }

    get isBanned() {
        if (!this._account)
            throw new Error("no account yet.");

        return this._account.isBanned;
    }

    get isDoctor() {
        if (!this._account)
            throw new Error("no account yet.");

        return this._account.isDoctor;
    }

    constructor(
        private _db: DbManager,
        private _web3: Web3Manager,
        private _notifications: NotificationsManager,
        private _encryption: EncryptionProvider,
    ) {
        makeAutoObservable(this, {}, { autoBind: true });

        void this._bindEvents();
    }

    regenerateConnectionKey() {
        this._currentConnectionKey = toBigInt(ethers.randomBytes(8)).toString(16);
        this._connectionKeyGeneratedAt = Date.now();
    }

    resetConnectionKey() {
        this._currentConnectionKey = null;
    }

    private async _handleUserConnectionRequested(requester: string, requestee: string, hash: bigint) {
        if (requestee !== this._web3.address)
            return;

        if (!this._currentConnectionKey)
            return warn("no private key");

        const hashLocalStr = "0x" + SHA256(requester + " " + this._currentConnectionKey).toString();
        const hashLocal = toBigInt(hashLocalStr);

        if (hashLocal !== hash)
            return warn("incoming hash doesn't match the expected hash");

        const device = await this._db.devices.getDevice(hashLocalStr, sessionManager.encryption)
            .catch(() => null);
        if (device)
            return;

        await this._db.devices.addDevice(
            {
                added_at: LocalDateTime.now(),
                last_active_at: LocalDateTime.MIN,
                friendly_name: "",
                hash: hashLocalStr,
                is_current: false,
                is_pending: true,
                owned_by: requester,
                private_key: this._currentConnectionKey,
                type: "unknown"
            },
            sessionManager.encryption
        );

        this._notifications.push({
            type: "user_connection_requested",
            created_at: Instant.now(),
            urgency: Urgency.NORMAL,
            userAddress: requester
        });

        this._emit("device_added");
    }

    private async _handleUserConnectionCreated(user1: string, user2: string) {
        const user = user1 === this._web3.address
            ? user2
            : user1;

        const devices = await this._db.devices.getDevicesOwnedBy(user, sessionManager.encryption);
        if (!devices.length)
            return;

        for (const device of devices) {
            if (device.is_pending)
                await this._db.devices.upsertDevice(
                    { ...device, is_pending: false },
                    sessionManager.encryption
                );
        }

        this._notifications.push({
            type: "user_connection_created",
            created_at: Instant.now(),
            urgency: Urgency.NORMAL,
            userAddress: user
        });

        const eventLogs = await this._db.eventLogs.getEventLogsWithRelatedEntity({
            type: "profile",
            value: user,
        });
        if (!eventLogs.some(el => el.title === "Connection request accepted" && el.created_at.isBefore(Instant.now().minusSeconds(60 * 60 * 1))))
            await this._db.eventLogs.addEventLog({
                created_by: user,
                related_entities: [
                    {
                        type: "profile",
                        value: user,
                    }
                ],
                title: "Connection request accepted",
                description: `${user} has accepted your connection request.`
            });
    }

    private _bindEvents() {
        const { accessControlManager } = this._web3;
        void accessControlManager.on(
            accessControlManager.filters.UserConnectionRequested,
            this._handleUserConnectionRequested
        );
        void accessControlManager.on(
            accessControlManager.filters.UserConnectionCreated,
            this._handleUserConnectionCreated
        );

        void accessControlManager.queryFilter(
            accessControlManager.filters.UserConnectionRequested,
            this._web3.lastSyncedBlockNumber
        ).then(arr => arr.forEach(
            e => this._handleUserConnectionRequested(
                e.args.requester,
                e.args.requestee,
                e.args.hash
            )
        ));

        void accessControlManager.queryFilter(
            accessControlManager.filters.UserConnectionCreated,
            this._web3.lastSyncedBlockNumber
        ).then(arr => arr.forEach(
            e => this._handleUserConnectionCreated(
                e.args.user1,
                e.args.user2
            )
        ));
    }

    async populateDataPermissions(permissions: DataPermissions[]) {
        const records = await this._db.records.getRecordHashes();
        const blocks = await this._db.blocks.getBlockHashes();

        // Client-side filtering
        const filtered = permissions.map(data => ({
            hash: data.hash,
            parentHash: data.parentHash,
            owner: data.owner,
            user: data.user,
            isRevoked: data.isRevoked,
            expiresAt: data.expiresAt
        })).filter(perms => {
            const hash = perms.hash.toString(16);
            const hasParentHash = perms.parentHash !== 0n;
            const parentHash = perms.parentHash.toString(16);

            // Permissions without a parent hash can only
            // be granted by the owner, and so are always valid
            if (!hasParentHash)
                return true;

            // Permission to manage a block or record based
            // on all-data-manage permission
            if (this._web3.address === `0x${parentHash}`
                && (records.includes(hash) || blocks.includes(hash)))
                return true;

            // Permission to manage a record based on its block permission
            if (blocks.includes(parentHash) && records.includes(hash))
                return true;

            return false;
        });

        return filtered;
    }

    async getDataPermissionsForUser(address: string): Promise<DataPermissions[]> {
        const permissions = [...(await runAndCacheWeb3Call(
            "getDataPermissionsByUser",
            (...args) => this._web3.accessControlManager.getDataPermissionsByUser(...args),
            address
        ))];

        return await this.populateDataPermissions(permissions);
    }

    async getDataPermissionsForOwner(address: string): Promise<DataPermissions[]> {
        const permissions = [...(await runAndCacheWeb3Call(
            "getDataPermissionsByOwner",
            (...args) => this._web3.accessControlManager.getDataPermissionsByOwner(...args),
            address
        ))];

        return await this.populateDataPermissions(permissions);
    }

    readonly requestUserConnection = new AsyncAction(async (user: string, privateKey: string) => {
        try {
            const hashStr = SHA256(this._web3.address + " " + privateKey).toString();
            const hash = ethers.toBigInt("0x" + hashStr);
            await this._web3.accessControlManager.requestUserConnection(
                user,
                hash
            );

            await this._db.devices.addDevice(
                {
                    added_at: LocalDateTime.now(),
                    last_active_at: LocalDateTime.MIN,
                    friendly_name: "",
                    hash: "0x" + hashStr,
                    is_current: false,
                    is_pending: true,
                    owned_by: user,
                    private_key: privateKey,
                    type: "unknown"
                },
                sessionManager.encryption
            );

            await this._db.eventLogs.addEventLog({
                title: "Connection request pending",
                description: `Waiting for user ${user} to confirm your connection request`,
                created_by: user,
                related_entities: [
                    {
                        type: "profile",
                        value: user,
                    }
                ],
            });
        } catch (e) {
            error(e);
        }
    });

    readonly addUserConnection = new AsyncAction(async (user: string) => {
        try {
            await this._web3.accessControlManager.addUserConnection(user);

            await this._db.devices.activateAllDevicesOwnedBy(
                user,
                sessionManager.encryption
            );

            await this._db.eventLogs.addEventLog({
                title: "Connection request accepted",
                description: `You have accepted the connection request of ${user}.`,
                created_by: this._web3.address,
                related_entities: [
                    {
                        type: "profile",
                        value: user,
                    }
                ],
            });
        } catch (e) {
            error(e);
        }
    });
}
