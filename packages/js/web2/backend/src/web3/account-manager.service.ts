import { Web3Address } from "@hdapp/shared/web2-common/types";
import { HDMAccountManager__factory, HDMAccountManager } from "@hdapp/solidity/account-manager";
import { Injectable, OnModuleInit } from "@nestjs/common";
import { ethers } from "ethers";

const {
    WEB3_JSON_RPC_URL,
    WEB3_PRIVATE_KEY,
    WEB3_ACCOUNT_MANAGER_ADDRESS,
} = process.env;

@Injectable()
export class Web3AccountManagerService implements OnModuleInit {
    private _contract: HDMAccountManager | null = null;

    onModuleInit() {
        this.connect();
    }

    disconnect() {
        this._contract = null;
    }

    connect() {
        const provider = new ethers.JsonRpcProvider(WEB3_JSON_RPC_URL);
        const signer = new ethers.Wallet(WEB3_PRIVATE_KEY!, provider);

        this._contract = HDMAccountManager__factory.connect(
            WEB3_ACCOUNT_MANAGER_ADDRESS!,
            signer
        );
    }

    async promoteToDoctor(address: Web3Address) {
        if (!this._contract)
            return;

        await this._contract.promoteToDoctor(
            address,
        );
    }
}
