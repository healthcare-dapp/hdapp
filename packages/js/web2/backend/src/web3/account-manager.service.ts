import { Web3Address } from "@hdapp/shared/web2-common/types";
import { Injectable, OnModuleInit } from "@nestjs/common";
import { ethers } from "ethers";
import { AccountManagerAbi } from "./abi/account-manager.abi";

const {
    WEB3_JSON_RPC_URL,
    WEB3_PRIVATE_KEY,
    WEB3_USER_VERIFICATION_ADDRESS,
} = process.env;

@Injectable()
export class Web3AccountManagerService implements OnModuleInit {
    private _provider: ethers.providers.Provider | null = null;

    private _signer: ethers.Signer | null = null;

    private _reader: ethers.Contract | null = null;

    private _writer: ethers.Contract | null = null;

    onModuleInit() {
        this.connect();
    }

    disconnect() {
        this._signer = null;
        this._provider = null;
        this._reader = null;
        this._writer = null;
    }

    connect() {
        // @ts-ignore
        const provider = this._provider = new ethers.providers.StaticJsonRpcProvider(WEB3_JSON_RPC_URL);

        this._signer = new ethers.Wallet(WEB3_PRIVATE_KEY!, provider);

        this.loadContract();
    }

    loadContract() {
        if (!this._provider || !this._signer)
            return;
        this._reader = new ethers.Contract(
            WEB3_USER_VERIFICATION_ADDRESS!,
            AccountManagerAbi,
            this._provider,
        );
        this._writer = new ethers.Contract(
            WEB3_USER_VERIFICATION_ADDRESS!,
            AccountManagerAbi,
            this._signer,
        );
    }

    async promoteToDoctor(address: Web3Address) {
        if (!this._writer)
            return;

        await this._writer.promoteToDoctor(
            address,
        );
    }
}
