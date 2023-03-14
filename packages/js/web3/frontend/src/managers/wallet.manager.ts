import { AsyncAction } from "@hdapp/shared/web2-common/utils";
import { makeAutoObservable, runInAction } from "mobx";
import { ModalProvider } from "../App2";
import { SetPasswordDialog } from "../dialogs/set-password.dialog";
import { SetUserDataDialog, SetUserDataDialogResult } from "../dialogs/set-user-data.dialog";
import { dbService } from "../services/db.service";
import { fileService } from "../services/file.service";
import { profileService } from "../services/profile.service";
import { WalletEntry, WalletEntryShort, walletService, WalletType } from "../services/wallet.service";
import { EncryptionProvider } from "../utils/encryption.provider";
import { sessionManager } from "./session.manager";
import { Web3Manager } from "./web3.manager";

export class WalletManager {
    private _list: WalletEntryShort[] = [];

    constructor() {
        makeAutoObservable(this);

        dbService.on("ready", () => {
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

            const password = await new Promise<string | null>(onClose => {
                ModalProvider.show(SetPasswordDialog, { onClose });
            });

            if (!password)
                throw new Error("Setting a password is required to use the app.");

            const { fullName, avatar, birthDate } = await new Promise<SetUserDataDialogResult>(onClose => {
                ModalProvider.show(SetUserDataDialog, { address, onClose });
            });

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
            sessionManager.unlockImmediately(wallet, password);

            const avatar_hash = avatar
                ? await fileService.uploadFile(
                    avatar,
                    wallet.address,
                    sessionManager.encryption
                ) : null;

            await profileService.addProfile(
                address,
                {
                    full_name: fullName,
                    avatar_hash,
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
