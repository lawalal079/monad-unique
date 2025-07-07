// scripts/checkAndSetImplementation.js

const { ethers } = require("ethers");
const MonadNFTFactoryABI = require("../src/abi/MonadNFTFactory.json");

// ====== CONFIGURE THESE ======
const FACTORY_ADDRESS = "0xd19f323240D89e7b3d49efb56F134ab1D88463bD";
const IMPLEMENTATION_ADDRESS = "0x06A56651116b24bE52012e15Ef2EA709a9F6D8B0"; // <-- FILL THIS IN
const PROVIDER_URL = "https://testnet-rpc.monad.xyz/"; // e.g. from Alchemy, Infura, or Monad node
const OWNER_PRIVATE_KEY = "0xbb1b0625a145982843ea95ed392e1a24df379a6f636e1aa9c675308c9e2f1f5a"; // Only needed if you want to set the implementation
// =============================

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(PROVIDER_URL);
  const factory = new ethers.Contract(FACTORY_ADDRESS, MonadNFTFactoryABI, provider);

  // 1. Check current implementation
  const currentImpl = await factory.implementation();
  console.log("Current implementation address:", currentImpl);

  if (currentImpl.toLowerCase() === IMPLEMENTATION_ADDRESS.toLowerCase()) {
    console.log("Implementation address is already correct.");
    return;
  }

  // 2. Set new implementation (if needed)
  if (!OWNER_PRIVATE_KEY || OWNER_PRIVATE_KEY === "YOUR_FACTORY_OWNER_PRIVATE_KEY") {
    console.log("To set the implementation, fill in your OWNER_PRIVATE_KEY in the script.");
    return;
  }

  const wallet = new ethers.Wallet(OWNER_PRIVATE_KEY, provider);
  const factoryWithSigner = factory.connect(wallet);

  const tx = await factoryWithSigner.setImplementation(IMPLEMENTATION_ADDRESS);
  console.log("Setting implementation, tx hash:", tx.hash);
  await tx.wait();
  console.log("Implementation address updated!");
}

main().catch(console.error);