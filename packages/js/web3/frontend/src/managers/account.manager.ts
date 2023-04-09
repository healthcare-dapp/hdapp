import { AsyncAction } from "@hdapp/shared/web2-common/utils";
import { ethers, EtherscanPlugin, EtherscanProvider, formatEther, Network, Transaction } from "ethers";
import EventEmitter from "events";
import { makeAutoObservable, runInAction } from "mobx";
import { Web3Manager } from "./web3.manager";

interface Web3Account {
    isBanned: boolean
    isDoctor: boolean
}

export class AccountManager {
    private _account: Web3Account | null = null;
    private _balance: bigint | null = null;
    private _etherscan: EtherscanProvider;
    private _history: Transaction[] = [];

    private _events = new EventEmitter();

    private _emit = this._events.emit;
    on = this._events.addListener;
    off = this._events.removeListener;

    get balance() {
        if (!this._balance)
            return 0;

        return formatEther(this._balance);
    }

    get feesSpent() {
        return formatEther(
            this._history.map(t => t.maxFeePerGas! * t.gasLimit)
                .reduce((a, b) => a + b, 0n)
        );
    }

    get blockExplorerUrl() {
        return "https://mumbai.polygonscan.com/address/" + this._web3.address;
    }

    get distributed() {
        return formatEther(
            this._history.map(t => t.value)
                .reduce((a, b) => a + b, 0n)
        );
    }

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
        private _web3: Web3Manager
    ) {
        makeAutoObservable(this);

        const mumbaiNetwork: Network = new Network("mumbai", 137);
        mumbaiNetwork.attachPlugin(new EtherscanPlugin("https://api-testnet.polygonscan.com"));

        this._etherscan = new ethers.EtherscanProvider(mumbaiNetwork);

        void this._loadAccount.run();
        void this._loadMiscInfo.run();
    }

    get isLoading() {
        return this._loadAccount.pending;
    }

    private readonly _loadAccount = new AsyncAction(async () => {
        try {
            const account = await this._web3.accountManager.getAccountInfo(this._web3.address);
            runInAction(() => {
                this._account = { isBanned: account.isBanned, isDoctor: account.isDoctor };
            });
        } catch (e) {
            console.error(e);
        }
    });

    private readonly _loadMiscInfo = new AsyncAction(async () => {
        try {
            const balance = await this._web3.signer.provider?.getBalance(this._web3.address);
            runInAction(() => {
                this._balance = balance ?? null;
            });

            const response = await this._etherscan.fetch("account", {
                address: this._web3.address,
                action: "txlist",
                startblock: 0,
                endblock: 999999,
                page: 1,
                sort: "desc",
            });

            console.log(response);

            // @ts-ignore
            const history = await this._etherscan.getHistory(this._web3.address);
            runInAction(() => {
                this._history = history as Transaction[];
            });
        } catch (e) {
            console.error(e);
        }
    });
}
