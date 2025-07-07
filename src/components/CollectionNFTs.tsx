import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import MonadNFTCollectionArtifact from '../abi/MonadNFTCollection.json';
import lighthouse from '@lighthouse-web3/sdk';

interface NFTData {
  tokenId: number;
  image: string;
  name: string;
  traits: any;
  rarity: number;
}

const BATCH_SIZE = 2;
const LIGHTHOUSE_API_KEY = process.env.REACT_APP_LIGHTHOUSE_API_KEY;

const CollectionNFTs: React.FC = () => {
  const { address } = useParams<{ address: string }>();
  const navigate = useNavigate();
  const [nfts, setNFTs] = useState<NFTData[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextTokenId, setNextTokenId] = useState<number | null>(null);
  const [loadedCount, setLoadedCount] = useState(0);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const [modalNFT, setModalNFT] = useState<NFTData | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<{ name: string; description: string; image: string; imageFile: File | null; royaltyAddress: string; royaltyPercent: string; destination: string; traits: string }>({ name: '', description: '', image: '', imageFile: null, royaltyAddress: '', royaltyPercent: '', destination: '', traits: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<{ txHash: string, nft: NFTData } | null>(null);
  const [activeAction, setActiveAction] = useState<'edit' | 'burn' | 'transfer' | null>(null);
  const [transferAddress, setTransferAddress] = useState('');
  const [transferError, setTransferError] = useState<string | null>(null);
  const [burnLoading, setBurnLoading] = useState(false);
  const [burnError, setBurnError] = useState<string | null>(null);
  const [burnSuccess, setBurnSuccess] = useState<{ txHash: string } | null>(null);
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState<{ txHash: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('mostRecent');
  const [editAttributes, setEditAttributes] = useState<{ trait_type: string; value: string }[]>([]);

  // Fetch nextTokenId only once
  useEffect(() => {
    const fetchNextTokenId = async () => {
      if (!address) return;
      try {
        const provider = (window as any).ethereum
          ? new ethers.providers.Web3Provider((window as any).ethereum)
          : ethers.getDefaultProvider();
        const contract = new ethers.Contract(address, MonadNFTCollectionArtifact.abi, provider);
        const nextId: number = await contract.nextTokenId();
        setNextTokenId(Number(nextId));
      } catch (err) {
        setNextTokenId(0);
      }
    };
    fetchNextTokenId();
  }, [address]);

  // Load NFTs in batches
  const loadNFTBatch = useCallback(async () => {
    if (!address || loading || nextTokenId === null) return;
    setLoading(true);
    try {
      const provider = (window as any).ethereum
        ? new ethers.providers.Web3Provider((window as any).ethereum)
        : ethers.getDefaultProvider();
      const contract = new ethers.Contract(address, MonadNFTCollectionArtifact.abi, provider);
      const start = loadedCount;
      const end = Math.min(start + BATCH_SIZE, nextTokenId);
      const nftPromises = [];
      for (let tokenId = start; tokenId < end; tokenId++) {
        nftPromises.push((async () => {
          try {
            const tokenURI = await contract.tokenURI(tokenId);
            const traitsString = await contract.traits(tokenId);
            const rarity = await contract.rarity(tokenId);
            let image = '', name = '';
            try {
              const res = await fetch(tokenURI);
              if (res.ok) {
                const metadata = await res.json();
                image = metadata.image || '';
                name = metadata.name || '';
              }
            } catch (err) {
            }
            let traits = null;
            try {
              traits = JSON.parse(traitsString);
            } catch { traits = traitsString; }
            return { tokenId, image, name, traits, rarity: Number(rarity) };
          } catch (err) {
            return null;
          }
        })());
      }
      const results = await Promise.all(nftPromises);
      const validNFTs = results.filter(Boolean) as NFTData[];
      setNFTs(prev => {
        const existingIds = new Set(prev.map(nft => nft.tokenId));
        const newUnique = validNFTs.filter(nft => !existingIds.has(nft.tokenId));
        return [...prev, ...newUnique];
      });
      setLoadedCount(end);
      setHasMore(end < nextTokenId);
    } finally {
      setLoading(false);
    }
  }, [address, loading, nextTokenId, loadedCount]);

  // Initial batch
  useEffect(() => {
    if (nextTokenId !== null && nfts.length === 0) {
      setLoadedCount(0);
      setNFTs([]);
      setHasMore(true);
      loadNFTBatch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextTokenId, address]);

  // Infinite scroll observer
  useEffect(() => {
    if (!hasMore || loading) return;
    const observer = new window.IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          loadNFTBatch();
        }
      },
      { threshold: 1 }
    );
    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }
    return () => {
      if (loaderRef.current) observer.unobserve(loaderRef.current);
    };
  }, [hasMore, loading, loadNFTBatch]);

  // Open edit modal with pre-filled data
  const openEditModal = async (nft: NFTData) => {
    let name = nft.name || '';
    let description = '';
    let image = nft.image || '';
    let royaltyAddress = '';
    let royaltyPercent = '';
    let destination = '';
    let attributes: { trait_type: string; value: string }[] = [];
    try {
      if (nft.tokenId !== undefined && address) {
        const provider = (window as any).ethereum
          ? new ethers.providers.Web3Provider((window as any).ethereum)
          : ethers.getDefaultProvider();
        const contract = new ethers.Contract(address, MonadNFTCollectionArtifact.abi, provider);
        const tokenURI = await contract.tokenURI(nft.tokenId);
        try {
        const res = await fetch(tokenURI);
        if (res.ok) {
          const metadata = await res.json();
            name = metadata.name || name;
          description = metadata.description || '';
            image = metadata.image || image;
            if (Array.isArray(metadata.attributes)) {
              attributes = metadata.attributes.map((attr: any) => ({
                trait_type: attr.trait_type || attr.type || '',
                value: attr.value || ''
              }));
            }
          }
        } catch (fetchErr) {
        }
      }
    } catch {}
    // Get connected wallet address
    if ((window as any).ethereum) {
      const provider = new ethers.providers.Web3Provider((window as any).ethereum);
      const signer = provider.getSigner();
      destination = await signer.getAddress();
      royaltyAddress = destination;
    }
    setEditForm({
      name,
      description,
      image,
      imageFile: null,
      royaltyAddress,
      royaltyPercent,
      destination,
      traits: '' // will be set from editAttributes
    });
    setEditAttributes(attributes.length ? attributes : [{ trait_type: '', value: '' }]);
    setShowEditModal(true);
    setActiveAction('edit');
  };

  // Handle edit form changes
  const handleEditChange = (field: string, value: any) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  // Handle image file change
  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEditForm(prev => ({ ...prev, imageFile: file }));
      const reader = new FileReader();
      reader.onload = (ev) => setEditForm(prev => ({ ...prev, image: ev.target?.result as string }));
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

  // Handle edit form submit
  const handleEditSubmit = async (e: React.FormEvent, nft: NFTData) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError(null);
    try {
      if (!address) throw new Error('No collection address');
      if (!editForm.name || !editForm.description) throw new Error('Name and description are required');
      if (!editForm.destination) throw new Error('Destination address is required');
      // 1. Upload new image to IPFS if changed
      let imageUrl = nft.image;
      if (editForm.imageFile) {
        imageUrl = await uploadToIPFS(editForm.imageFile);
      }
      // 2. Build new metadata (traits removed)
      const metadata = {
        name: editForm.name,
        description: editForm.description,
        image: imageUrl
        // Add royalty fields if needed
      };
      // 3. Upload new metadata to IPFS
      const metadataUrl = await uploadMetadataToIPFS(metadata);
      // 4. Request wallet connection
      if (!(window as any).ethereum) throw new Error('Wallet not found');
      await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.providers.Web3Provider((window as any).ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(address, MonadNFTCollectionArtifact.abi, signer);
      // 5. Call setTokenURI on-chain
      const tx1 = await contract.setTokenURI(nft.tokenId, metadataUrl, { gasLimit: 500000 });
      await tx1.wait();
      // 6. Call setTraitsAndRarity on-chain
      const traitsJson = JSON.stringify(editAttributes.filter(attr => attr.trait_type && attr.value));
      const tx2 = await contract.setTraitsAndRarity(nft.tokenId, traitsJson, nft.rarity, { gasLimit: 500000 });
      await tx2.wait();
      setEditSuccess({ txHash: tx2.hash, nft: { ...nft, name: editForm.name, image: imageUrl, traits: traitsJson } });
      setShowEditModal(false);
    } catch (err: any) {
      setEditError(err.message || 'Update failed');
    } finally {
      setEditLoading(false);
    }
  };

  const handleBurnNFT = async (tokenId: number) => {
    setBurnLoading(true);
    setBurnError(null);
    try {
      if (!address) throw new Error('No collection address');
      if (!(window as any).ethereum) throw new Error('Wallet not found');
      await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.providers.Web3Provider((window as any).ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(address, MonadNFTCollectionArtifact.abi, signer);
      const tx = await contract.burn(tokenId, { gasLimit: 300000 });
      await tx.wait();
      setBurnSuccess({ txHash: tx.hash });
      setModalNFT(null);
      setActiveAction(null);
      // Optionally refresh NFT list here
    } catch (err: any) {
      setBurnError(err.message || 'Burn failed');
    } finally {
      setBurnLoading(false);
    }
  };

  const handleTransferNFT = async (e: React.FormEvent, tokenId: number) => {
    e.preventDefault();
    setTransferError(null);
    setTransferLoading(true);
    try {
      if (!address) throw new Error('No collection address');
      if (!transferAddress) throw new Error('Recipient address is required');
      if (!(window as any).ethereum) throw new Error('Wallet not found');
      await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.providers.Web3Provider((window as any).ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(address, MonadNFTCollectionArtifact.abi, signer);
      const from = await signer.getAddress();
      const tx = await contract['safeTransferFrom(address,address,uint256)'](from, transferAddress, tokenId, { gasLimit: 300000 });
      await tx.wait();
      setTransferSuccess({ txHash: tx.hash });
      setModalNFT(null);
      setActiveAction(null);
      // Optionally refresh NFT list here
    } catch (err: any) {
      setTransferError(err.message || 'Transfer failed');
    } finally {
      setTransferLoading(false);
    }
  };

  // Sort and filter NFTs
  const sortedNFTs = [...nfts].sort((a, b) => {
    switch (sortOption) {
      case 'mostRecent':
        return b.tokenId - a.tokenId;
      case 'oldest':
        return a.tokenId - b.tokenId;
      case 'nameAZ':
        return (a.name || '').localeCompare(b.name || '');
      case 'nameZA':
        return (b.name || '').localeCompare(a.name || '');
      case 'idAsc':
        return a.tokenId - b.tokenId;
      case 'idDesc':
        return b.tokenId - a.tokenId;
      default:
        return 0;
    }
  });
  const filteredNFTs = sortedNFTs.filter(nft =>
    nft.name && nft.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Add handlers for attribute changes
  const handleAttributeChange = (idx: number, field: 'trait_type' | 'value', value: string) => {
    setEditAttributes(prev => prev.map((attr, i) => i === idx ? { ...attr, [field]: value } : attr));
  };
  const handleAddAttribute = () => {
    setEditAttributes(prev => [...prev, { trait_type: '', value: '' }]);
  };
  const handleRemoveAttribute = (idx: number) => {
    setEditAttributes(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1333] to-[#2d225a] text-white p-8 flex flex-col items-center">
      <button
        className="absolute top-6 left-6 flex items-center bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg transition-colors z-10"
        onClick={() => navigate(-1)}
        title="Back"
      >
        &#8592; Back
      </button>
      <h1 className="text-3xl font-bold mb-8">Collection NFTs</h1>
      {/* Search Bar with Filter */}
      <div className="flex flex-col items-center w-full mb-8">
        <div className="flex items-center gap-4">
          <select
            value={sortOption}
            onChange={e => setSortOption(e.target.value)}
            className="p-3 rounded-lg bg-transparent text-white text-lg focus:outline-none focus:ring-2 focus:ring-purple-400 border border-white/20"
            style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
          >
            <option value="mostRecent" className="bg-[#221944] text-white">Most Recent</option>
            <option value="oldest" className="bg-[#221944] text-white">Oldest</option>
            <option value="nameAZ" className="bg-[#221944] text-white">Name (A-Z)</option>
            <option value="nameZA" className="bg-[#221944] text-white">Name (Z-A)</option>
            <option value="idAsc" className="bg-[#221944] text-white">Token ID Ascending</option>
            <option value="idDesc" className="bg-[#221944] text-white">Token ID Descending</option>
          </select>
          <div className="relative w-[480px] max-w-full">
            <input
              type="text"
              placeholder="Search NFT by name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="p-3 pl-12 rounded-lg bg-white/10 text-white text-lg w-full focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <button type="button" className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" tabIndex={-1}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle cx="11" cy="11" r="8" strokeWidth="2" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="2" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      {/* NFT Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-8 gap-8 w-full max-w-7xl">
        {filteredNFTs.map(nft => (
          <div
            key={nft.tokenId}
            className="bg-white/10 rounded-lg p-4 flex flex-col items-center cursor-pointer hover:bg-white/20 transition-colors"
            onClick={() => setModalNFT(nft)}
          >
            <img src={nft.image} alt={nft.name} className="w-40 h-40 object-cover rounded mb-4 border border-white/20 bg-white/10" />
            <div className="text-xl font-bold mb-2 text-center">{nft.name || `#${nft.tokenId}`}</div>
          </div>
        ))}
      </div>
      {loading && <div className="text-purple-300 mt-8">Loading NFTs...</div>}
      {!loading && nfts.length === 0 && <div className="text-purple-300 mt-8">No NFTs minted yet.</div>}
      <div ref={loaderRef} style={{ height: 1 }} />

      {/* Modal for NFT details */}
      {modalNFT && !activeAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div className="bg-[#2d225a] rounded-2xl p-8 max-w-2xl w-full shadow-2xl relative text-white flex flex-row items-center border border-white/20">
            <button
              className="absolute top-4 right-4 text-white text-2xl font-bold hover:text-purple-300"
              onClick={() => setModalNFT(null)}
              aria-label="Close"
            >
              &times;
            </button>
            <div className="flex flex-col items-center w-1/2">
              <div className="text-3xl font-bold mb-4 text-center">{modalNFT.name || `#${modalNFT.tokenId}`}</div>
              <img src={modalNFT.image} alt={modalNFT.name} className="w-48 h-48 object-cover rounded mb-4 border border-white/20 bg-white/10" />
              <div className="text-purple-200 text-sm mb-2 text-center">Token ID: {modalNFT.tokenId}</div>
              <div className="w-full flex flex-col items-center mt-2">
                <span className="font-semibold text-center">Attributes:</span>
                {Array.isArray(modalNFT.traits) ? (
                  <ul className="list-disc text-center">
                    {modalNFT.traits.map((attr: any, idx: number) => {
                      // Defensive check to ensure attr is a valid object
                      if (!attr || typeof attr !== 'object') {
                        return null;
                      }
                      
                      const traitType = typeof attr.trait_type === 'string' ? attr.trait_type : 
                                       typeof attr.type === 'string' ? attr.type : 'Unknown';
                      const value = typeof attr.value === 'string' ? attr.value : 'Unknown';
                      
                      return (
                        <li key={idx} className="text-center">{traitType}: {value}</li>
                      );
                    })}
                  </ul>
                ) : (
                  <span className="text-center">
                    {typeof modalNFT.traits === 'string' ? modalNFT.traits : 
                     modalNFT.traits ? JSON.stringify(modalNFT.traits) : 'No attributes'}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-center w-1/2 justify-center gap-4">
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-40" onClick={() => openEditModal(modalNFT)}>Edit Metadata</button>
              <button className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded w-40" onClick={() => setActiveAction('burn')}>Burn NFT</button>
              <button className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded w-40" onClick={() => setActiveAction('transfer')}>Transfer NFT</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Metadata Modal */}
      {modalNFT && activeAction === 'edit' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div className="bg-[#2d225a] rounded-2xl p-8 max-w-lg w-full shadow-2xl relative text-white flex flex-col items-center border border-white/20">
            <button
              className="absolute top-4 right-4 text-white text-2xl font-bold hover:text-purple-300"
              onClick={() => setActiveAction(null)}
              aria-label="Close"
            >
              &times;
            </button>
            <form onSubmit={e => handleEditSubmit(e, modalNFT!)} className="w-full flex flex-col items-center gap-4">
              <div className="flex flex-row items-center w-full mb-2 gap-4">
                <div className="w-32 h-32 bg-white/10 rounded-xl flex items-center justify-center relative border-2 border-dashed border-purple-400">
                  {editForm.image ? (
                    <img src={editForm.image} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <span className="text-purple-300">No Image</span>
                  )}
                  <input
                    id="edit-image-input"
                    type="file"
                    accept="image/*"
                    onChange={handleEditImageChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    title="Upload Image"
                  />
                </div>
                <button
                  type="button"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded"
                  onClick={() => document.getElementById('edit-image-input')?.click()}
                >
                  Change Image
                </button>
              </div>
              <div className="w-full">
                <label className="font-semibold">Name</label>
                <input type="text" className="p-2 rounded bg-white/10 text-white w-full" value={editForm.name} onChange={e => handleEditChange('name', e.target.value)} required />
              </div>
              <div className="w-full">
                <label className="font-semibold">Description</label>
                <textarea className="p-2 rounded bg-white/10 text-white w-full" value={editForm.description} onChange={e => handleEditChange('description', e.target.value)} required />
              </div>
              <div className="w-full">
                <label className="font-semibold">Destination Address</label>
                <input type="text" className="p-2 rounded bg-white/10 text-white w-full" value={editForm.destination} onChange={e => handleEditChange('destination', e.target.value)} required />
              </div>
              <div className="w-full">
                <label className="font-semibold">Royalties</label>
                <div className="flex gap-2">
                  <input type="text" className="p-2 rounded bg-white/10 text-white flex-1" value={editForm.royaltyAddress} onChange={e => handleEditChange('royaltyAddress', e.target.value)} />
                  <input type="number" className="p-2 rounded bg-white/10 text-white w-20" value={editForm.royaltyPercent} onChange={e => handleEditChange('royaltyPercent', e.target.value)} min="0" max="100" />
                  <span className="self-center">%</span>
                </div>
              </div>
              <div className="w-full">
                <label className="font-semibold">Attributes</label>
                {editAttributes.map((attr, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      className="p-2 rounded bg-white/10 text-white flex-1"
                      placeholder="Type (e.g. Background)"
                      value={attr.trait_type}
                      onChange={e => handleAttributeChange(idx, 'trait_type', e.target.value)}
                    />
                    <input
                      type="text"
                      className="p-2 rounded bg-white/10 text-white flex-1"
                      placeholder="Value (e.g. Blue)"
                      value={attr.value}
                      onChange={e => handleAttributeChange(idx, 'value', e.target.value)}
                    />
                    <button type="button" className="text-red-400 px-2" onClick={() => handleRemoveAttribute(idx)} title="Remove">×</button>
                    {idx === editAttributes.length - 1 && (
                      <button type="button" className="bg-purple-600 hover:bg-purple-700 text-white px-2 rounded" onClick={handleAddAttribute} title="Add">+</button>
                    )}
                  </div>
                ))}
              </div>
              <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded mt-4 w-full" disabled={editLoading}>
                {editLoading ? 'Updating...' : 'Commit Changes'}
              </button>
              {editError && <div className="text-red-400 font-semibold mt-2">{editError}</div>}
            </form>
          </div>
        </div>
      )}

      {/* Burn NFT Modal */}
      {modalNFT && activeAction === 'burn' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div className="bg-[#2d225a] rounded-xl p-8 max-w-md w-full shadow-2xl relative text-white flex flex-col items-center">
            <button
              className="absolute top-4 right-4 text-white text-2xl font-bold hover:text-purple-300"
              onClick={() => setActiveAction(null)}
              aria-label="Close"
            >
              &times;
            </button>
            <img src={modalNFT.image} alt={modalNFT.name} className="w-32 h-32 object-cover rounded mx-auto mb-4 border border-white/20 bg-white/10" />
            <div className="text-xl font-bold mb-4 text-center">Burn NFT</div>
            <div className="text-center mb-4">Are you sure you want to <span className="text-red-400 font-bold">permanently burn</span> this NFT? This action cannot be undone.</div>
            <button className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded" onClick={() => handleBurnNFT(modalNFT.tokenId)} disabled={burnLoading}>
              {burnLoading ? 'Burning...' : 'Confirm Burn'}
            </button>
            {burnError && <div className="text-red-400 font-semibold mt-2">{burnError}</div>}
          </div>
        </div>
      )}

      {/* Transfer NFT Modal */}
      {modalNFT && activeAction === 'transfer' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div className="bg-[#2d225a] rounded-xl p-8 max-w-md w-full shadow-2xl relative text-white flex flex-col items-center">
            <button
              className="absolute top-4 right-4 text-white text-2xl font-bold hover:text-purple-300"
              onClick={() => setActiveAction(null)}
              aria-label="Close"
            >
              &times;
            </button>
            <img src={modalNFT.image} alt={modalNFT.name} className="w-32 h-32 object-cover rounded mx-auto mb-4 border border-white/20 bg-white/10" />
            <div className="text-xl font-bold mb-4 text-center">Transfer NFT</div>
            <form onSubmit={e => handleTransferNFT(e, modalNFT.tokenId)} className="w-full flex flex-col gap-4">
              <label className="font-semibold">Recipient Address</label>
              <input type="text" className="p-2 rounded bg-white/10 text-white w-full" value={transferAddress} onChange={e => setTransferAddress(e.target.value)} required />
              <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mt-2" disabled={transferLoading}>
                {transferLoading ? 'Transferring...' : 'Transfer'}
              </button>
              {transferError && <div className="text-red-400 font-semibold mt-2">{transferError}</div>}
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {editSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div className="bg-[#2d225a] rounded-xl p-8 max-w-md w-full shadow-2xl relative text-white flex flex-col items-center">
            <button
              className="absolute top-4 right-4 text-white text-2xl font-bold hover:text-purple-300"
              onClick={() => setEditSuccess(null)}
              aria-label="Close"
            >
              &times;
            </button>
            <img src={editSuccess.nft.image} alt={editSuccess.nft.name} className="w-48 h-48 object-cover rounded mx-auto mb-4 border border-white/20 bg-white/10" />
            <div className="text-2xl font-bold mb-2 text-center">{editSuccess.nft.name}</div>
            <div className="text-purple-200 text-sm mb-2 text-center">Token ID: {editSuccess.nft.tokenId}</div>
            <div className="text-green-300 text-sm mb-2 text-center">Metadata updated successfully!</div>
            <a
              href={`https://testnet.monadexplorer.com/tx/${editSuccess.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
            >
              View on Explorer
            </a>
          </div>
        </div>
      )}

      {burnSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div className="bg-[#2d225a] rounded-xl p-8 max-w-md w-full shadow-2xl relative text-white flex flex-col items-center">
            <button
              className="absolute top-4 right-4 text-white text-2xl font-bold hover:text-purple-300"
              onClick={() => setBurnSuccess(null)}
              aria-label="Close"
            >
              &times;
            </button>
            <div className="text-xl font-bold mb-4 text-center">NFT Burned Successfully!</div>
            <div className="text-green-300 text-sm mb-2 text-center">Transaction Hash:</div>
            <a
              href={`https://testnet.monadexplorer.com/tx/${burnSuccess.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
            >
              View on Explorer
            </a>
          </div>
        </div>
      )}

      {transferSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div className="bg-[#2d225a] rounded-xl p-8 max-w-md w-full shadow-2xl relative text-white flex flex-col items-center">
            <button
              className="absolute top-4 right-4 text-white text-2xl font-bold hover:text-purple-300"
              onClick={() => setTransferSuccess(null)}
              aria-label="Close"
            >
              &times;
            </button>
            <div className="text-xl font-bold mb-4 text-center">NFT Transferred Successfully!</div>
            <div className="text-green-300 text-sm mb-2 text-center">Transaction Hash:</div>
            <a
              href={`https://testnet.monadexplorer.com/tx/${transferSuccess.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
            >
              View on Explorer
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionNFTs; 