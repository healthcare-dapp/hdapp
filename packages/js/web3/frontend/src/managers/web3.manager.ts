import { Buffer } from "buffer";
import { AES, enc } from "crypto-js";
import { BigNumber, ethers, Event } from "ethers";
import { hexZeroPad } from "ethers/lib/utils";
import EventEmitter from "events";
import { makeAutoObservable } from "mobx";
import { HDMAccessControlAddress, HDMAccessControlABI, WEB3_JSON_RPC_URL } from "../contract";
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

    private _events = new EventEmitter();

    private _signer: ethers.Signer;
    private _accessControl: ethers.Contract | null = null;
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

        const provider = new ethers.providers.StaticJsonRpcProvider(WEB3_JSON_RPC_URL);

        switch (wallet.type) {
            case WalletType.PrivateKey:
                this._signer = new ethers.Wallet(wallet.private_key!, provider);
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
        return this._signer;
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
            const provider = new ethers.providers.StaticJsonRpcProvider(WEB3_JSON_RPC_URL);
            const signer = new ethers.Wallet(privateKey, provider);
            return await signer.getAddress();
        } catch (e) {
            throw new Error("Provided private key is not valid.");
        }
    }

    loadContract() {
        if (!this._signer)
            return;

        this._accessControl = new ethers.Contract(HDMAccessControlAddress, HDMAccessControlABI, this._signer);
    }

    async bindNotifications() {
        if (!this._accessControl)
            return;

        const myAddress = await this._signer!.getAddress();

        this._accessControl.on({
            topics: [
                ethers.utils.id("DataRequested(address,address,uint256)"),
                null!,
                hexZeroPad(myAddress, 32)
            ]
        }, async (event: ethers.Event) => {
            this._notifications.push(await this._eventToNotification(event));
        });
    }

    private async _eventToNotification(event: ethers.Event): Promise<Notification> {
        switch (event.event) {
            case "DataRequested": {
                const info = await this._accessControl!.getDataRequestInfo(
                    event.args!.requester,
                    event.args!.requestIndex
                );
                const encryptedData = BigNumber.from(info.data).toHexString().replace("0x", "");
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
                return { title: event.event ?? "", description: event.args?.join(", ") ?? "" };
        }
    }

    async loadNotifications() {
        if (!this._accessControl)
            return;

        const myAddress = await this._signer!.getAddress();
        const dataRequestedEvents = await this._accessControl.queryFilter(
            {
                topics: [
                    ethers.utils.id("DataRequested(address,address,uint256)"),
                    null!,
                    hexZeroPad(myAddress, 32)
                ]
            },
            this._lastBlockNumber
        );

        const dataPermissionsGrantedEvents = await this._accessControl.queryFilter(
            {
                topics: [
                    ethers.utils.id("DataPermissionsGranted(address,address,uint256,uint256)"),
                    hexZeroPad(myAddress, 32)
                ]
            },
            this._lastBlockNumber
        );

        const dataPermissionsRevokedEvents = await this._accessControl.queryFilter(
            {
                topics: [
                    ethers.utils.id("DataPermissionsRevoked(address,address,uint256)"),
                    hexZeroPad(myAddress, 32)
                ]
            },
            this._lastBlockNumber
        );

        const events = [...dataRequestedEvents, ...dataPermissionsGrantedEvents, ...dataPermissionsRevokedEvents]
            .sort((a, b) => b.blockNumber - a.blockNumber);

        this._notifications = await Promise.all(
            events.map((event): Promise<Notification> => {
                return this._eventToNotification(event);
            })
        );
    }

    async loadOwnedData() {
        if (!this._accessControl)
            return;

        const myAddress = await this._signer!.getAddress();
        const dataIds = await this._accessControl.getDataPermissionsByOwner(myAddress);
        this._ownedData = await Promise.all(dataIds.map(async (id: string) => {
            const data = await this._accessControl!.getDataPermissionsInfo(id);
            return {
                title: BigNumber.from(id).toHexString(),
                description: `Shared with: ${data.user}, is revoked: ${data.isRevoked}`
            };
        }));
    }

    async loadUsedData() {
        if (!this._accessControl)
            return;

        const myAddress = await this._signer!.getAddress();
        const dataIds = await this._accessControl.getDataPermissionsByUser(myAddress);
        this._usedData = await Promise.all(dataIds.map(async (id: string) => {
            const data = await this._accessControl!.getDataPermissionsInfo(id);
            return {
                title: BigNumber.from(id).toHexString(),
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
            BigNumber.from("0x" + encryptedData)
        );
    }

    async grantPermissionsFromRequest(requester: string, requestIndex: string, dataHash: string) {
        if (!this._accessControl)
            return;

        await this._accessControl.grantPermissionsFromRequest(
            requester,
            +requestIndex,
            BigNumber.from("0x" + dataHash)
        );
    }

    async revokePermissions(dataHash: string) {
        if (!this._accessControl)
            return;

        await this._accessControl.revokePermissions(BigNumber.from("0x" + dataHash));
    }
}
