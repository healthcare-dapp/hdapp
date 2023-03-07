import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
    solidity: "0.8.17",
    defaultNetwork: "deploy",
    networks: {
        ["polygon-mumbai"]: {
            url: "https://polygon-mumbai.g.alchemy.com/v2/WDJFOaajRdjZqM82RoLrLLcq0Hhivrlh",
            accounts: [
                "c31e3902ce32b1f25629c8d4d5e6118a63815515cb23d95d0a0c1888f5a842d0"
                // 0x9d88CD36D2f1344A32A026C916A011bF8781cE9B
            ]
        }
    }
};

export default config;
