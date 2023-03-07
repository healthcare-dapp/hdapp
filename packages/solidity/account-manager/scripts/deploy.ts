import { writeFileSync } from "fs";
import { ethers, network } from "hardhat";
import { join } from "path";

async function main() {
    const AccountManagerSC = await ethers.getContractFactory("HDMAccountManager");
    const contract = await AccountManagerSC.deploy();

    await contract.deployed();
    console.log(`User Verification Smart Contract deployed to ${contract.address} on network ${network.name}`);
    if ("blockExplorerUrl" in network.config && typeof network.config.blockExplorerUrl === "string")
        console.log(`Block explorer URL: ${join(network.config.blockExplorerUrl, "address", contract.address)}`);

    writeFileSync("contract.txt", contract.address);
    console.log("Waiting 15 seconds to get enough confirmations...");
    await new Promise(resolve => setTimeout(resolve, 15000));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
