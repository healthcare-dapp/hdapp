import { Web3Address } from "@hdapp/shared/web2-common/types";
import { Logger } from "@hdapp/shared/web2-common/utils/logger";
import { HDMAccountManager__factory, HDMAccountManager } from "@hdapp/solidity/account-manager";
import { Injectable, OnModuleInit } from "@nestjs/common";
import { ethers } from "ethers";
import { Web3UserEntity } from "../entities/user-full.entity";

const {
    WEB3_JSON_RPC_URL,
    WEB3_PRIVATE_KEY,
    WEB3_ACCOUNT_MANAGER_ADDRESS,
} = process.env;

const { debug, trace } = new Logger("web3-account-manager");

@Injectable()
export class Web3AccountManagerService implements OnModuleInit {
    private _signer: ethers.Wallet | null = null;
    private _contract: HDMAccountManager | null = null;

    onModuleInit() {
        this.connect();
    }

    disconnect() {
        this._contract = null;
    }

    connect() {
        const provider = new ethers.JsonRpcProvider(WEB3_JSON_RPC_URL);
        const signer = this._signer = new ethers.Wallet(WEB3_PRIVATE_KEY!, provider);

        this._contract = HDMAccountManager__factory.connect(
            WEB3_ACCOUNT_MANAGER_ADDRESS!,
            signer
        );
    }

    async getAccountInfo(address?: Web3Address | null): Promise<Web3UserEntity> {
        if (!this._contract)
            throw new Error("no contract");

        if (!address) {
            trace("getAccountInfo called without address");
            return {
                isVerifiedDoctor: false,
                isBanned: false,
                isProfilePublic: false,
            };
        }

        const info = await this._contract.getAccountInfo(address);
        return {
            isVerifiedDoctor: !!info?.isDoctor,
            isBanned: !!info?.isBanned,
            isProfilePublic: !!info?.isProfilePublic,
        };
    }

    async giveFreeMoney(address: Web3Address) {
        if (!this._signer)
            throw new Error("no signer");

        const amount = ethers.parseEther("0.005");

        debug("Sending", amount, "MATIC to", address);

        const txn = await this._signer.sendTransaction({
            to: address,
            value: amount,
        });
        await txn.wait(1);

        debug("Successfully sent MATIC to", address);
    }

    async banUser(address: Web3Address) {
        if (!this._contract)
            throw new Error("no contract");

        await this._contract.ban(address);
    }

    async promoteToDoctor(address: Web3Address) {
        if (!this._contract)
            throw new Error("no contract");

        await this._contract.promoteToDoctor(
            address,
        );
    }
}
