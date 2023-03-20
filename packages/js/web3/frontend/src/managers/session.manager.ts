import { AsyncAction } from "@hdapp/shared/web2-common/utils";
import { Instant, LocalDateTime } from "@js-joda/core";
import { ethers, keccak256 } from "ethers";
import { makeAutoObservable, runInAction } from "mobx";
import UAParser from "ua-parser-js";
import { DeviceEntry, deviceService } from "../services/device.service";
import { WalletEntry, WalletEntryShort, WalletNotFoundError, walletService } from "../services/wallet.service";
import { EncryptionProvider } from "../utils/encryption.provider";
import { AccessControlManager } from "./access-control.manager";
import { AccountManager } from "./account.manager";
import { NotificationsManager } from "./notifications.manager";
import { Web3Manager } from "./web3.manager";
import { WebRTCManager } from "./webrtc.manager";

export class SessionManager {
    private _accountManager: AccountManager | null = null;
    private _accessControlManager: AccessControlManager | null = null;
    private _encryptionProvider: EncryptionProvider | null = null;
    private _notificationsManager: NotificationsManager | null = null;
    private _web3Manager: Web3Manager | null = null;
    private _webrtcManager: WebRTCManager | null = null;
    private _walletShort: WalletEntryShort | null = null;
    private _device: DeviceEntry | null = null;

    constructor() {
        makeAutoObservable(this);
    }

    get account() {
        if (!this._accountManager)
            throw new Error("No account manager is available.");
        return this._accountManager;
    }

    get accessControl() {
        if (!this._accessControlManager)
            throw new Error("No access control manager is available.");
        return this._accessControlManager;
    }

    get encryption() {
        if (!this._encryptionProvider)
            throw new Error("No encryption provider is available.");
        return this._encryptionProvider;
    }

    get notifications() {
        if (!this._notificationsManager)
            throw new Error("No notifications manager is available.");
        return this._notificationsManager;
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

    private async _initVars(walletShort: WalletEntryShort, wallet: WalletEntry, provider: EncryptionProvider) {
        const device = await (async () => {
            const currentDevice = await deviceService.getCurrentDevice(provider);
            if (currentDevice)
                return currentDevice;

            const uaParser = new UAParser(navigator.userAgent);
            const uaDevice = uaParser.getResult();

            const hash = keccak256(
                ethers.toUtf8Bytes([
                    walletShort.address,
                    Instant.now().toString()
                ].join(" "))
            );
            const privateKey = "";
            const friendlyName = [uaDevice.browser.name, uaDevice.browser.version].join(" ");

            await deviceService.addDevice({
                is_current: true,
                is_pending: false,
                hash,
                friendly_name: friendlyName,
                added_at: LocalDateTime.now(),
                private_key: privateKey,
                owned_by: walletShort.address,
                type: uaDevice.device.type ?? "pc"
            }, provider);

            return await deviceService.getCurrentDevice(provider);
        })();

        runInAction(() => {
            this._device = device;
            this._encryptionProvider = provider;
            this._walletShort = walletShort;
            this._web3Manager = new Web3Manager(wallet);
            this._notificationsManager = new NotificationsManager();
            this._webrtcManager = new WebRTCManager(
                this._web3Manager,
                this._encryptionProvider
            );
            this._accountManager = new AccountManager(
                this._web3Manager
            );
            this._accessControlManager = new AccessControlManager(
                this._web3Manager,
                this._notificationsManager
            );
        });
    }

    unlock = new AsyncAction(async (walletShort: WalletEntryShort, password: string) => {
        await new Promise(r => setTimeout(r, 1000));
        const provider = new EncryptionProvider(password);

        try {
            const wallet = await walletService.getWallet(walletShort.address, provider);
            await this._initVars(walletShort, wallet, provider);
        } catch (e) {
            if (e instanceof WalletNotFoundError)
                throw new Error("Password incorrect");

            throw e;
        }
    });

    async unlockImmediately(wallet: WalletEntry, password: string) {
        const provider = new EncryptionProvider(password);
        const walletShort: WalletEntryShort = {
            address: wallet.address,
            user: wallet.user
        };

        await this._initVars(walletShort, wallet, provider);
    }
}

export const sessionManager = new SessionManager();
// @ts-ignore
window.sessionManager = sessionManager;
