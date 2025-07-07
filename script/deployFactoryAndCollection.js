const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // 1. Use the existing Collection Implementation (template)
  const collectionImpl = { address: "0x06A56651116b24bE52012e15Ef2EA709a9F6D8B0" }; // Existing implementation address
  console.log("Using existing Collection implementation at:", collectionImpl.address);

  // 2. Deploy the Factory, passing the implementation address
  console.log("\n2. Deploying Factory with proxy clone pattern...");
  const Factory = await ethers.getContractFactory("MonadNFTFactory");
  const factory = await Factory.deploy(collectionImpl.address);
  await factory.deployed();
  console.log("✅ Factory deployed to:", factory.address);
  console.log("✅ Factory uses proxy clones for low gas deployment (~5,000 gas per collection)");

  // 3. Transfer ownership of the factory to the desired owner
  console.log("\n3. Setting up ownership...");
  const desiredOwner = deployer.address; // Change this to your desired owner address
  console.log("Current Factory owner:", await factory.owner());
  
  // If you want to transfer to a different address, uncomment and modify:
  // const newOwner = "0x..."; // Replace with the new owner's address
  // await factory.transferOwnership(newOwner);
  // console.log("✅ Factory ownership transferred to:", newOwner);

  // 4. Verify the setup
  console.log("\n4. Verifying deployment...");
  const factoryImplementation = await factory.implementation();
  console.log("✅ Factory implementation address:", factoryImplementation);
  console.log("✅ Implementation matches:", factoryImplementation === collectionImpl.address ? "YES" : "NO");

  console.log("\n🎉 Deployment Complete!");
  console.log("📋 Summary:");
  console.log("   Collection Implementation:", collectionImpl.address);
  console.log("   Factory:", factory.address);
  console.log("   Factory Owner:", await factory.owner());
  console.log("\n💡 Users can now deploy collections for ~5,000 gas using proxy clones!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });