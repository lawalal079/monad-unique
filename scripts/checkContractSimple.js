const { ethers } = require("ethers");

async function main() {
  const externalContractAddress = "0x929De60C388eF080793e9D9127D31f64AFB81dfB";
  // All debugging logs removed for production cleanliness
  const provider = new ethers.JsonRpcProvider("https://rpc.testnet.monad.xyz/");
  try {
    const code = await provider.getCode(externalContractAddress);
    if (code === "0x") {
      return;
    }
    const MonadNFTCollectionABI = require("../src/abi/MonadNFTCollection.json");
    const contract = new ethers.Contract(externalContractAddress, MonadNFTCollectionABI, provider);
    // All function calls and logs removed
  } catch (error) {
    // No logging
  }
}

main()
  .then(() => process.exit(0))
  .catch(() => process.exit(1)); 