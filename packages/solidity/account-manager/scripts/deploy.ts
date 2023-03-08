import { writeFileSync } from "fs";
import { ethers, network } from "hardhat";
import { join } from "path";

async function main() {
    const AccountManagerSC = await ethers.getContractFactory("HDMAccountManager");
    const contract = await AccountManagerSC.deploy();

    // await contract.waitForDeployment();
    // const address = await contract.getAddress();
    await contract.deployed();
    const address = contract.address;
    console.log(`HDMAccountManager deployed to ${address} on network ${network.name}`);
    if ("blockExplorerUrl" in network.config && typeof network.config.blockExplorerUrl === "string")
        console.log(`Block explorer URL: ${join(network.config.blockExplorerUrl, "address", address)}`);

    writeFileSync("contract.txt", address);
    console.log("Waiting 15 seconds to get enough confirmations...");
    await new Promise(resolve => setTimeout(resolve, 15000));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
