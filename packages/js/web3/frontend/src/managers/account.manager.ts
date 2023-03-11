import { AsyncAction } from "@hdapp/shared/web2-common/utils";
import { ethers } from "ethers";
import EventEmitter from "events";
import { makeAutoObservable, runInAction } from "mobx";
import { Web3Manager } from "./web3.manager";

interface Web3Account {
    isBanned: boolean
    isDoctor: boolean
}

export class AccountManager {
    private _account: Web3Account | null = null;

    private _events = new EventEmitter();

    private _emit = this._events.emit;
    on = this._events.addListener;
    off = this._events.removeListener;

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
        private _web3Address: string
    ) {
        console.log(_web3Address);
        makeAutoObservable(this);

        void this._loadAccount.run()
            .then(console.log);
    }

    get isLoading() {
        return this._loadAccount.pending;
    }

    private readonly _loadAccount = new AsyncAction(async () => {
        try {
            const account = await this._web3.accountManager.getAccountInfo(this._web3Address);

            runInAction(() => {
                this._account = account;
            });
        } catch (e) {
            runInAction(() => {
                this._account = { isBanned: false, isDoctor: false };
            });
        }
    });
}
