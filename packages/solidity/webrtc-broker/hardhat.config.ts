import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const {
    DEPLOY_KEY,
    PRIVATE_KEY,
    BLOCK_EXPLORER_API_KEY,
} = process.env;

const config: HardhatUserConfig = {
    solidity: "0.8.17",
    defaultNetwork: "deploy",
    networks: {
        ["polygon-mumbai"]: {
            url: `https://polygon-mumbai.g.alchemy.com/v2/${DEPLOY_KEY}`,
            accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
            // @ts-ignore
            blockExplorerUrl: "https://mumbai.polygonscan.com/"
        }
    },
    etherscan: {
        apiKey: {
            ["polygon-mumbai"]: BLOCK_EXPLORER_API_KEY!,
        },
        customChains: [
            {
                network: "polygon-mumbai",
                chainId: 80001,
                urls: {
                    apiURL: "https://api-testnet.polygonscan.com/api",
                    browserURL: "https://mumbai.polygonscan.com/"
                }
            }
        ]
    }
};

export default config;
