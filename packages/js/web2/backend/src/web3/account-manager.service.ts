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

const { error, trace } = new Logger("web3-account-manager");

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

    async getAccountInfo(address?: Web3Address | null): Promise<Web3UserEntity> {
        try {
            if (!address) {
                trace("getAccountInfo called without address");
                return {
                    isVerifiedDoctor: false,
                    isBanned: false,
                };
            }
            const info = await this._contract?.getAccountInfo(address);
            return {
                isVerifiedDoctor: !!info?.isDoctor,
                isBanned: !!info?.isBanned,
            };
        } catch (e) {
            error("getAccountInfo is bugged and returns an invalid response, defaulting to 00");
            return {
                isVerifiedDoctor: false,
                isBanned: false,
            };
        }
    }

    async promoteToDoctor(address: Web3Address) {
        if (!this._contract)
            return;

        await this._contract.promoteToDoctor(
            address,
        );
    }
}
