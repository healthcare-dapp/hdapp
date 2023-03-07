import { ethers } from "hardhat";

async function main() {
    const AccessControlSC = await ethers.getContractFactory("HDMAccessControl");
    const contract = await AccessControlSC.deploy();

    await contract.waitForDeployment();

    const address = await contract.getAddress();

    console.log(`Access Control Smart Contract deployed to ${address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
