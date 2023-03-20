import { AsyncAction, Logger } from "@hdapp/shared/web2-common/utils";
import { Instant, LocalDateTime } from "@js-joda/core";
import { SHA256 } from "crypto-js";
import { ethers, toBigInt } from "ethers";
import EventEmitter from "events";
import { makeAutoObservable } from "mobx";
import { deviceService } from "../services/device.service";
import { eventLogService } from "../services/event-log.service";
import { NotificationsManager, Urgency } from "./notifications.manager";
import { sessionManager } from "./session.manager";
import { Web3Manager } from "./web3.manager";

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
        private _web3: Web3Manager,
        private _notifications: NotificationsManager
    ) {
        makeAutoObservable(this);

        void this._bindEvents();
    }

    regenerateConnectionKey() {
        this._currentConnectionKey = toBigInt(ethers.randomBytes(8)).toString(16);
        this._connectionKeyGeneratedAt = Date.now();
    }

    resetConnectionKey() {
        this._currentConnectionKey = null;
    }

    private _bindEvents() {
        const { accessControlManager } = this._web3;
        void accessControlManager.on(
            accessControlManager.filters.UserConnectionRequested,
            async (requester, requestee, hash) => {
                if (requestee !== this._web3.address)
                    return;

                if (!this._currentConnectionKey)
                    return warn("no private key");

                const hashLocalStr = SHA256(requester + " " + this._currentConnectionKey).toString();
                const hashLocal = toBigInt("0x" + hashLocalStr);

                if (hashLocal !== hash)
                    return warn("incoming hash doesn't match the expected hash");

                this._notifications.push({
                    type: "user_connection_requested",
                    created_at: Instant.now(),
                    urgency: Urgency.NORMAL,
                    user: requester
                });

                await deviceService.addDevice(
                    {
                        added_at: LocalDateTime.now(),
                        friendly_name: "",
                        hash: "0x" + hashLocalStr,
                        is_current: false,
                        is_pending: true,
                        owned_by: requester,
                        private_key: this._currentConnectionKey,
                        type: "unknown"
                    },
                    sessionManager.encryption
                );
            }
        );
    }

    readonly requestUserConnection = new AsyncAction(async (user: string, privateKey: string) => {
        try {
            const hashStr = SHA256(this._web3.address + " " + privateKey).toString();
            const hash = ethers.toBigInt("0x" + hashStr);
            await this._web3.accessControlManager.requestUserConnection(
                user,
                hash
            );
            await deviceService.addDevice(
                {
                    added_at: LocalDateTime.now(),
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

            await eventLogService.addEventLog({
                title: "Connection request pending",
                description: `Waiting for user ${user} to confirm your connection request`
            });
        } catch (e) {
            error(e);
        }
    });

    readonly addUserConnection = new AsyncAction(async (user: string) => {
        try {
            await this._web3.accessControlManager.addUserConnection(user);

            await deviceService.activateAllDevicesOwnedBy(
                user,
                sessionManager.encryption
            );

            await eventLogService.addEventLog({
                title: "Connection request accepted",
                description: `User ${user} has successfully connected with your account`
            });
        } catch (e) {
            error(e);
        }
    });
}
