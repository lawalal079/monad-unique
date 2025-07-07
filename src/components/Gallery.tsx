import React, { useState } from 'react';
import { useImportedAssets } from '../contexts/ImportedAssetsContext';
import { ethers } from 'ethers';
import MonadNFTCollectionArtifact from '../abi/MonadNFTCollection.json';
import lighthouse from '@lighthouse-web3/sdk';
import { motion, AnimatePresence } from 'framer-motion';

// Simple SVG Icons to replace lucide-react
const ExternalLinkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
    <polyline points="15,3 21,3 21,9"></polyline>
    <line x1="10" y1="14" x2="21" y2="3"></line>
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22,4 12,14.01 9,11.01"></polyline>
  </svg>
);

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12,6 12,12 16,14"></polyline>
  </svg>
);

const AlertCircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>
);

const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);

const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const LIGHTHOUSE_API_KEY = process.env.REACT_APP_LIGHTHOUSE_API_KEY;

interface MintedAsset {
  id: string;
  assetIndex: number;
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  tokenId?: number;
  collectionAddress: string;
  timestamp: number;
}

const Gallery: React.FC = () => {
  const { assets, setAssets, clearCorruptedData } = useImportedAssets();
  const [mintModalOpen, setMintModalOpen] = useState(false);
  const [mintAssetIdx, setMintAssetIdx] = useState<number | null>(null);
  const [mintLoading, setMintLoading] = useState(false);
  const [mintError, setMintError] = useState<string | null>(null);
  const [mintSuccess, setMintSuccess] = useState<string | null>(null);
  const [collectionAddress, setCollectionAddress] = useState('');
  const [mintedAssets, setMintedAssets] = useState<MintedAsset[]>([]);
  const [showMintHistory, setShowMintHistory] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editAssetIdx, setEditAssetIdx] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', image: '', traits: [] as { trait_type: string; value: string }[] });

  const openMintModal = (idx: number) => {
    setMintAssetIdx(idx);
    setMintModalOpen(true);
    setMintError(null);
    setMintSuccess(null);
  };

  const closeMintModal = () => {
    setMintModalOpen(false);
    setMintAssetIdx(null);
    setMintLoading(false);
    setMintError(null);
    setMintSuccess(null);
  };

  const mintAsset = mintAssetIdx !== null ? assets[mintAssetIdx] : null;

  // Upload metadata to IPFS
  const uploadMetadataToIPFS = async (metadata: any): Promise<string> => {
    if (!LIGHTHOUSE_API_KEY) throw new Error('Lighthouse API key missing');
    const blob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
    const file = new File([blob], 'metadata.json');
    const res = await lighthouse.upload([file], LIGHTHOUSE_API_KEY);
    if (!res || !res.data || !res.data.Hash) throw new Error('Lighthouse metadata upload failed');
    return `https://gateway.lighthouse.storage/ipfs/${res.data.Hash}`;
  };

  // Format traits for contract
  const formatTraits = (traitsArr: { trait_type: string; value: string }[]) => {
    return JSON.stringify(traitsArr.filter(t => t.trait_type && t.value));
  };

  // Calculate rarity (number of traits)
  const calculateRarity = (traitsArr: { trait_type: string; value: string }[]) => {
    return traitsArr.filter(t => t.trait_type && t.value).length;
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Get block explorer URL
  const getBlockExplorerUrl = (txHash: string) => {
    // You can customize this based on your network
    return `https://sepolia.etherscan.io/tx/${txHash}`;
  };

  // Check if asset is minted
  const isAssetMinted = (assetIndex: number) => {
    return mintedAssets.some(minted => minted.assetIndex === assetIndex && minted.status === 'confirmed');
  };

  // Get mint status for asset
  const getMintStatus = (assetIndex: number) => {
    const minted = mintedAssets.find(minted => minted.assetIndex === assetIndex);
    return minted?.status || null;
  };

  // Handle minting
  const handleMint = async () => {
    if (!mintAsset || !collectionAddress) {
      setMintError('Please provide a collection address');
      return;
    }

    setMintLoading(true);
    setMintError(null);
    setMintSuccess(null);

    try {
      // Check if wallet is connected
      if (!(window as any).ethereum) {
        throw new Error('Wallet not found. Please install MetaMask.');
      }

      // Request account access
      await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      
      const provider = new ethers.providers.Web3Provider((window as any).ethereum);
      const signer = provider.getSigner();
      const userAddress = await signer.getAddress();

      // Create contract instance
      const contract = new ethers.Contract(collectionAddress, MonadNFTCollectionArtifact.abi, signer);

      // Check if contract is paused
      let isPaused = false;
      try {
        isPaused = await contract.paused();
      } catch (e) {
        // If paused() does not exist, ignore
      }
      
      if (isPaused) {
        throw new Error('Contract is paused. Please unpause before minting.');
      }

      // Prepare metadata
      const metadata = {
        name: mintAsset.name || 'Untitled NFT',
        description: mintAsset.description || '',
        image: mintAsset.image || '',
        attributes: mintAsset.traits || []
      };

      // Upload metadata to IPFS
      const metadataUrl = await uploadMetadataToIPFS(metadata);

      // Format traits and calculate rarity
      const traitsString = formatTraits(mintAsset.traits || []);
      const rarity = calculateRarity(mintAsset.traits || []);

      // Mint the NFT
      const tx = await contract.mint(
        userAddress, // address to
        metadataUrl, // string tokenURI_
        traitsString, // string traits_
        rarity, // uint256 rarity_
        { gasLimit: 500000 }
      );

      // Add to minted assets with pending status
      const mintedAsset: MintedAsset = {
        id: `${mintAssetIdx}-${Date.now()}`,
        assetIndex: mintAssetIdx!,
        txHash: tx.hash,
        status: 'pending',
        collectionAddress,
        timestamp: Date.now()
      };
      setMintedAssets(prev => [...prev, mintedAsset]);

      setMintSuccess(`Transaction submitted! Hash: ${tx.hash}`);
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      // Update status to confirmed
      setMintedAssets(prev => prev.map(asset => 
        asset.txHash === tx.hash 
          ? { ...asset, status: 'confirmed' as const }
          : asset
      ));

      setMintSuccess(`NFT minted successfully! Transaction: ${tx.hash}`);
      
      // Close modal after a delay
      setTimeout(() => {
        closeMintModal();
      }, 3000);

    } catch (err: any) {
      setMintError(err.message || 'Minting failed');
      
      // Update status to failed if we have a transaction hash
      if (mintedAssets.length > 0) {
        setMintedAssets(prev => prev.map(asset => 
          asset.assetIndex === mintAssetIdx 
            ? { ...asset, status: 'failed' as const }
            : asset
        ));
      }
    } finally {
      setMintLoading(false);
    }
  };

  // Handler to open edit modal
  const openEditModal = (idx: number) => {
    const asset = assets[idx];
    setEditAssetIdx(idx);
    setEditForm({
      name: asset.name || '',
      description: asset.description || '',
      image: asset.image || '',
      traits: Array.isArray(asset.traits) ? asset.traits.map(t => ({ ...t })) : [],
    });
    setEditModalOpen(true);
  };

  // Handler to close edit modal
  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditAssetIdx(null);
    setEditForm({ name: '', description: '', image: '', traits: [] });
  };

  // Handler for form changes
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  // Trait change handler
  const handleTraitChange = (idx: number, field: 'trait_type' | 'value', value: string) => {
    setEditForm((prev) => ({
      ...prev,
      traits: prev.traits.map((t, i) => i === idx ? { ...t, [field]: value } : t)
    }));
  };

  // Add trait handler
  const addTrait = () => {
    setEditForm((prev) => ({
      ...prev,
      traits: [...prev.traits, { trait_type: '', value: '' }]
    }));
  };

  // Delete trait handler
  const deleteTrait = (idx: number) => {
    setEditForm((prev) => ({
      ...prev,
      traits: prev.traits.filter((_, i) => i !== idx)
    }));
  };

  // Handler to save edits
  const saveEdit = () => {
    if (editAssetIdx === null) return;
    setAssets((prev) =>
      prev.map((asset, idx) =>
        idx === editAssetIdx ? { ...asset, ...editForm, traits: editForm.traits } : asset
      )
    );
    closeEditModal();
  };

  return (
    <div className="space-y-6">
      {/* Header with Mint History */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl p-6 border border-white/20"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-white font-semibold text-xl">Imported Assets Gallery</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setShowMintHistory(!showMintHistory)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
            >
              <EyeIcon />
              Mint History
            </button>
          </div>
        </div>
      </motion.div>

      {/* Mint History Modal */}
      {showMintHistory && (
                <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 rounded-lg p-6 border border-white/20 mb-6"
        >
          <h4 className="text-white font-semibold mb-4">Mint History</h4>
          {mintedAssets.length === 0 ? (
            <p className="text-purple-200">No minting history yet.</p>
          ) : (
            <div className="space-y-3">
              {mintedAssets.map((minted) => {
                const asset = assets[minted.assetIndex];
                return (
                  <div key={minted.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      {asset?.image && (
                        <img src={asset.image} alt={asset.name} className="w-12 h-12 object-cover rounded" />
                      )}
                      <div>
                        <div className="text-white font-medium">{asset?.name || 'Unknown Asset'}</div>
                        <div className="text-purple-200 text-sm">
                          {new Date(minted.timestamp).toLocaleString()}
                        </div>
                    </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Status Icon */}
                      {minted.status === 'pending' && (
                        <ClockIcon />
                      )}
                      {minted.status === 'confirmed' && (
                        <CheckCircleIcon />
                      )}
                      {minted.status === 'failed' && (
                        <AlertCircleIcon />
                      )}
                      
                      {/* Transaction Hash */}
                      <div className="text-xs text-purple-200 font-mono">
                        {minted.txHash.slice(0, 6)}...{minted.txHash.slice(-4)}
          </div>

                      {/* Copy Button */}
                      <button 
                        onClick={() => copyToClipboard(minted.txHash)}
                        className="text-purple-300 hover:text-purple-100"
                      >
                        <CopyIcon />
                      </button>
                      
                      {/* Block Explorer Link */}
                      <a 
                        href={getBlockExplorerUrl(minted.txHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-300 hover:text-purple-100"
                      >
                        <ExternalLinkIcon />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* Assets Grid */}
      {assets.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {assets.map((asset, idx) => {
            // Defensive check to ensure asset is a valid object
            if (!asset || typeof asset !== 'object') {
              console.warn('Invalid asset found at index', idx, asset);
              return null;
            }

            const mintStatus = getMintStatus(idx);
            const isMinted = isAssetMinted(idx);
            
            return (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white/5 rounded-lg p-2 flex flex-col items-center relative"
              >
                {/* Minted Badge */}
                {isMinted && (
                  <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <CheckCircleIcon />
                    Minted
          </div>
                )}
                
                {/* Pending Badge */}
                {mintStatus === 'pending' && (
                  <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <ClockIcon />
                    Pending
        </div>
                )}
                
                {/* Failed Badge */}
                {mintStatus === 'failed' && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <AlertCircleIcon />
                    Failed
      </div>
                )}

                {asset.image && typeof asset.image === 'string' && (
                  <img src={asset.image} alt={asset.name || `asset-${idx}`} className="w-full h-32 object-cover rounded mb-2" />
                )}
                <div className="text-white text-sm font-bold mb-1">
                  {typeof asset.name === 'string' ? asset.name : 'Untitled'}
                </div>
                <div className="text-white/70 text-xs mb-2 text-center">
                  {typeof asset.description === 'string' ? asset.description : ''}
          </div>
                <div className="flex gap-2">
                  <button 
                    className={`px-2 py-1 rounded text-xs transition-all duration-200 ${
                      isMinted 
                        ? 'bg-green-600 text-white cursor-not-allowed' 
                        : mintStatus === 'pending'
                        ? 'bg-yellow-600 text-white cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }`} 
                    onClick={() => !isMinted && mintStatus !== 'pending' && openMintModal(idx)}
                    disabled={isMinted || mintStatus === 'pending'}
                  >
                    {isMinted ? 'Minted' : mintStatus === 'pending' ? 'Pending' : 'Mint'}
                  </button>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs" onClick={() => openEditModal(idx)}>
                    Edit
                  </button>
                  <button className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs" onClick={() => setAssets(prev => prev.filter((_, i) => i !== idx))}>Delete</button>
          </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-white text-center py-16">No imported assets to display.</div>
      )}
      
      {/* Mint Modal */}
      <AnimatePresence>
        {mintModalOpen && mintAsset && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#2d225a] rounded-2xl p-8 max-w-md w-full shadow-2xl relative text-white flex flex-col items-center border border-white/20"
            >
              <button
                className="absolute top-4 right-4 text-white text-2xl font-bold hover:text-purple-300"
                onClick={closeMintModal}
                aria-label="Close"
              >
                &times;
              </button>
              
              {mintAsset.image && (
                <img src={mintAsset.image} alt={mintAsset.name || 'NFT'} className="w-40 h-40 object-cover rounded mb-4 border border-white/20 bg-white/10" />
              )}
              
              <div className="text-xl font-bold mb-2 text-center">{mintAsset.name || 'Untitled'}</div>
              <div className="text-purple-200 text-sm mb-4 text-center">{mintAsset.description || ''}</div>
              
              {/* Collection Address Input */}
              <div className="w-full mb-4">
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Collection Contract Address
                </label>
                <input
                  type="text"
                  value={collectionAddress}
                  onChange={(e) => setCollectionAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-500"
                />
      </div>

              {/* Error Message */}
              {mintError && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm"
                >
                  {mintError}
                </motion.div>
              )}

              {/* Success Message */}
              {mintSuccess && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-300 text-sm"
                >
                  {mintSuccess}
                </motion.div>
              )}

              {/* Mint Button */}
              <button 
                className={`w-full font-bold py-2 px-4 rounded mt-4 transition-all duration-200 ${
                  mintLoading 
                    ? 'bg-gray-600 text-gray-300 cursor-not-allowed' 
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
                onClick={handleMint}
                disabled={mintLoading}
              >
                {mintLoading ? 'Minting...' : 'Confirm Mint'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      {editModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-[#2d225a] rounded-2xl p-8 max-w-md w-full shadow-2xl relative text-white flex flex-col items-center border border-white/20"
          >
            <button
              className="absolute top-4 right-4 text-white text-2xl font-bold hover:text-purple-300"
              onClick={closeEditModal}
              aria-label="Close"
            >
              &times;
            </button>
            <div className="text-xl font-bold mb-4 text-center">Edit Asset</div>
            <div className="w-full mb-4">
              <label className="block text-sm font-medium text-purple-200 mb-2">Name</label>
              <input
                type="text"
                name="name"
                value={editForm.name}
                onChange={handleEditFormChange}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-500"
                placeholder="Asset name"
              />
            </div>
            <div className="w-full mb-4">
              <label className="block text-sm font-medium text-purple-200 mb-2">Description</label>
              <textarea
                name="description"
                value={editForm.description}
                onChange={handleEditFormChange}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-500 resize-none"
                placeholder="Asset description"
                rows={3}
              />
            </div>
            <div className="w-full mb-4">
              <label className="block text-sm font-medium text-purple-200 mb-2">Image URL</label>
              <input
                type="text"
                name="image"
                value={editForm.image}
                onChange={handleEditFormChange}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-500"
                placeholder="https://..."
              />
            </div>
            <div className="w-full mb-4">
              <label className="block text-sm font-medium text-purple-200 mb-2">Traits</label>
              {editForm.traits.length === 0 && (
                <div className="text-purple-300 text-xs mb-2">No traits yet. Add one below.</div>
              )}
              <div className="space-y-2">
                {editForm.traits.map((trait, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={trait.trait_type}
                      onChange={e => handleTraitChange(i, 'trait_type', e.target.value)}
                      placeholder="Trait type"
                      className="flex-1 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
                    />
                    <input
                      type="text"
                      value={trait.value}
                      onChange={e => handleTraitChange(i, 'value', e.target.value)}
                      placeholder="Value"
                      className="flex-1 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
                    />
                    <button type="button" onClick={() => deleteTrait(i)} className="text-red-400 hover:text-red-600 text-lg px-2" title="Delete trait">
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addTrait} className="mt-2 flex items-center gap-1 text-green-400 hover:text-green-600 text-sm font-bold">
                <span className="text-lg">＋</span> Add Trait
              </button>
            </div>
            <div className="flex gap-4 w-full mt-2">
              <button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold"
                onClick={saveEdit}
                type="button"
              >
                Save
              </button>
              <button
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-bold"
                onClick={closeEditModal}
                type="button"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Gallery; 