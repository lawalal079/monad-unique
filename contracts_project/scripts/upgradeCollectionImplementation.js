// scripts/upgradeCollectionImplementation.js
// Usage: npx hardhat run scripts/upgradeCollectionImplementation.js --network <network>

const { ethers, upgrades } = require("hardhat");
const factoryAbi = require("../artifacts/contracts/MonadNFTFactory.sol/MonadNFTFactory.json").abi;

async function main() {
  // Replace with your deployed implementation address (if needed)
  // const implementationAddress = "0x...";

  // Replace with your new implementation contract name
  const NEW_IMPL_CONTRACT = "MonadNFTCollection";

  // Your factory address (from MonadNFTFactory.sol)
  const factoryAddress = "0x43976240c057C7b04AA2875EEd545B6C1C491119";

  // Deploy new implementation
  console.log("Deploying new implementation...");
  const NewImpl = await ethers.getContractFactory(NEW_IMPL_CONTRACT);
  const newImpl = await NewImpl.deploy();
  await newImpl.deployed();
  console.log("New implementation deployed at:", newImpl.address);

  // Update your factory's implementation address for new collections
  const factory = await ethers.getContractAt(factoryAbi, factoryAddress);
  const tx = await factory.setImplementation(newImpl.address);
  await tx.wait();
  console.log("Factory implementation updated!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 