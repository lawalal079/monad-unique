import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import MonadNFTFactoryABI from '../abi/MonadNFTFactory.json';

// Factory address - you'll need to replace this with your actual deployed factory address
const FACTORY_ADDRESS = process.env.REACT_APP_FACTORY_ADDRESS || '0x0000000000000000000000000000000000000000';

// Simple SVG Icons to replace lucide-react
const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const EditIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
);

const Trash2Icon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3,6 5,6 21,6"></polyline>
    <path d="M19,6v14a2 2 0 0,1 -2,2H7a2 2 0 0,1 -2,-2V6m3 0V4a2 2 0 0,1 2,-2h4a2 2 0 0,1 2,2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const PlayIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="5,3 19,12 5,21 5,3"></polygon>
  </svg>
);

const PauseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="6" y="4" width="4" height="16"></rect>
    <rect x="14" y="4" width="4" height="16"></rect>
  </svg>
);

const DownloadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7,10 12,15 17,10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
);

const Share2Icon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="18" cy="5" r="3"></circle>
    <circle cx="6" cy="12" r="3"></circle>
    <circle cx="18" cy="19" r="3"></circle>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
  </svg>
);

const SettingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>
);

const CopyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);

interface CollectionManagerProps {
  onCollectionSelect: (collection: any) => void;
  refreshKey?: number;
}

const CollectionManager: React.FC<{ refreshKey?: number }> = ({ refreshKey }) => {
  const { wallet } = useWallet();
  const { signer, provider, address } = wallet || {};
  const navigate = useNavigate();
  const [collections, setCollections] = useState<string[]>([]);
  const [collectionNames, setCollectionNames] = useState<{ [addr: string]: string }>({});
  const [collectionImages, setCollectionImages] = useState<{ [addr: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newCollection, setNewCollection] = useState({ name: '', symbol: '' });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [allCollectionsCount, setAllCollectionsCount] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', symbol: '', description: '', external_link: '', image: null as File | null });
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [firstFetchDone, setFirstFetchDone] = useState(false);

  const placeholderImg = 'https://via.placeholder.com/80x80.png?text=NFT';

  // Fetch collections created by the user
  useEffect(() => {
    if (!provider || !address || !FACTORY_ADDRESS || FACTORY_ADDRESS === '0x0000000000000000000000000000000000000000') {
      return;
    }
    let polling = true;
    let pollCount = 0;
    let firstFetch = true;
    const fetchCollections = async () => {
      setErrorMsg(null);
      try {
        const factory = new ethers.Contract(FACTORY_ADDRESS, MonadNFTFactoryABI, provider);
        let allCollections: string[] = [];
        try {
          allCollections = await factory.getAllCollections();
          setAllCollectionsCount(allCollections.length);
        } catch (allErr) {
          setAllCollectionsCount(null);
        }
        const ownedCollections: string[] = [];
        const names: Record<string, string> = {};
        const images: Record<string, string> = {};
        for (const collectionAddr of allCollections) {
          try {
            const collection = new ethers.Contract(collectionAddr, [
              'function owner() view returns (address)',
              'function name() view returns (string)',
              'function contractURI() view returns (string)'
            ], provider);
            const owner = await collection.owner();
            if (owner.toLowerCase() === address.toLowerCase()) {
              ownedCollections.push(collectionAddr);
              try {
                names[collectionAddr] = await collection.name();
                try {
                  const contractURI = await collection.contractURI();
                  if (contractURI) {
                    const res = await fetch(contractURI);
                    if (res.ok) {
                      const metadata = await res.json();
                      if (metadata.image) {
                        images[collectionAddr] = metadata.image;
                      }
                    }
                  }
                } catch (imgErr) {
                  images[collectionAddr] = '';
                }
              } catch (nameErr) {
                names[collectionAddr] = '';
                images[collectionAddr] = '';
              }
            }
          } catch (err) {}
        }
        setCollections(ownedCollections);
        setCollectionNames(names);
        setCollectionImages(images);
      } catch (err) {
        setCollections([]);
        setErrorMsg('Failed to fetch collections');
      }
      if (firstFetch) {
        firstFetch = false;
        setFirstFetchDone(true);
      }
    };
    // Aggressive polling for 5 seconds after refreshKey changes
    const poll = async () => {
      while (polling && pollCount < 5) {
        await fetchCollections();
        pollCount++;
        await new Promise(res => setTimeout(res, 1000));
      }
    };
    poll();
    return () => { polling = false; };
  }, [provider, address, refreshKey]);

  // Always show the collection grid, no loading spinner
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Collection Manager</h2>
          <p className="text-purple-200">
            Organize and manage your NFT collections
          </p>
        </div>
      </div>

      {/* Wallet Connection Check */}
      {!address && (
        <div className="bg-yellow-500/20 rounded-lg p-6 border border-yellow-500/50 text-center">
          <p className="text-yellow-200 mb-4">Please connect your wallet to view your collections</p>
          <p className="text-yellow-100 text-sm">Collections will appear here once you connect your wallet</p>
        </div>
      )}

      {address && (!FACTORY_ADDRESS || FACTORY_ADDRESS === '0x0000000000000000000000000000000000000000') && (
        <div className="bg-red-500/20 rounded-lg p-6 border border-red-500/50 text-center">
          <p className="text-red-200 mb-4">Factory address not configured</p>
          <p className="text-red-100 text-sm">Please set the REACT_APP_FACTORY_ADDRESS environment variable</p>
        </div>
      )}

      {/* Collections Grid */}
      {address && FACTORY_ADDRESS && FACTORY_ADDRESS !== '0x0000000000000000000000000000000000000000' && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allCollectionsCount !== null && (
          <div className="text-xs text-purple-400 mb-2 col-span-full">Total collections on chain (all owners): {allCollectionsCount}</div>
        )}
        <AnimatePresence>
          {errorMsg ? (
            <div className="text-red-400">Error: {errorMsg}</div>
          ) : firstFetchDone && collections.length === 0 ? (
            <div className="text-purple-200">No collections found. Create one!</div>
          ) : (
            collections.map((collectionAddr) => (
              <motion.div
                key={collectionAddr}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-purple-400/50 transition-all duration-300 flex flex-col gap-2"
              >
                <img src={collectionImages[collectionAddr] || placeholderImg} alt="Collection" className="w-20 h-20 rounded mb-2 self-center" />
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="text-white font-bold text-lg mb-1">
                      {collectionNames[collectionAddr] || 'NFT Collection'}
                  </div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-mono text-xs break-all">{collectionAddr}</span>
                      <button
                        title="Copy address"
                        className="ml-1 p-1 rounded hover:bg-purple-700/30"
                        onClick={() => {
                          navigator.clipboard.writeText(collectionAddr);
                        }}
                      >
                        <CopyIcon />
                      </button>
                </div>
                    <p className="text-purple-200 text-sm line-clamp-2">Your NFT Collection</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => navigate(`/collection/${collectionAddr}`)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm transition-colors flex items-center space-x-1"
                  >
                    <EyeIcon />
                    <span>Manage</span>
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
      )}
    </div>
  );
};

export default CollectionManager; 