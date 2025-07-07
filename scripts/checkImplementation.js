const { ethers } = require("ethers");

// === CONFIGURATION ===
// Replace with your RPC URL
const RPC_URL = "https://testnet-rpc.monad.xyz";
// Add your proxy (collection) addresses here
const proxyAddresses = [
  "0x0Ac8A2AE6c7603221A7486d16Bb3ee6deEf391B8",
  // Add more addresses as needed
];

// ERC1967 implementation slot
const IMPLEMENTATION_SLOT = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";

async function getImplementationAddress(provider, proxyAddress) {
  const implHex = await provider.getStorageAt(proxyAddress, IMPLEMENTATION_SLOT);
  // The address is right-padded in the slot
  return ethers.utils.getAddress("0x" + implHex.slice(-40));
}

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  for (const addr of proxyAddresses) {
    try {
      const impl = await getImplementationAddress(provider, addr);
      console.log(`Implementation address for proxy ${addr}: ${impl}`);
    } catch (err) {
      console.error(`Failed to fetch implementation for proxy ${addr}:`, err.message || err);
    }
  }
}

main(); 