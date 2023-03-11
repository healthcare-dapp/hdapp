import { ethers } from "ethers";

export type TypechainContractFactory<C extends ethers.BaseContract> = {
    connect(address: string, runner?: ethers.ContractRunner | null): C
};

export class Web3ContractProvider<C extends ethers.BaseContract> {
    #contract: C;

    constructor(
        factory: TypechainContractFactory<C>,
        address: string,
        signer: ethers.Wallet
    ) {
        this.#contract = factory.connect(address, signer);
    }

    get contract() {
        return this.#contract;
    }
}
