import { HDMAccessControl, HDMAccessControl__factory } from "@hdapp/solidity/access-control-manager";
import { HDMAccountManager, HDMAccountManager__factory } from "@hdapp/solidity/account-manager";
import { HDMHandshake, HDMHandshake__factory } from "@hdapp/solidity/webrtc-broker";
import { ethers } from "ethers";
import { makeAutoObservable, runInAction } from "mobx";
import { HDMAccessControlAddress, HDMAccountManagerAddress, HDMHandshakeAddress, WEB3_JSON_RPC_URL } from "../contract";
import { WalletEntry, WalletType } from "../services/wallet.service";
import { Web3ContractProvider } from "../utils/web3-contract.provider";

export class Web3Manager {
    #signer: ethers.Signer;

    #accessControlManager: Web3ContractProvider<HDMAccessControl>;
    #accountManager: Web3ContractProvider<HDMAccountManager>;
    #webRtcBroker: Web3ContractProvider<HDMHandshake>;

    private _address: string;
    private _lastSyncedBlockNumber = 0;

    get lastSyncedBlockNumber() {
        return this._lastSyncedBlockNumber;
    }

    get signer() {
        return this.#signer;
    }

    constructor(wallet: WalletEntry) {
        if (wallet.type !== WalletType.PrivateKey)
            throw new Error("Unsupported.");

        this._address = wallet.address;

        const provider = new ethers.AlchemyProvider("maticmum", WEB3_JSON_RPC_URL);
        const signer = this.#signer = new ethers.Wallet(wallet.private_key!, provider);

        this.#accessControlManager = new Web3ContractProvider(HDMAccessControl__factory, HDMAccessControlAddress, signer);
        this.#accountManager = new Web3ContractProvider(HDMAccountManager__factory, HDMAccountManagerAddress, signer);
        this.#webRtcBroker = new Web3ContractProvider(HDMHandshake__factory, HDMHandshakeAddress, signer);

        makeAutoObservable(this);

        void this.updateBlockNumber();
    }

    get address() {
        return this._address;
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

    async updateBlockNumber() {
        const number = await this.signer.provider!.getBlockNumber();
        runInAction(() => {
            this._lastSyncedBlockNumber = number - 10000;
        });
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

    static async testMnemonic(phrases: string[]): Promise<[string, string]> {
        try {
            const provider = new ethers.JsonRpcProvider(WEB3_JSON_RPC_URL);
            const signer = ethers.Wallet.fromPhrase(phrases.join(" "), provider);
            return [await signer.getAddress(), signer.privateKey];
        } catch (e) {
            throw new Error("Provided private key is not valid.");
        }
    }
}
