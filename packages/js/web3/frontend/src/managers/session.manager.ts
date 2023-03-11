import { AsyncAction } from "@hdapp/shared/web2-common/utils";
import { makeAutoObservable, runInAction } from "mobx";
import { WalletEntry, WalletEntryShort, walletService } from "../services/wallet.service";
import { EncryptionProvider } from "../utils/encryption.provider";
import { AccountManager } from "./account.manager";
import { Web3Manager } from "./web3.manager";
import { WebRTCManager } from "./webrtc.manager";

export class SessionManager {
    private _accountManager: AccountManager | null = null;
    private _encryptionProvider: EncryptionProvider | null = null;
    private _web3Manager: Web3Manager | null = null;
    private _webrtcManager: WebRTCManager | null = null;
    private _walletShort: WalletEntryShort | null = null;

    constructor() {
        makeAutoObservable(this);
    }

    get account() {
        if (!this._accountManager)
            throw new Error("No account manager is available.");
        return this._accountManager;
    }

    get encryption() {
        if (!this._encryptionProvider)
            throw new Error("No encryption provider is available.");
        return this._encryptionProvider;
    }

    get wallet() {
        if (!this._walletShort)
            throw new Error("No wallet was signed in.");
        return this._walletShort;
    }

    get web3() {
        if (!this._web3Manager)
            throw new Error("No web3 manager is available.");

        return this._web3Manager;
    }

    get webrtc() {
        if (!this._webrtcManager)
            throw new Error("No WebRTC manager is available.");

        return this._webrtcManager;
    }

    get isSignedIn() {
        return !!this._encryptionProvider;
    }

    unlock = new AsyncAction(async (walletShort: WalletEntryShort, password: string) => {
        await new Promise(r => setTimeout(r, 1000));
        const provider = new EncryptionProvider(password);

        try {
            const wallet = await walletService.getWallet(walletShort.address, provider);
            runInAction(() => {
                this._encryptionProvider = provider;
                this._walletShort = walletShort;
                this._web3Manager = new Web3Manager(wallet);
                this._webrtcManager = new WebRTCManager(
                    this._web3Manager,
                    walletShort.address,
                );
                this._accountManager = new AccountManager(
                    this._web3Manager,
                    walletShort.address,
                );
            });
        } catch (e) {
            console.error(e);
            throw new Error("Password incorrect");
        }
    });

    unlockImmediately(wallet: WalletEntry, password: string) {
        const provider = new EncryptionProvider(password);
        const walletShort: WalletEntryShort = {
            address: wallet.address,
            user: wallet.user
        };
        try {
            runInAction(() => {
                this._encryptionProvider = provider;
                this._walletShort = walletShort;
                this._web3Manager = new Web3Manager(wallet);
                this._webrtcManager = new WebRTCManager(
                    this._web3Manager,
                    walletShort.address,
                );
                this._accountManager = new AccountManager(
                    this._web3Manager,
                    walletShort.address,
                );
            });
        } catch (e) {
            console.trace("govno", e);
        }
    }
}

export const sessionManager = new SessionManager();
