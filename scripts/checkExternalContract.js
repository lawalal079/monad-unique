const { ethers } = require("hardhat");

async function main() {
  const externalContractAddress = "0x929De60C388eF080793e9D9127D31f64AFB81dfB";
  
  console.log("🔍 Checking external contract:", externalContractAddress);
  console.log("=" .repeat(60));

  // Get the provider
  const provider = ethers.provider;
  
  try {
    // Check if contract exists
    const code = await provider.getCode(externalContractAddress);
    if (code === "0x") {
      console.log("❌ No contract found at this address");
      return;
    }
    console.log("✅ Contract found at address");

    // Try to create contract instance with your ABI
    const MonadNFTCollection = await ethers.getContractFactory("MonadNFTCollection");
    const expectedContract = MonadNFTCollection.attach(externalContractAddress);
    
    console.log("\n📋 Testing expected functions from your ABI:");
    console.log("-".repeat(40));

    // Test basic functions
    const functionsToTest = [
      { name: "name()", call: () => expectedContract.name() },
      { name: "symbol()", call: () => expectedContract.symbol() },
      { name: "owner()", call: () => expectedContract.owner() },
      { name: "totalSupply()", call: () => expectedContract.totalSupply() },
      { name: "paused()", call: () => expectedContract.paused() }
    ];

    for (const func of functionsToTest) {
      try {
        const result = await func.call();
        console.log(`✅ ${func.name}: ${result}`);
      } catch (error) {
        console.log(`❌ ${func.name}: FAILED - ${error.message}`);
      }
    }

    // Test minting-related functions
    console.log("\n🎨 Testing minting functions:");
    console.log("-".repeat(40));

    const mintFunctions = [
      { name: "mint(address,uint256)", description: "Basic mint function" },
      { name: "mintWithURI(address,uint256,string)", description: "Mint with URI" },
      { name: "setTokenURI(uint256,string)", description: "Set token URI" },
      { name: "tokenURI(uint256)", description: "Get token URI" }
    ];

    for (const func of mintFunctions) {
      try {
        // Try to get function signature
        const functionSignature = func.name;
        console.log(`🔍 ${func.name}: ${func.description}`);
        
        // Try to call with dummy data
        if (func.name === "tokenURI(uint256)") {
          try {
            const result = await expectedContract.tokenURI(1);
            console.log(`   ✅ Function exists, tokenURI(1) = ${result}`);
          } catch (error) {
            console.log(`   ❌ Function call failed: ${error.message}`);
          }
        }
      } catch (error) {
        console.log(`   ❌ Function not found: ${error.message}`);
      }
    }

    // Check for role-based permissions
    console.log("\n🔐 Testing permission functions:");
    console.log("-".repeat(40));

    try {
      const MINTER_ROLE = await expectedContract.MINTER_ROLE();
      console.log(`✅ MINTER_ROLE: ${MINTER_ROLE}`);
      
      // Check if current signer has minter role
      const [signer] = await ethers.getSigners();
      const hasMinterRole = await expectedContract.hasRole(MINTER_ROLE, signer.address);
      console.log(`🔑 Signer has MINTER_ROLE: ${hasMinterRole}`);
    } catch (error) {
      console.log(`❌ Role-based permissions not found: ${error.message}`);
    }

    // Check for upgradeable functions
    console.log("\n⬆️ Testing upgradeable functions:");
    console.log("-".repeat(40));

    try {
      const implementation = await expectedContract.implementation();
      console.log(`✅ Implementation address: ${implementation}`);
      console.log("📋 This appears to be a proxy contract");
    } catch (error) {
      console.log(`❌ Not a proxy or implementation() not found: ${error.message}`);
    }

    // Try to get contract bytecode for comparison
    console.log("\n🔍 Contract Analysis:");
    console.log("-".repeat(40));
    
    const bytecode = await provider.getCode(externalContractAddress);
    console.log(`📏 Contract bytecode length: ${bytecode.length} characters`);
    
    if (bytecode.length > 100) {
      console.log("📋 This appears to be a full implementation (not a minimal proxy)");
    } else {
      console.log("📋 This appears to be a minimal proxy (very short bytecode)");
    }

  } catch (error) {
    console.log("❌ Error analyzing contract:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 