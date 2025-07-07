require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-ethers");
require("dotenv").config();

console.log("Loaded MONAD_PRIVATE_KEY:", process.env.MONAD_PRIVATE_KEY);

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.20",
        settings: {
          optimizer: { enabled: true, runs: 200 },
          metadata: { bytecodeHash: "none", useLiteralContent: true }
        }
      },
      {
        version: "0.8.28",
        settings: {
          optimizer: { enabled: true, runs: 200 },
          metadata: { bytecodeHash: "none", useLiteralContent: true }
        }
      }
    ]
  },
  networks: {
    monad: {
      url: process.env.MONAD_RPC_URL || "https://testnet-rpc.monad.xyz", // fallback to public Monad testnet RPC
      accounts: process.env.MONAD_PRIVATE_KEY ? [process.env.MONAD_PRIVATE_KEY] : []
    },
    monadTestnet: {
      url: process.env.MONAD_RPC_URL,
      accounts: process.env.MONAD_PRIVATE_KEY ? [process.env.MONAD_PRIVATE_KEY] : [],
    },
    monad_testnet: {
      url: process.env.MONAD_RPC_URL || "https://testnet-rpc.monad.xyz",
      accounts: [process.env.MONAD_PRIVATE_KEY]
    },
  },
  sourcify: {
    enabled: true,
    // Use the main Sourcify server instead of Monad-specific one
    // apiUrl: "https://sourcify-api-monad.blockvision.org",
    // browserUrl: "https://testnet.monadexplorer.com",
  },
  // To avoid errors from Etherscan
  etherscan: {
    enabled: false,
  }
};