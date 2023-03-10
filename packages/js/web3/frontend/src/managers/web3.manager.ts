import { HDMAccessControl, HDMAccessControl__factory } from "@hdapp/solidity/access-control-manager";
import { Buffer } from "buffer";
import { AES, enc } from "crypto-js";
import { ethers } from "ethers";
import EventEmitter from "events";
import { makeAutoObservable } from "mobx";
import { HDMAccessControlAddress, WEB3_JSON_RPC_URL } from "../contract";
import { WalletEntry, WalletType } from "../services/wallet.service";

export type Notification = {
    title: string
    description: string
};

export type Config = {
    privateKey?: string
};

export class Web3Manager {
    #wallet: WalletEntry;
    #signer: ethers.Signer;

    private _events = new EventEmitter();
    private _accessControl: HDMAccessControl | null = null;
    private _notifications: Notification[] = [
        {
            title: "Incoming data access request",
            description: "Abram Lincoln would like to access your X-Ray medical data"
        },
        {
            title: "Sync completed successfully",
            description: "5 devices have up-to-date information"
        },
    ];
    private _ownedData: Notification[] = [];
    private _usedData: Notification[] = [];
    private _lastBlockNumber = 29800000; // TODO: keep in local storage
    private _password: string | null = null;

    private _emit = this._events.emit;
    on = this._events.addListener;
    off = this._events.removeListener;

    constructor(wallet: WalletEntry) {
        this.#wallet = wallet;

        makeAutoObservable(this);

        const provider = new ethers.JsonRpcProvider(WEB3_JSON_RPC_URL);

        switch (wallet.type) {
            case WalletType.PrivateKey:
                this.#signer = new ethers.Wallet(wallet.private_key!, provider);
                break;
            default:
                throw new Error("Unsupported.");
        }

        this.loadContract();
        void this.bindNotifications();
    }

    get notifications() {
        return this._notifications;
    }

    get ownedData() {
        return this._ownedData;
    }

    get signer() {
        return this.#signer;
    }

    get usedData() {
        return this._usedData;
    }

    get password() {
        return this._password;
    }

    setPassword(pwd: string | null) {
        this._password = pwd;
    }

    static async testPrivateKey(privateKey: string): Promise<string> {
        try {
            const provider = new ethers.JsonRpcProvider(WEB3_JSON_RPC_URL);
            const signer = new ethers.Wallet(privateKey, provider);
            return await signer.getAddress();
        } catch (e) {
            throw new Error("Provided private key is not valid.");
        }
    }

    loadContract() {
        if (!this.#signer)
            return;

        this._accessControl = HDMAccessControl__factory.connect(HDMAccessControlAddress, this.#signer);
    }

    async bindNotifications() {
        if (!this._accessControl)
            return;

        const myAddress = await this.#signer!.getAddress();

        void this._accessControl.on(
            this._accessControl.filters["DataRequested(address,address,uint256)"](void 0, myAddress),
            async (_r1, _r2, _r3, event) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                this._notifications.push(await this._eventToNotification(event as any));
            }
        );
    }

    private async _eventToNotification(event: ethers.EventLog): Promise<Notification> {
        switch (event.eventName) {
            case "DataRequested": {
                const info = await this._accessControl!.getDataRequestInfo(
                    event.args!.requester,
                    event.args!.requestIndex
                );
                const encryptedData = ethers.toBigInt(info.data).toString(16).replace("0x", "");
                const decryptedData = AES.decrypt(Buffer.from(encryptedData, "hex").toString("base64"), this._password!);
                return {
                    title: `User ${(event.args!.requester + "").substr(-4)} requested access to your data`,
                    description: `Requester: ${event.args!.requester.toString()}, requestee: ${event.args!.requestee.toString()}, requestIndex: ${event.args!.requestIndex}, data: ${decryptedData.toString(enc.Utf8)}`,
                };
            }
            case "DataPermissionsGranted":
                return {
                    title: `User ${(event.args!.owner + "").substr(-4)} granted access to their data`,
                    description: `Hash: ${event.args!.dataHash.toHexString()}`
                };
            case "DataPermissionsRevoked":
                return {
                    title: `User ${(event.args!.owner + "").substr(-4)} revoked access to their data`,
                    description: "View data"
                };

            default:
                return { title: event.eventName ?? "", description: event.args?.join(", ") ?? "" };
        }
    }

    async loadNotifications() {
        if (!this._accessControl)
            return;

        const myAddress = await this.#signer!.getAddress();
        const dataRequestedEvents = await this._accessControl.queryFilter(
            this._accessControl.filters["DataRequested(address,address,uint256)"](void 0, myAddress),
            this._lastBlockNumber
        );

        const dataPermissionsGrantedEvents = await this._accessControl.queryFilter(
            this._accessControl.filters["DataPermissionsGranted(address,address,uint256,uint256)"](myAddress),
            this._lastBlockNumber
        );

        const dataPermissionsRevokedEvents = await this._accessControl.queryFilter(
            this._accessControl.filters["DataPermissionsRevoked(address,address,uint256)"](myAddress),
            this._lastBlockNumber
        );

        const events = [...dataRequestedEvents, ...dataPermissionsGrantedEvents, ...dataPermissionsRevokedEvents]
            .sort((a, b) => b.blockNumber - a.blockNumber);

        this._notifications = await Promise.all(
            events.map((event): Promise<Notification> => {
                return this._eventToNotification(event as unknown as ethers.EventLog);
            })
        );
    }

    async loadOwnedData() {
        if (!this._accessControl)
            return;

        const myAddress = await this.#signer!.getAddress();
        const dataIds = await this._accessControl.getDataPermissionsByOwner(myAddress);
        this._ownedData = await Promise.all(dataIds.map(async (id: bigint) => {
            const data = await this._accessControl!.getDataPermissionsInfo(id);
            return {
                title: ethers.toBigInt(id).toString(16),
                description: `Shared with: ${data.user}, is revoked: ${data.isRevoked}`
            };
        }));
    }

    async loadUsedData() {
        if (!this._accessControl)
            return;

        const myAddress = await this.#signer!.getAddress();
        const dataIds = await this._accessControl.getDataPermissionsByUser(myAddress);
        this._usedData = await Promise.all(dataIds.map(async (id: bigint) => {
            const data = await this._accessControl!.getDataPermissionsInfo(id);
            return {
                title: ethers.toBigInt(id).toString(16),
                description: `Owner: ${data.owner}, is revoked: ${data.isRevoked}`
            };
        }));
    }

    async requestPermissions(requestee: string, data: string) {
        if (!this._accessControl)
            return;

        const encryptedData = this._password
            ? Buffer.from(AES.encrypt(data, this._password).toString(), "base64").toString("hex")
            : data;

        await this._accessControl.requestPermissions(
            requestee,
            ethers.toBigInt("0x" + encryptedData)
        );
    }

    async grantPermissionsFromRequest(requester: string, requestIndex: string, dataHash: string) {
        if (!this._accessControl)
            return;

        await this._accessControl.grantPermissionsFromRequest(
            requester,
            +requestIndex,
            ethers.toBigInt("0x" + dataHash)
        );
    }

    async revokePermissions(dataHash: string) {
        if (!this._accessControl)
            return;

        await this._accessControl.revokePermissions(ethers.toBigInt("0x" + dataHash));
    }
}
