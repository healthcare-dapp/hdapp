import { HDMAccessControl, HDMAccessControl__factory } from "@hdapp/solidity/access-control-manager";
import { HDMAccountManager, HDMAccountManager__factory } from "@hdapp/solidity/account-manager";
import { HDMHandshake, HDMHandshake__factory } from "@hdapp/solidity/webrtc-broker";
import { Buffer } from "buffer";
import { AES, enc } from "crypto-js";
import { ethers } from "ethers";
import EventEmitter from "events";
import { makeAutoObservable } from "mobx";
import { HDMAccessControlAddress, HDMAccountManagerAddress, HDMHandshakeAddress, WEB3_JSON_RPC_URL } from "../contract";
import { WalletEntry, WalletType } from "../services/wallet.service";
import { Web3ContractProvider } from "../utils/web3-contract.provider";

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
    #address: string;

    #accessControlManager: Web3ContractProvider<HDMAccessControl>;
    #accountManager: Web3ContractProvider<HDMAccountManager>;
    #webRtcBroker: Web3ContractProvider<HDMHandshake>;

    private _events = new EventEmitter();
    private _ownedData: Notification[] = [];
    private _usedData: Notification[] = [];
    private _lastBlockNumber = 29800000; // TODO: keep in local storage
    private _password: string | null = null;

    private _emit = this._events.emit;
    on = this._events.addListener;
    off = this._events.removeListener;

    get signer() {
        return this.#signer;
    }

    constructor(wallet: WalletEntry) {
        this.#wallet = wallet;
        if (wallet.type !== WalletType.PrivateKey)
            throw new Error("Unsupported.");

        const provider = new ethers.AlchemyProvider("goerli", WEB3_JSON_RPC_URL);
        const signer = this.#signer = new ethers.Wallet(wallet.private_key!, provider);

        this.#address = wallet.address;
        this.#accessControlManager = new Web3ContractProvider(HDMAccessControl__factory, HDMAccessControlAddress, signer);
        this.#accountManager = new Web3ContractProvider(HDMAccountManager__factory, HDMAccountManagerAddress, signer);
        this.#webRtcBroker = new Web3ContractProvider(HDMHandshake__factory, HDMHandshakeAddress, signer);

        makeAutoObservable(this);
        // void this.bindNotifications();
    }

    get accessControlManager() {
        return this.#accessControlManager.contract;
    }

    get accountManager() {
        return this.#accountManager.contract;
    }

    get webRtcBroker() {
        return this.#webRtcBroker.contract;
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

    /* async bindNotifications() {
        void this.#accessControl.contract.on(
            this.#accessControl.filters["DataRequested(address,address,uint256)"](void 0, this.#address),
            async (_r1, _r2, _r3, event) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                this._notifications.push(await this._eventToNotification(event as any));
            }
        );
    } */

    private async _eventToNotification(event: ethers.EventLog): Promise<Notification> {
        switch (event.eventName) {
            case "DataRequested": {
                const info = await this.#accessControlManager.contract.getDataRequestInfo(
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

    /* async loadNotifications() {
        const dataRequestedEvents = await this.#accessControl.queryFilter(
            this.#accessControl.filters["DataRequested(address,address,uint256)"](void 0, this.#address),
            this._lastBlockNumber
        );

        const dataPermissionsGrantedEvents = await this.#accessControl.queryFilter(
            this.#accessControl.filters["DataPermissionsGranted(address,address,uint256,uint256)"](this.#address),
            this._lastBlockNumber
        );

        const dataPermissionsRevokedEvents = await this.#accessControl.queryFilter(
            this.#accessControl.filters["DataPermissionsRevoked(address,address,uint256)"](this.#address),
            this._lastBlockNumber
        );

        const events = [...dataRequestedEvents, ...dataPermissionsGrantedEvents, ...dataPermissionsRevokedEvents]
            .sort((a, b) => b.blockNumber - a.blockNumber);

        this._notifications = await Promise.all(
            events.map((event): Promise<Notification> => {
                return this._eventToNotification(event as unknown as ethers.EventLog);
            })
        );
    } */

    async loadOwnedData() {

        const dataIds = await this.#accessControlManager.contract.getDataPermissionsByOwner(this.#address);
        this._ownedData = await Promise.all(dataIds.map(async (id: bigint) => {
            const data = await this.#accessControlManager.contract.getDataPermissionsInfo(id);
            return {
                title: ethers.toBigInt(id).toString(16),
                description: `Shared with: ${data.user}, is revoked: ${data.isRevoked}`
            };
        }));
    }

    async loadUsedData() {

        const dataIds = await this.#accessControlManager.contract.getDataPermissionsByUser(this.#address);
        this._usedData = await Promise.all(dataIds.map(async (id: bigint) => {
            const data = await this.#accessControlManager.contract.getDataPermissionsInfo(id);
            return {
                title: ethers.toBigInt(id).toString(16),
                description: `Owner: ${data.owner}, is revoked: ${data.isRevoked}`
            };
        }));
    }

    async requestPermissions(requestee: string, data: string) {

        const encryptedData = this._password
            ? Buffer.from(AES.encrypt(data, this._password).toString(), "base64").toString("hex")
            : data;

        await this.#accessControlManager.contract.requestPermissions(
            requestee,
            ethers.toBigInt("0x" + encryptedData)
        );
    }

    async grantPermissionsFromRequest(requester: string, requestIndex: string, dataHash: string) {

        await this.#accessControlManager.contract.grantPermissionsFromRequest(
            requester,
            +requestIndex,
            ethers.toBigInt("0x" + dataHash)
        );
    }

    async revokePermissions(dataHash: string) {

        await this.#accessControlManager.contract.revokePermissions(ethers.toBigInt("0x" + dataHash));
    }
}
