import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BrowserProvider, Contract, parseUnits } from 'ethers';
import MonadNFTCollectionArtifact from '../abi/MonadNFTCollection.json';
import lighthouse from '@lighthouse-web3/sdk';
import { motion, AnimatePresence } from 'framer-motion';

const LIGHTHOUSE_API_KEY = process.env.REACT_APP_LIGHTHOUSE_API_KEY;

const MintNFT: React.FC = () => {
  const { address } = useParams<{ address: string }>();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [traits, setTraits] = useState([{ trait_type: '', value: '' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [destination, setDestination] = useState('');
  const [royaltyAddress, setRoyaltyAddress] = useState('');
  const [royaltyPercent, setRoyaltyPercent] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [mintedNFTDetails, setMintedNFTDetails] = useState<any>(null);
  const [mintTxHash, setMintTxHash] = useState<string | null>(null);

  const handleTraitChange = (index: number, field: 'trait_type' | 'value', value: string) => {
    const newTraits = [...traits];
    newTraits[index][field] = value;
    setTraits(newTraits);
  };

  const addTrait = () => {
    setTraits([...traits, { trait_type: '', value: '' }]);
  };

  const removeTrait = (index: number) => {
    setTraits(traits.filter((_, i) => i !== index));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadToIPFS = async (file: File): Promise<string> => {
    if (!LIGHTHOUSE_API_KEY) throw new Error('Lighthouse API key missing');
    const res = await lighthouse.upload([file], LIGHTHOUSE_API_KEY);
    if (!res || !res.data || !res.data.Hash) throw new Error('Lighthouse image upload failed');
    return `https://gateway.lighthouse.storage/ipfs/${res.data.Hash}`;
  };

  const uploadMetadataToIPFS = async (metadata: any): Promise<string> => {
    if (!LIGHTHOUSE_API_KEY) throw new Error('Lighthouse API key missing');
    const blob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
    const file = new File([blob], 'metadata.json');
    const res = await lighthouse.upload([file], LIGHTHOUSE_API_KEY);
    if (!res || !res.data || !res.data.Hash) throw new Error('Lighthouse metadata upload failed');
    return `https://gateway.lighthouse.storage/ipfs/${res.data.Hash}`;
  };

  // Helper to stringify traits for contract
  const formatTraits = (traitsArr: { trait_type: string; value: string }[]) => {
    // You can use JSON.stringify or a custom format
    return JSON.stringify(traitsArr.filter(t => t.trait_type && t.value));
  };

  // Simple rarity calculation (number of traits)
  const calculateRarity = (traitsArr: { trait_type: string; value: string }[]) => {
    return traitsArr.filter(t => t.trait_type && t.value).length;
  };

  React.useEffect(() => {
    async function fetchAddress() {
      if ((window as any).ethereum) {
        const provider = new BrowserProvider((window as any).ethereum);
        const signer = await provider.getSigner();
        const addr = await signer.getAddress();
        setDestination(addr);
        setRoyaltyAddress(addr);
      }
    }
    fetchAddress();
    // Listen for account changes
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts && accounts[0]) {
        setDestination(accounts[0]);
        setRoyaltyAddress(accounts[0]);
      }
    };
    if ((window as any).ethereum) {
      (window as any).ethereum.on('accountsChanged', handleAccountsChanged);
      return () => {
        (window as any).ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, []);

  React.useEffect(() => {
    async function fetchRoyaltyInfo() {
      if (address && (window as any).ethereum) {
        const provider = new BrowserProvider((window as any).ethereum);
        const contract = new Contract(address, MonadNFTCollectionArtifact.abi, provider);
        try {
          const [receiver, fee] = await contract.royaltyInfo(1); // 1 = dummy sale price
          setRoyaltyAddress(receiver);
          setRoyaltyPercent((Number(fee) / 100).toString()); // fee is in basis points (e.g., 500 = 5%)
        } catch (e) {
          setRoyaltyAddress('');
          setRoyaltyPercent('');
        }
      }
    }
    fetchRoyaltyInfo();
  }, [address]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      if (!address) throw new Error('No collection address');
      if (!name || !description || !image) throw new Error('All fields are required');
      if (!destination) throw new Error('Destination address is required');
      // 1. Upload image to IPFS
      const imageUrl = await uploadToIPFS(image);
      // 2. Build metadata (OpenSea/marketplace standard)
      const filteredTraits = traits.filter(t => t.trait_type && t.value);
      const metadata = {
        name,
        description,
        image: imageUrl,
        attributes: filteredTraits.map(t => ({ trait_type: t.trait_type, value: t.value }))
      };
      // 3. Upload metadata to IPFS
      const metadataUrl = await uploadMetadataToIPFS(metadata);
      // 4. Call contract mint function
      if (!(window as any).ethereum) throw new Error('Wallet not found');
      await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(address, MonadNFTCollectionArtifact.abi, signer);
      // Check if contract is paused
      let isPaused = false;
      try {
        isPaused = await contract.paused();
      } catch (e) {
        // If paused() does not exist, ignore
      }
      if (isPaused) {
        setError('Contract is paused. Please unpause before minting.');
        setLoading(false);
        return;
      }
      const tx = await contract.mint(
        destination, // address to
        metadataUrl, // string tokenURI_
        JSON.stringify(filteredTraits), // string traits_
        filteredTraits.length, // uint256 rarity_
        { gasLimit: 500000 }
      );
      await tx.wait();
      setSuccess('NFT minted successfully!');
      setMintedNFTDetails({
        name,
        description,
        image: imageUrl,
        attributes: filteredTraits,
        destination,
        metadataUrl
      });
      setMintTxHash(tx.hash);
      setShowSuccessModal(true);
    } catch (err: any) {
      setError(err.message || 'Minting failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1333] to-[#2d225a] text-white p-8 flex flex-col items-center relative">
      {showSuccessModal && mintedNFTDetails ? (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
          >
            <div className="relative z-10 bg-white/10 rounded-2xl shadow-2xl p-8 max-w-lg w-full flex flex-col items-center border border-white/20">
              <div className="w-full flex flex-col items-center">
                {mintedNFTDetails.image && (
                  <img src={mintedNFTDetails.image} alt="NFT" className="w-28 h-28 rounded-xl shadow mb-4 object-cover border-4 border-white" />
                )}
                <h2 className="text-3xl font-extrabold text-purple-500 mb-2">NFT Minted Successfully!</h2>
                <p className="text-white font-semibold mb-4">Your NFT has been minted and is now on-chain.</p>
                <div className="w-full text-left space-y-2">
                  <div>
                    <span className="font-semibold text-white">Name:</span> <span className="text-white font-bold">{mintedNFTDetails.name}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-white">Description:</span> <span className="text-white">{mintedNFTDetails.description}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-white">Destination Address:</span>
                    <span className="font-mono text-xs break-all text-white"> {mintedNFTDetails.destination}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-white">Attributes:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {Array.isArray(mintedNFTDetails.attributes) && mintedNFTDetails.attributes.map((attr: any, idx: number) => {
                        // Defensive check to ensure attr is a valid object
                        if (!attr || typeof attr !== 'object') {
                          console.warn('Invalid attribute found at index', idx, attr);
                          return null;
                        }
                        
                        const traitType = typeof attr.trait_type === 'string' ? attr.trait_type : 'Unknown';
                        const value = typeof attr.value === 'string' ? attr.value : 'Unknown';
                        
                        return (
                        <div key={idx} className="bg-purple-900/60 text-white px-3 py-1 rounded-full text-xs font-mono flex items-center border border-purple-400/30">
                            <span className="text-purple-200 font-bold mr-1">{traitType}:</span> <span>{value}</span>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                  {mintTxHash && (
                    <div>
                      <span className="font-semibold text-white">Transaction Hash:</span>
                      <span className="font-mono text-xs break-all ml-1 text-white">{mintTxHash}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-4 mt-6 w-full">
                  <button
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold"
                    onClick={() => {
                      setShowSuccessModal(false);
                      setMintedNFTDetails(null);
                      setMintTxHash(null);
                      setName('');
                      setDescription('');
                      setImage(null);
                      setImagePreview(null);
                      setTraits([{ trait_type: '', value: '' }]);
                      setDestination(destination);
                    }}
                  >
                    Mint Another NFT
                  </button>
                  {mintTxHash && (
                    <a
                      href={`https://testnet.monadexplorer.com/tx/${mintTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-center"
                    >
                      View on Explorer
                    </a>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      ) : (
        <>
          <button
            className="absolute top-6 left-6 flex items-center bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg transition-colors z-10"
            onClick={() => navigate(-1)}
            title="Back"
          >
            &#8592; Back
          </button>
          <h1 className="text-3xl font-bold mb-8">Mint NFT</h1>
          <form className="bg-white/10 rounded-lg p-8 w-full max-w-lg flex flex-col gap-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-purple-200 text-sm font-medium mb-2">NFT Image</label>
              <div className="flex flex-row items-center space-x-4 mb-2">
                <div className="w-32 h-32 rounded border-2 border-dashed border-white/20 bg-white/10 flex items-center justify-center overflow-hidden">
                  {imagePreview ? (
                    <img src={imagePreview} alt="NFT Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-purple-300 text-xs">No Image</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg min-w-[120px]"
                >
                  {imagePreview ? 'Change Image' : 'Upload Image'}
                </button>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleImageChange}
                />
              </div>
            </div>
            <div>
              <label className="block mb-2 font-semibold">Name</label>
              <input type="text" className="w-full px-3 py-2 bg-white/10 border border-purple-400 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-500" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div>
              <label className="block mb-2 font-semibold">Description</label>
              <textarea className="w-full px-3 py-2 bg-white/10 border border-purple-400 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-500 resize-none" value={description} onChange={e => setDescription(e.target.value)} required />
            </div>
            <div>
              <label className="block mb-2 font-semibold">Destination Address</label>
              <input type="text" className="w-full px-3 py-2 bg-white/10 border border-purple-400 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-500" value={destination} onChange={e => setDestination(e.target.value)} required />
            </div>
            <div>
              <label className="block text-purple-200 text-sm font-medium mb-2">Royalties</label>
              <div className="flex space-x-2 items-center mb-2">
                <input
                  type="text"
                  className="flex-1 px-3 py-2 bg-white/10 border border-purple-400 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-500"
                  value={royaltyAddress}
                  readOnly
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="w-20 px-3 py-2 bg-white/10 border border-purple-400 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-500 text-center"
                  value={royaltyPercent}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === '' || (Number(val) >= 0 && Number(val) <= 100)) {
                      setRoyaltyPercent(val);
                    }
                  }}
                  placeholder="%"
                />
              </div>
            </div>
            <div>
              <label className="block mb-2 font-semibold">Attributes</label>
              <div className={traits.length > 5 ? "max-h-64 overflow-y-auto" : ""}>
                {traits.map((trait, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Attribute Type (e.g. Background)"
                      className="flex-1 px-2 py-1 bg-white/10 border border-purple-400 rounded text-white text-xs focus:outline-none focus:border-purple-500"
                      value={trait.trait_type}
                      onChange={e => handleTraitChange(idx, 'trait_type', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Value (e.g. Blue)"
                      className="flex-1 px-2 py-1 bg-white/10 border border-purple-400 rounded text-white text-xs focus:outline-none focus:border-purple-500"
                      value={trait.value}
                      onChange={e => handleTraitChange(idx, 'value', e.target.value)}
                    />
                    <button type="button" onClick={() => removeTrait(idx)} className="text-red-400 font-bold px-2">×</button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addTrait} className="mt-2 bg-purple-700 hover:bg-purple-800 text-white px-3 py-1 rounded">Add Attribute</button>
            </div>
            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded mt-4 w-full flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                  Minting...
                </>
              ) : (
                'Mint NFT'
              )}
            </button>
            {error && <div className="text-red-400 font-semibold mt-2">{error}</div>}
            {success && <div className="text-green-400 font-semibold mt-2">{success}</div>}
          </form>
        </>
      )}
    </div>
  );
};

export default MintNFT; 