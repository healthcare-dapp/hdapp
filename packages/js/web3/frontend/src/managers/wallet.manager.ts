import { AsyncAction } from "@hdapp/shared/web2-common/utils";
import { makeAutoObservable, runInAction } from "mobx";
import { ModalProvider } from "../App2";
import { SetPasswordDialog } from "../dialogs/set-password.dialog";
import { SetUserDataDialog } from "../dialogs/set-user-data.dialog";
import { sharedDbService } from "../services/db.service";
import { WalletEntry, WalletEntryShort, walletService, WalletType } from "../services/wallet.service";
import { EncryptionProvider } from "../utils/encryption.provider";
import { sessionManager } from "./session.manager";
import { Web3Manager } from "./web3.manager";

export class WalletManager {
    private _list: WalletEntryShort[] = [];

    constructor() {
        makeAutoObservable(this);

        sharedDbService.on("ready", () => {
            void this.load.run();
        });
    }

    get list() {
        return this._list;
    }

    load = new AsyncAction(async () => {
        try {
            const wallets = await walletService.getWallets();
            return runInAction(() => this._list = wallets);
        } catch (e) {
            console.error(e);
        }
    });

    addUsingPrivateKey = new AsyncAction(async (privateKey: string) => {
        try {
            const address = await Web3Manager.testPrivateKey(privateKey);

            const password = await ModalProvider.show(SetPasswordDialog, {});

            if (!password)
                throw new Error("Setting a password is required to use the app.");

            const { fullName, avatar, birthDate } = await ModalProvider.show(SetUserDataDialog, { address });

            const provider = new EncryptionProvider(password);
            const wallet: WalletEntry = {
                address,
                private_key: privateKey,
                type: WalletType.PrivateKey,
                mnemonic: null,
                user: {
                    full_name: fullName,
                    avatar_file_id: null
                }
            };

            await walletService.addWallet(wallet, provider);
            await sessionManager.unlockImmediately(wallet, password);

            const avatarHash = avatar
                ? await sessionManager.db.files.uploadFile(
                    avatar,
                    wallet.address,
                    sessionManager.encryption
                ) : null;

            await sessionManager.db.profiles.addProfile(
                address,
                {
                    full_name: fullName,
                    avatar_hash: avatarHash,
                    birth_date: birthDate,
                    blood_type: null,
                    gender: null,
                    height: null,
                    medical_organization_name: null,
                    weight: null,
                },
                sessionManager.encryption
            );

            void this.load.run();
        } catch (e) {
            console.error(e);
        }
    });

    addUsingMnemonic = new AsyncAction(async (phrases: string[]) => {
        try {
            const [address, privateKey] = await Web3Manager.testMnemonic(phrases);

            const password = await ModalProvider.show(SetPasswordDialog, {});

            if (!password)
                throw new Error("Setting a password is required to use the app.");

            const { fullName, avatar, birthDate } = await ModalProvider.show(SetUserDataDialog, { address });

            const provider = new EncryptionProvider(password);
            const wallet: WalletEntry = {
                address,
                private_key: privateKey,
                type: WalletType.PrivateKey,
                mnemonic: null,
                user: {
                    full_name: fullName,
                    avatar_file_id: null
                }
            };

            await walletService.addWallet(wallet, provider);
            await sessionManager.unlockImmediately(wallet, password);

            const avatarHash = avatar
                ? await sessionManager.db.files.uploadFile(
                    avatar,
                    wallet.address,
                    sessionManager.encryption
                ) : null;

            await sessionManager.db.profiles.addProfile(
                address,
                {
                    full_name: fullName,
                    avatar_hash: avatarHash,
                    birth_date: birthDate,
                    blood_type: null,
                    gender: null,
                    height: null,
                    medical_organization_name: null,
                    weight: null,
                },
                sessionManager.encryption
            );

            void this.load.run();
        } catch (e) {
            console.error(e);
        }
    });
}

export const walletManager = new WalletManager();
