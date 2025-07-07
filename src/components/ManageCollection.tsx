import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BrowserProvider, Contract, getDefaultProvider } from 'ethers';
import MonadNFTFactoryArtifact from '../abi/MonadNFTFactory.json';

// Simple SVG Icons to replace lucide-react
const CopyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);

const ArrowLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12,19 5,12 12,5"></polyline>
  </svg>
);

const placeholderImg = 'https://via.placeholder.com/120x120.png?text=NFT';

const ManageCollection: React.FC = () => {
  const { address } = useParams<{ address: string }>();
  const navigate = useNavigate();
  const [collectionName, setCollectionName] = useState('');
  const [collectionImage, setCollectionImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchCollectionData = async () => {
      if (!address) return;
      try {
        // Use the browser's Ethereum provider if available
        const provider = (window as any).ethereum
          ? new BrowserProvider((window as any).ethereum)
          : getDefaultProvider();
        const collection = new Contract(address, [
          'function name() view returns (string)',
          'function contractURI() view returns (string)'
        ], provider);
        const name = await collection.name();
        setCollectionName(name);
        const contractURI = await collection.contractURI();
        if (contractURI) {
          const res = await fetch(contractURI);
          if (res.ok) {
            const metadata = await res.json();
            if (metadata.image) {
              setCollectionImage(metadata.image);
            }
          }
        }
      } catch (err) {
        setCollectionName('');
        setCollectionImage(null);
      }
    };
    fetchCollectionData();
  }, [address]);

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1333] to-[#2d225a] text-white p-8 flex flex-col items-center">
      <button
        className="absolute top-6 left-6 flex items-center bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg transition-colors z-10"
        onClick={() => navigate(-1)}
        title="Back"
      >
        <ArrowLeftIcon />
        Back
      </button>
      <h1 className="text-3xl font-bold text-purple-400 mb-8">Manage Collection</h1>
      <div className="flex items-center gap-8 mb-8">
        <img
          src={collectionImage || placeholderImg}
          alt="Collection"
          className="w-32 h-32 rounded-lg object-cover border border-white/20 bg-white/10"
        />
        <div>
          <div className="text-4xl md:text-5xl font-extrabold mb-2 break-words max-w-2xl leading-tight" style={{lineHeight: 1.1}}>
            {collectionName || 'NFT Collection'}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-blue-300 font-mono text-sm break-all">{address}</span>
            <button
              onClick={handleCopy}
              className="ml-1 p-1 rounded hover:bg-purple-700/30"
              title="Copy address"
            >
              <CopyIcon />
            </button>
            {copied && <span className="text-green-400 text-xs ml-2">Copied!</span>}
          </div>
        </div>
      </div>
      <div className="max-w-2xl w-full mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div
            className="bg-white/10 border border-white/20 rounded-lg p-6 cursor-pointer focus:outline-none transition-colors w-full text-center"
            onClick={() => navigate(`/collection/${address}/mint`)}
            tabIndex={0}
          >
            Mint Hub
          </div>
          <div
            className="bg-white/10 border border-white/20 rounded-lg p-6 cursor-pointer focus:outline-none transition-colors w-full text-center"
            onClick={() => navigate(`/collection/${address}/edit`)}
            tabIndex={0}
          >
            Modify Metadata
          </div>
          <div
            className="bg-white/10 border border-white/20 rounded-lg p-6 cursor-pointer focus:outline-none transition-colors w-full text-center"
            onClick={() => navigate(`/collection/${address}/nfts`)}
            tabIndex={0}
          >
            NFT Vault
          </div>
          <div className="bg-white/10 border border-white/20 rounded-lg p-6 cursor-pointer focus:outline-none transition-colors w-full text-center" onClick={() => navigate(`/collection/${address}/permissions`)} tabIndex={0}>
            Admin Tools
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageCollection; 