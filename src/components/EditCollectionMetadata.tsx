import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BrowserProvider, Contract, getDefaultProvider } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import lighthouse from '@lighthouse-web3/sdk';
import { motion } from 'framer-motion';

// Simple SVG Icons to replace lucide-react
const ArrowLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12,19 5,12 12,5"></polyline>
  </svg>
);

const placeholderImg = 'https://via.placeholder.com/120x120.png?text=NFT';

const EditCollectionMetadata: React.FC = () => {
  const { address } = useParams<{ address: string }>();
  const navigate = useNavigate();
  const { wallet } = useWallet();
  const [form, setForm] = useState({
    name: '',
    description: '',
    image: '',
    destinationAddress: '',
    royaltyAddress: '',
    royaltyPercent: '',
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isCommitting, setIsCommitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm({ name: '', description: '', image: '', destinationAddress: '', royaltyAddress: '', royaltyPercent: '' });
    setImagePreview(null);
    console.log('EditCollectionMetadata: address param:', address);
    const fetchMetadata = async () => {
      if (!address) return;
      try {
        const provider = (window as any).ethereum
          ? new BrowserProvider((window as any).ethereum)
          : getDefaultProvider();
        const collection = new Contract(address as string, [
          'function name() view returns (string)',
          'function contractURI() view returns (string)',
        ], provider);
        const name = await collection.name();
        let description = '';
        let image = '';
        let royaltyAddress = '';
        let royaltyPercent = '';
        const contractURI = await collection.contractURI();
        console.log('EditCollectionMetadata: contractURI:', contractURI);
        if (contractURI) {
          try {
            const res = await fetch(contractURI);
            console.log('EditCollectionMetadata: fetch contractURI response:', res);
            if (res.ok) {
              const metadata = await res.json();
              console.log('EditCollectionMetadata: fetched metadata:', metadata);
              description = metadata.description || '';
              image = metadata.image || '';
              royaltyAddress = metadata.royaltyAddress || '';
              royaltyPercent = metadata.royaltyPercent || '';
            }
          } catch (fetchErr) {
            console.warn('Error fetching or parsing metadata from contractURI:', contractURI, fetchErr);
          }
        }
        let destinationAddress = '';
        try {
          if (typeof collection.owner === 'function') {
            destinationAddress = await collection.owner();
          } else {
            console.warn('collection.owner() is not a function on this contract. Skipping owner fetch.');
          }
        } catch (ownerErr) {
          console.warn('Error calling collection.owner():', ownerErr);
        }
        setForm({ name, description, image, destinationAddress, royaltyAddress, royaltyPercent });
        setImagePreview(image);
      } catch (err: any) {
        console.warn('Error loading collection metadata:', err);
        setForm({ name: '', description: '', image: '', destinationAddress: '', royaltyAddress: '', royaltyPercent: '' });
        setImagePreview(null);
      }
      setLoading(false);
    };
    fetchMetadata();
  }, [address]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet.signer) {
      alert('Please connect your wallet first.');
      return;
    }
    if (!address) {
      alert('Collection address is missing.');
      setIsCommitting(false);
      return;
    }
    setIsCommitting(true);
    try {
      // 1. Ownership transfer if needed
      const connectedAddress = wallet.address?.toLowerCase();
      const newOwner = form.destinationAddress.trim().toLowerCase();
      if (address && newOwner && connectedAddress && newOwner !== connectedAddress) {
        const confirmed = window.confirm(
          'You are about to transfer ownership of this collection to another wallet. If you proceed, you will lose control and this collection will be removed from your collection list.'
        );
        if (!confirmed) {
          setIsCommitting(false);
          return;
        }
        // Call transferOwnership
        const collection = new Contract(address as string, [
          'function transferOwnership(address newOwner) public',
        ], wallet.signer);
        const tx = await collection.transferOwnership(newOwner);
        await tx.wait();
        alert('Ownership transferred! You will now be redirected.');
        navigate('/');
        return;
      }

      // 2. Upload new metadata to IPFS if changed
      let imageUrl = form.image;
      if (imageFile) {
        const LIGHTHOUSE_API_KEY = process.env.REACT_APP_LIGHTHOUSE_API_KEY;
        if (!LIGHTHOUSE_API_KEY) throw new Error('Lighthouse API key missing.');
        const imageUploadRes = await lighthouse.upload([imageFile], LIGHTHOUSE_API_KEY);
        if (!imageUploadRes || !imageUploadRes.data || !imageUploadRes.data.Hash) {
          throw new Error('Lighthouse image upload failed');
        }
        imageUrl = `https://gateway.lighthouse.storage/ipfs/${imageUploadRes.data.Hash}`;
      }
      const metadata = {
        name: form.name,
        description: form.description,
        image: imageUrl,
        royaltyAddress: form.royaltyAddress,
        royaltyPercent: form.royaltyPercent,
      };
      const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
      const metadataFile = new File([metadataBlob], 'metadata.json');
      const LIGHTHOUSE_API_KEY = process.env.REACT_APP_LIGHTHOUSE_API_KEY;
      if (!LIGHTHOUSE_API_KEY) throw new Error('Lighthouse API key missing.');
      const metadataUploadRes = await lighthouse.upload([metadataFile], LIGHTHOUSE_API_KEY);
      if (!metadataUploadRes || !metadataUploadRes.data || !metadataUploadRes.data.Hash) {
        throw new Error('Lighthouse metadata upload failed');
      }
      const contractURI = `https://gateway.lighthouse.storage/ipfs/${metadataUploadRes.data.Hash}`;

      // 3. Call setContractURI (or similar) on-chain
      const collection = new Contract(address as string, [
        'function owner() view returns (address)',
        'function setContractURI(string memory newURI) public',
      ], wallet.signer);
      const owner = await collection.owner();
      if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
        alert('You are not the owner of this collection. Only the owner can update metadata.');
        setIsCommitting(false);
        return;
      }
      const tx = await collection.setContractURI(contractURI);
      await tx.wait();
      alert('Metadata updated successfully!');
      navigate(`/collection/${address}`);
    } catch (err: any) {
      alert('Commit failed: ' + (err.message || err));
    } finally {
      setIsCommitting(false);
    }
  };

  if (loading) return <div className="text-white p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1333] to-[#2d225a] text-white p-8 flex flex-col items-center">
      <button
        className="absolute top-6 left-6 flex items-center bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg transition-colors"
        onClick={() => navigate(-1)}
        title="Back"
      >
        <ArrowLeftIcon />
        Back
      </button>
      <h1 className="text-3xl font-bold mb-8">Edit Collection Metadata</h1>
      <form onSubmit={handleSubmit} className="bg-white/10 rounded-lg p-8 w-full max-w-xl flex flex-col gap-6">
        <div className="flex flex-row items-center gap-4 justify-start">
          <img
            src={imagePreview || placeholderImg}
            alt="Collection"
            className="w-32 h-32 rounded-lg object-cover border border-white/20 bg-white/10"
          />
          <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors">
            Change Image
            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </label>
        </div>
        <div>
          <label className="block text-purple-200 text-sm font-medium mb-2">Collection Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-purple-400 text-lg"
            required
          />
        </div>
        <div>
          <label className="block text-purple-200 text-sm font-medium mb-2">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-purple-400 resize-none"
            required
          />
        </div>
        <div>
          <label className="block text-purple-200 text-sm font-medium mb-2">Destination Address (Owner)</label>
          <input
            type="text"
            name="destinationAddress"
            value={form.destinationAddress}
            onChange={handleChange}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-purple-400 font-mono"
          />
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-purple-200 text-sm font-medium mb-2">Royalties Address</label>
            <input
              type="text"
              name="royaltyAddress"
              value={form.royaltyAddress}
              onChange={handleChange}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-purple-400 font-mono"
            />
          </div>
          <div className="w-40">
            <label className="block text-purple-200 text-sm font-medium mb-2">Royalties %</label>
            <input
              type="number"
              name="royaltyPercent"
              min="0"
              max="100"
              value={form.royaltyPercent}
              onChange={handleChange}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-purple-400"
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg text-lg font-bold transition-colors flex items-center justify-center space-x-2 disabled:bg-purple-900 disabled:cursor-not-allowed"
          disabled={isCommitting}
        >
          {isCommitting ? 'Committing...' : 'Commit Changes'}
        </button>
      </form>
    </div>
  );
};

export default EditCollectionMetadata; 