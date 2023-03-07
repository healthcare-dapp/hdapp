import { AsyncAction } from "@hdapp/shared/web2-common/utils";
import { ethers } from "ethers";
import EventEmitter from "events";
import { makeAutoObservable, runInAction } from "mobx";
import { HDMAccountManagerAddress, HDMAccountManagerABI } from "../contract";

interface Account {
    isBanned: boolean
    isDoctor: boolean
}

export class AccountManager {
    private _contract: ethers.Contract;
    private _account: Account | null = null;

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
        private _signer: ethers.Signer,
        private _web3Address: string
    ) {
        this._contract = new ethers.Contract(HDMAccountManagerAddress, HDMAccountManagerABI, _signer);

        makeAutoObservable(this);

        void this._loadAccount.run();
    }

    get isLoading() {
        return this._loadAccount.pending;
    }

    private readonly _loadAccount = new AsyncAction(async () => {
        const account = await this._contract.getAccountInfo(this._web3Address);

        runInAction(() => {
            this._account = account;
        });
    });
}
