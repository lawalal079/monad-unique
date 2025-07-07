import React, { useState, useEffect, useRef } from 'react';
import { useWallet } from '../contexts/WalletContext';
import MonadNFTFactoryABI from '../abi/MonadNFTFactory.json';
import { BrowserProvider, Contract, parseUnits } from 'ethers';
import lighthouse from '@lighthouse-web3/sdk';

interface DeployCollectionFormProps {
  connectedAddress: string;
  onDeploy: (data: any) => void;
  isMinting: boolean;
}

const DeployCollectionForm: React.FC<DeployCollectionFormProps> = ({ connectedAddress, onDeploy, isMinting }) => {
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [description, setDescription] = useState('');
  const [owner, setOwner] = useState(connectedAddress);
  const [royaltyAddress, setRoyaltyAddress] = useState(connectedAddress);
  const [royaltyPercent, setRoyaltyPercent] = useState('0');
  const [mainImage, setMainImage] = useState<string | null>(null);
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setOwner(connectedAddress || '');
    setRoyaltyAddress(connectedAddress || '');
  }, [connectedAddress]);

  const validate = () => {
    const errors: {[key: string]: string} = {};
    if (!mainImage) errors.mainImage = 'Collection image is required.';
    if (!name.trim()) errors.name = 'Collection name is required.';
    if (!symbol.trim()) errors.symbol = 'Symbol is required.';
    if (!description.trim()) errors.description = 'Description is required.';
    if (!owner.trim()) errors.owner = 'Destination address is required.';
    if (royaltyPercent && (isNaN(Number(royaltyPercent)) || Number(royaltyPercent) < 0 || Number(royaltyPercent) > 100)) {
      errors.royaltyPercent = 'Royalty % must be a number between 0 and 100.';
    }
    setFieldErrors(errors);
    setError(Object.values(errors)[0] || '');
    return Object.keys(errors).length === 0;
  };

  const handleDeploy = () => {
    alert("Deploy button clicked!");
    if (!validate()) return;
    onDeploy({ name, symbol, description, owner, royaltyAddress, royaltyPercent, mainImage, mainImageFile });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMainImageFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setMainImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white/5 rounded-xl p-8 border border-white/10">
      <div className="mb-6">
        <h2 className="text-3xl font-extrabold text-white text-center">Collection Attributes</h2>
        <div className="mt-2 border-b border-purple-400/40 mx-auto w-3/4"></div>
      </div>
      {error && <div className="mb-4 text-red-400 font-semibold">{error}</div>}
      <div className="space-y-4">
        <div>
          <label className="block text-purple-200 text-sm font-medium mb-2">Collection Image</label>
          <div className="flex flex-row items-center space-x-4 mb-2">
            <div className="w-32 h-32 rounded border-2 border-dashed border-white/20 bg-white/10 flex items-center justify-center overflow-hidden">
              {mainImage ? (
                <img src={mainImage} alt="Main Collection" className="w-full h-full object-cover" />
              ) : (
                <span className="text-purple-300 text-xs">No Image</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg min-w-[120px]"
            >
              {mainImage ? 'Change Image' : 'Upload Image'}
            </button>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleImageChange}
            />
          </div>
          {fieldErrors.mainImage && <div className="text-red-400 text-xs mt-1">{fieldErrors.mainImage}</div>}
        </div>
        <div className="flex space-x-4">
          <div className="flex-1">
            <label className="block text-purple-200 text-sm font-medium mb-2">Collection Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-purple-400 text-lg"
              placeholder="Enter collection name"
              required
            />
            {fieldErrors.name && <div className="text-red-400 text-xs mt-1">{fieldErrors.name}</div>}
          </div>
          <div className="w-40">
            <label className="block text-purple-200 text-sm font-medium mb-2">Symbol</label>
            <input
              type="text"
              value={symbol}
              onChange={e => setSymbol(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-purple-400"
              placeholder="Symbol"
              required
            />
            {fieldErrors.symbol && <div className="text-red-400 text-xs mt-1">{fieldErrors.symbol}</div>}
          </div>
        </div>
        <div>
          <label className="block text-purple-200 text-sm font-medium mb-2">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-purple-400 resize-none"
            placeholder="Describe your NFT collection..."
            required
          />
          {fieldErrors.description && <div className="text-red-400 text-xs mt-1">{fieldErrors.description}</div>}
        </div>
        <div>
          <label className="block text-purple-200 text-sm font-medium mb-2">Destination Address</label>
          <input
            type="text"
            value={owner}
            onChange={e => setOwner(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-purple-400 font-mono"
            required
          />
          {fieldErrors.owner && <div className="text-red-400 text-xs mt-1">{fieldErrors.owner}</div>}
        </div>
        <div>
          <label className="block text-purple-200 text-sm font-medium mb-2">Royalties</label>
          <div className="flex space-x-2 items-center">
            <input
              type="text"
              value={royaltyAddress}
              onChange={e => setRoyaltyAddress(e.target.value)}
              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-purple-400 font-mono"
            />
            <input
              type="number"
              min="0"
              max="100"
              value={royaltyPercent}
              onChange={e => setRoyaltyPercent(e.target.value)}
              className="w-20 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-purple-400 text-center"
            />
          </div>
          {fieldErrors.royaltyPercent && <div className="text-red-400 text-xs mt-1">{fieldErrors.royaltyPercent}</div>}
          <span className="text-purple-200 text-xs mt-1 block">Leave percentage as 0 for no royalties.</span>
        </div>
        <div className="pt-6">
          <button
            onClick={handleDeploy}
            disabled={isMinting}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg text-lg font-bold transition-colors flex items-center justify-center space-x-2"
          >
            {isMinting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Minting NFT...</span>
              </>
            ) : (
              <span>Deploy Collection & Mint NFT</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

interface TraitEditorProps {
  onDeployed?: () => void;
}

const TraitEditor: React.FC<TraitEditorProps> = ({ onDeployed }) => {
  const { wallet } = useWallet();
  const connectedAddress = wallet.address;
  const [deployed, setDeployed] = useState(false);
  const [deployData, setDeployData] = useState<any>(null);
  const [isMinting, setIsMinting] = useState(false);

  const FACTORY_ADDRESS = "0x43976240c057C7b04AA2875EEd545B6C1C491119";
  const LIGHTHOUSE_API_KEY = process.env.REACT_APP_LIGHTHOUSE_API_KEY;

  const handleDeploy = async (data: any) => {
    if (!wallet.signer) {
      alert('Please connect your wallet first.');
      return;
    }
    if (!data.mainImageFile) {
      alert('Please upload a collection image.');
      return;
    }
    if (!LIGHTHOUSE_API_KEY) {
      alert('Lighthouse API key missing.');
      return;
    }

    setIsMinting(true);
    
    try {
      // 1. Upload image to Lighthouse
      const imageUploadRes = await lighthouse.upload([data.mainImageFile], LIGHTHOUSE_API_KEY);
      if (!imageUploadRes || !imageUploadRes.data || !imageUploadRes.data.Hash) {
        throw new Error('Lighthouse image upload failed');
      }
      const imageUrl = `https://gateway.lighthouse.storage/ipfs/${imageUploadRes.data.Hash}`;
      // 2. Create metadata JSON and upload as File
      const metadata = {
        name: data.name,
        description: data.description,
        image: imageUrl
      };
      const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
      const metadataFile = new File([metadataBlob], 'metadata.json');
      // 3. Upload metadata to Lighthouse
      const metadataUploadRes = await lighthouse.upload([metadataFile], LIGHTHOUSE_API_KEY);
      if (!metadataUploadRes || !metadataUploadRes.data || !metadataUploadRes.data.Hash) {
        throw new Error('Lighthouse metadata upload failed');
      }
      const contractURI = `https://gateway.lighthouse.storage/ipfs/${metadataUploadRes.data.Hash}`;
      // Deploy the collection using the factory contract
      const factory = new Contract(
        FACTORY_ADDRESS,
        MonadNFTFactoryABI,
        wallet.signer
      );
      // Ensure royalty address is set, fallback to owner if blank
      const royaltyReceiver = data.royaltyAddress && data.royaltyAddress.length === 42 ? data.royaltyAddress : data.owner;
      const royaltyFeeNumerator = Number(data.royaltyPercent) ? Number(data.royaltyPercent) * 100 : 0;
      const tx = await factory.createCollection(
        data.name,
        data.symbol,
        contractURI,
        royaltyReceiver,
        royaltyFeeNumerator,
        {
          gasLimit: 5000000,
          gasPrice: parseUnits('2', 'gwei')
        }
      );
      const receipt = await tx.wait();
      // Ethers v6: parse logs for CollectionCreated event
      let newCollectionAddress = null;
      for (const log of receipt.logs) {
        try {
          const parsed = factory.interface.parseLog(log);
          if (parsed && parsed.name === 'CollectionCreated') {
            newCollectionAddress = parsed.args[1]; // 0: owner, 1: collection
            break;
          }
        } catch (e) {}
      }
      if (!newCollectionAddress) {
        throw new Error('Collection address not found in transaction receipt.');
      }
      setDeployed(true);
      setDeployData({
        ...data,
        contractAddress: newCollectionAddress,
        contractURI,
        txHash: tx.hash,
      });
      if (onDeployed) onDeployed();
    } catch (err: any) {
      alert('Deployment failed: ' + (err.message || err));
    } finally {
      setIsMinting(false);
    }
  };

  if (deployed) {
    return (
      <div className="max-w-xl mx-auto bg-white/5 rounded-xl p-8 border border-white/10 text-center">
        {deployData?.mainImage && (
          <div className="mb-4">
            <span className="text-white font-mono">Collection Image:</span>
            <div className="flex justify-center mt-2">
              <img src={deployData.mainImage} alt="Collection" className="h-24 w-24 rounded object-cover border border-white/20" />
            </div>
          </div>
        )}
        <h2 className="text-2xl font-bold text-white mb-4">Collection Deployed!</h2>
        <p className="text-purple-200 mb-4">Your collection contract has been deployed.</p>
        <div className="mb-4">
          <span className="text-white font-mono">Contract Address:</span>
          <div className="text-blue-400 font-mono text-lg break-all mt-2">{deployData?.contractAddress || '0x' + Math.random().toString(16).substr(2, 12)}</div>
        </div>
        <div className="mb-4">
          <span className="text-white font-mono">Collection Name:</span>
          <div className="text-purple-200">{deployData?.name}</div>
        </div>
        <div className="mb-4">
          <span className="text-white font-mono">Symbol:</span>
          <div className="text-purple-200">{deployData?.symbol}</div>
        </div>
        <div className="mb-4">
          <span className="text-white font-mono">Owner:</span>
          <div className="text-purple-200">{deployData?.owner}</div>
        </div>
        <div className="mb-4">
          <span className="text-white font-mono">Royalties:</span>
          <div className="text-purple-200">
            {deployData?.royaltyPercent && Number(deployData.royaltyPercent) > 0 ? `${deployData.royaltyPercent}% to ${deployData.royaltyAddress}` : 'None'}
          </div>
        </div>
        
        <div className="mt-6 flex justify-between items-center">
          <button
            className="flex items-center bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition-colors"
            title="Manage Collection"
            onClick={() => window.location.href = `/collection/${deployData?.contractAddress}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 10c-4.41 0-8-1.79-8-4V7c0-2.21 3.59-4 8-4s8 1.79 8 4v7c0 2.21-3.59 4-8 4z" /></svg>
            Manage Collection
          </button>
          {deployData?.txHash && (
            <button
              onClick={() => window.open(`https://testnet.monadexplorer.com/tx/${deployData.txHash}`, '_blank')}
              className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors ml-2"
              title="View on Explorer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm-9 0a9 9 0 0118 0a9 9 0 01-18 0z" /></svg>
              View on Explorer
            </button>
          )}
        </div>
      </div>
    );
  }

  return <DeployCollectionForm connectedAddress={connectedAddress} onDeploy={handleDeploy} isMinting={isMinting} />;
};

export default TraitEditor;
