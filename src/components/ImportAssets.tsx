import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useImportedAssets } from '../contexts/ImportedAssetsContext';
import lighthouse from '@lighthouse-web3/sdk';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '../contexts/WalletContext';

import { NFTStorage, File as NFTFile } from 'nft.storage';


// Simple SVG Icons to replace lucide-react
const UploadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="17,8 12,3 7,8"></polyline>
    <line x1="12" y1="3" x2="12" y2="15"></line>
  </svg>
);

const FileTextIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14,2 14,8 20,8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10,9 9,9 8,9"></polyline>
  </svg>
);

const LinkIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
  </svg>
);

const ImageIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <circle cx="8.5" cy="8.5" r="1.5"></circle>
    <polyline points="21,15 16,10 5,21"></polyline>
  </svg>
);

const AlertCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22,4 12,14.01 9,11.01"></polyline>
  </svg>
);

const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const Edit3Icon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 20h9"></path>
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
  </svg>
);

interface ImportedAsset {
  image?: string;
  name?: string;
  description?: string;
  attributes?: any[];
  traits?: { trait_type: string; value: string }[];
  [key: string]: any;
}

interface ValidationError {
  index: number;
  field: string;
  message: string;
}

const ImportAssets: React.FC = () => {
  const [step, setStep] = useState<'choose' | 'preview' | 'uploading' | 'validation'>('choose');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [metadata, setMetadata] = useState<ImportedAsset[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const { assets, setAssets, walletAddress } = useImportedAssets();
  const navigate = useNavigate();
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showAutoGenerate, setShowAutoGenerate] = useState(false);
  const [batchSize, setBatchSize] = useState<number>(0);
  const [currentBatch, setCurrentBatch] = useState<number>(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const NFT_STORAGE_API_KEY = process.env.REACT_APP_NFT_STORAGE_API_KEY;
  const [selectedService, setSelectedService] = useState<'lighthouse' | 'nftstorage'>('lighthouse');
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [uploadedMetadataUrls, setUploadedMetadataUrls] = useState<string[]>([]);
  const { wallet } = useWallet();
  const [galleryAssets, setGalleryAssets] = useState<ImportedAsset[]>(assets);
  const [previewAssets, setPreviewAssets] = useState<ImportedAsset[]>([]);

  // Clear metadata and imagePreviews on initial mount only
  useEffect(() => {
    setMetadata([]);
    setImagePreviews([]);
  }, []);

  // Set metadata from context assets only when wallet changes
  useEffect(() => {
    setMetadata(assets);
    setGalleryAssets(assets);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAddress]);

  // Helper to update both metadata and context assets together
  const handleSetMetadata = (newMetadata: ImportedAsset[]) => {
    setMetadata(newMetadata);
    setAssets(newMetadata);
  };

  // Metadata validation
  const validateMetadata = (assets: ImportedAsset[]): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    assets.forEach((asset, index) => {
      // Check required fields
      if (!asset.name || asset.name.trim() === '') {
        errors.push({ index, field: 'name', message: 'Name is required' });
      }
      
      if (!asset.image || asset.image.trim() === '') {
        errors.push({ index, field: 'image', message: 'Image URL is required' });
      }
      
      // Validate image URLs
      if (asset.image && !isValidImageUrl(asset.image)) {
        errors.push({ index, field: 'image', message: 'Invalid image URL' });
      }
      
      // Check attributes/traits
      if (asset.attributes && !Array.isArray(asset.attributes)) {
        errors.push({ index, field: 'attributes', message: 'Attributes must be an array' });
      }
      
      if (asset.traits && !Array.isArray(asset.traits)) {
        errors.push({ index, field: 'traits', message: 'Traits must be an array' });
      }
    });
    
    return errors;
  };

  // Validate image URL
  const isValidImageUrl = (url: string): boolean => {
    // Accept blob URLs (for uploaded files)
    if (url.startsWith('blob:')) {
      return true;
    }
    
    // Accept data URLs (base64 encoded images)
    if (url.startsWith('data:image/')) {
      return true;
    }
    
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || 
             urlObj.protocol === 'https:' || 
             urlObj.protocol === 'ipfs:' ||
             urlObj.protocol === 'ipns:';
    } catch {
      // If URL parsing fails, it might be a relative path or invalid URL
      return false;
    }
  };

  // Auto-generate metadata for images
  const generateMetadata = (imageFiles: File[]): ImportedAsset[] => {
    // Monad character name prefixes and suffixes
    const monadPrefixes = ['mo', 'sa', 'cho', 'fre', 'my', 'ka', 'lo', 'no', 'po', 'ro'];
    const monadSuffixes = ['n', 'k', 'd', 'g', 'y', 'i', 'a', 'o', 'u', 'x', 'z', 'q'];
    const monadWords = ['fren', 'moladank', 'moyaki', 'mouch', 'salmonad', 'mokadel', 'chog', 'mokey', 'salad', 'chonk', 'mop', 'sad', 'mad', 'lad', 'pad', 'rad', 'tad', 'wad'];
    
    // Generate a random Monad-style name
    const generateMonadName = (index: number): string => {
      // 30% chance to use existing Monad words
      if (Math.random() < 0.3) {
        return monadWords[index % monadWords.length];
      }
      
      // 70% chance to generate new Monad-style name
      const prefix = monadPrefixes[Math.floor(Math.random() * monadPrefixes.length)];
      const suffix = monadSuffixes[Math.floor(Math.random() * monadSuffixes.length)];
      return prefix + suffix;
    };
    
    return imageFiles.map((file, index) => {
      // Generate Monad-style name
      const monadName = generateMonadName(index);
      
      // Generate description based on Monad theme
      const descriptions = [
        `A mysterious ${monadName} from the Monad realm`,
        `The legendary ${monadName} of ancient Monad lore`,
        `A powerful ${monadName} guardian of the Monad kingdom`,
        `The wise ${monadName} keeper of Monad secrets`,
        `A brave ${monadName} warrior of the Monad realm`,
        `The mystical ${monadName} spirit of Monad`,
        `A noble ${monadName} ruler of the Monad lands`,
        `The ancient ${monadName} sage of Monad wisdom`
      ];
      
      const description = descriptions[index % descriptions.length];
      
      // Generate Monad-themed traits
      const monadTraits = [
        { trait_type: 'Character', value: monadName },
        { trait_type: 'Realm', value: 'Monad' },
        { trait_type: 'Rarity', value: 'Common' },
        { trait_type: 'Type', value: 'Generated' },
        { trait_type: 'File Type', value: file.type.split('/')[1]?.toUpperCase() || 'IMAGE' },
        { trait_type: 'Size', value: `${Math.round(file.size / 1024)}KB` }
      ];
      
      return {
        name: monadName,
        description: description,
        image: URL.createObjectURL(file),
        traits: monadTraits
      };
    });
  };

  // Block all actions if wallet is not connected
  if (!wallet.isConnected || !walletAddress) {
    return (
      <div className="bg-yellow-500/20 rounded-lg p-6 border border-yellow-500/50 text-center mt-8">
        <p className="text-yellow-200 mb-4">Connect your wallet to manage your imported assets.</p>
        <p className="text-yellow-100 text-sm">All import, edit, and gallery actions are disabled until a wallet is connected.</p>
      </div>
    );
  }

  // Helper to append all new assets, even if identical
  const appendAssets = (newAssets: ImportedAsset[]) => {
    if (newAssets.length > 0) {
      handleSetMetadata([...metadata, ...newAssets]);
    }
  };

  // Helper to append to gallery (append new assets)
  const appendToGallery = (newAssets: ImportedAsset[]) => {
    if (newAssets.length > 0) {
      const updated = [...galleryAssets, ...newAssets];
      setGalleryAssets(updated);
      setAssets(updated);
    }
  };

  // Helper to replace preview/metadata (for auto-generate, upload, etc.)
  const replacePreviewMetadata = (newAssets: ImportedAsset[]) => {
    setMetadata(newAssets);
  };

  // Update all import/upload/auto-generate logic to use appendAssets
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages(files);
    setImagePreviews(files.map(file => URL.createObjectURL(file)));
    if (files.length > 0) {
      setShowAutoGenerate(true);
      const newMetadata = generateMetadata(files).map((meta, i) => ({ ...meta, file: files[i] }));
      replacePreviewMetadata(newMetadata);
    }
  };

  const handleMetadataUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        let data;
        if (file.name.endsWith('.json')) {
          data = JSON.parse(ev.target?.result as string);
        } else if (file.name.endsWith('.csv')) {
          // Enhanced CSV parser
          const text = ev.target?.result as string;
          const lines = text.split('\n').map(r => r.trim()).filter(Boolean);
          const [header, ...rows] = lines;
          const keys = header.split(',').map(k => k.trim());
          
          data = rows.map(row => {
            const values = row.split(',').map(v => v.trim());
            const asset: Record<string, string> = {};
            keys.forEach((k, i) => {
              asset[k] = values[i] || '';
            });
            
            // Convert attributes string to array if present
            if (asset.attributes && typeof asset.attributes === 'string') {
              try {
                asset.attributes = JSON.parse(asset.attributes);
              } catch {
                // leave asset.attributes as original string if JSON.parse fails
              }
            }
            
            // Convert traits string to array if present
            if (asset.traits && typeof asset.traits === 'string') {
              try {
                asset.traits = JSON.parse(asset.traits);
              } catch {
                // leave asset.traits as original string if JSON.parse fails
              }
            }
            
            return asset;
          });
        }
        
        const processedData = Array.isArray(data) ? data : [data];
        replacePreviewMetadata(processedData);
        setBatchSize(processedData.length);
        setShowAutoGenerate(false);
      } catch (err) {
        alert('Failed to parse metadata file. Please check the format.');
      }
    };
    reader.readAsText(file);
  };

  const handleUrlImport = async () => {
    const urls = urlInput.split(/\s+/).filter(Boolean);
    const newAssets = [];
    for (const url of urls) {
      try {
        // CSV
        if (url.endsWith('.csv')) {
          const resp = await fetch(url);
          if (!resp.ok) continue;
          const text = await resp.text();
          // Simple CSV parser: expects headers in first row
          const [headerLine, ...lines] = text.split(/\r?\n/).filter(Boolean);
          const headers = headerLine.split(',').map(h => h.trim());
          for (const line of lines) {
            const values = line.split(',');
            const asset: Record<string, string> = {};
            headers.forEach((h, i) => asset[h] = values[i]);
            newAssets.push({
              name: asset['name'] || asset['Name'] || 'CSV Asset',
              description: asset['description'] || asset['Description'] || '',
              image: asset['image'] || asset['Image'] || '',
              attributes: asset['attributes'] ? JSON.parse(asset['attributes']) as any[] : [],
              traits: asset['traits'] ? JSON.parse(asset['traits']) as any[] : [],
            });
          }
        // JSON
        } else if (url.endsWith('.json')) {
          const resp = await fetch(url);
          if (!resp.ok) continue;
          const data = await resp.json();
          if (Array.isArray(data)) {
            data.forEach(meta => newAssets.push(meta));
          } else {
            newAssets.push({
              name: data.name || 'Imported NFT',
              description: data.description || '',
              image: data.image || '',
              attributes: data.attributes || [],
              traits: data.traits || [],
            });
          }
        // Image
        } else if (/\.(jpg|jpeg|png|gif|webp)$/i.test(url)) {
          // Try to fetch the image to validate
          const resp = await fetch(url, { method: 'HEAD' });
          if (!resp.ok) continue;
          newAssets.push({
            name: 'Imported Image',
            description: 'Imported from URL',
            image: url,
            traits: [
              { trait_type: 'Source', value: 'URL Import' },
              { trait_type: 'Type', value: 'Imported' }
            ]
          });
        }
      } catch (e) {
        continue;
      }
    }
    if (newAssets.length > 0) {
      replacePreviewMetadata(newAssets);
      setShowAutoGenerate(false);
    }
  };

  // Auto-generate metadata (replace preview/metadata only)
  const handleAutoGenerate = () => {
    const newMetadata = generateMetadata(images).map((meta, i) => ({ ...meta, file: images[i] }));
    replacePreviewMetadata(newMetadata);
    setShowAutoGenerate(false);
  };

  // Remove asset (only from current wallet's assets)
  const handleRemove = (idx: number) => {
    handleSetMetadata(metadata.filter((_, i) => i !== idx));
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  // Clear all data (reset everything)
  const handleClearAll = () => {
    setImages([]);
    setImagePreviews([]);
    handleSetMetadata([]);
    setGalleryAssets([]);
    setAssets([]);
    setUrlInput('');
    setShowAutoGenerate(false);
    setValidationErrors([]);
    setBatchSize(0);
    setCurrentBatch(0);
  };

  // Change Clear All to Back: navigate to previous page
  const handleBack = () => {
    navigate(-1);
  };

  // Preview before mint
  const handlePreview = () => {
    // Only allow preview if there is new input (images, imagePreviews, or metadata from this session)
    let combinedAssets: ImportedAsset[] = [];
    if (images.length > 0) {
      combinedAssets = generateMetadata(images).map((meta, i) => ({ ...meta, file: images[i] }));
    } else if (imagePreviews.length > 0) {
      combinedAssets = imagePreviews.map((img, i) => ({
        image: img,
        name: `Asset ${i + 1}`,
        description: `Imported asset ${i + 1}`,
        traits: [
          { trait_type: 'Type', value: 'Imported' },
          { trait_type: 'Rarity', value: 'Common' }
        ]
      }));
    } else if (metadata.length > 0 && metadata.some(asset => asset.image || asset.name || asset.description)) {
      combinedAssets = metadata;
    }
    if (combinedAssets.length === 0) {
      alert('Please upload images or metadata before previewing assets.');
      return;
    }
    setPreviewAssets(combinedAssets);
    const errors = validateMetadata(combinedAssets);
    setValidationErrors(errors);
    if (errors.length > 0) {
      setStep('validation');
    } else {
      setStep('preview');
    }
  };

  // Helper to upload to NFT.Storage
  async function uploadToNFTStorage(file: File): Promise<string> {
    if (!NFT_STORAGE_API_KEY) throw new Error('NFT.Storage API key missing');
    const client = new NFTStorage({ token: NFT_STORAGE_API_KEY });
    const cid = await client.storeBlob(new NFTFile([file], file.name, { type: file.type }));
    return `https://ipfs.io/ipfs/${cid}`;
  }

  // Confirm import: append preview/metadata to gallery
  const handleConfirm = async () => {
    setStep('uploading');
    setUploadSuccess(false);
    let assets: ImportedAsset[] = [];
    let imageUrls: string[] = [];
    let metadataUrls: string[] = [];
    const LIGHTHOUSE_API_KEY = process.env.REACT_APP_LIGHTHOUSE_API_KEY;
    let uploadFailed = false;

    // Upload images to IPFS
    if (images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        const file = images[i];
        let uploaded = false;
        if (selectedService === 'lighthouse') {
          try {
            if (!LIGHTHOUSE_API_KEY) throw new Error('Lighthouse API key missing');
            const res = await lighthouse.upload([file], LIGHTHOUSE_API_KEY);
            if (!res || !res.data || !res.data.Hash) throw new Error('Lighthouse image upload failed');
            imageUrls.push(`https://gateway.lighthouse.storage/ipfs/${res.data.Hash}`);
            uploaded = true;
          } catch (err) {
            imageUrls.push('');
          }
        } else if (selectedService === 'nftstorage') {
          try {
            const nftUrl = await uploadToNFTStorage(file);
            imageUrls.push(nftUrl);
            uploaded = true;
          } catch (nftErr) {
            imageUrls.push('');
          }
        }
        if (!uploaded) uploadFailed = true;
        setUploadProgress(Math.round(((i + 1) / images.length) * 100));
      }
    } else {
      imageUrls = imagePreviews;
    }

    // If any upload failed, show error and do not proceed
    if (uploadFailed || imageUrls.some(url => !url.startsWith('http'))) {
      setStep('choose');
      setUploadSuccess(false);
      alert('One or more images failed to upload to Lighthouse. Please try again.');
      return;
    }

    // Combine with metadata
    if (metadata.length > 0) {
      assets = metadata.map((meta, i) => ({
        ...meta,
        image: imageUrls[i] || meta.image || ''
      }));
    } else {
      assets = imageUrls.map((img, i) => ({ 
        image: img, 
        name: `Asset ${i + 1}`,
        description: `Imported asset ${i + 1}`,
        traits: [
          { trait_type: 'Type', value: 'Imported' },
          { trait_type: 'Rarity', value: 'Common' }
        ]
      }));
    }

    // Upload metadata JSON for each asset
    for (let i = 0; i < assets.length; i++) {
      try {
        const metaUrl = await uploadMetadataToIPFSWithCache(assets[i]);
        metadataUrls.push(metaUrl);
      } catch (err) {
        metadataUrls.push('');
      }
    }

    appendToGallery(assets);
    setUploadSuccess(true);
    setUploadedUrls(imageUrls);
    setUploadedMetadataUrls(metadataUrls);
    setMetadata([]);
    setImages([]);
    setImagePreviews([]);
  };

  // Calculate trait rarity insights
  const calculateTraitRarity = (assets: ImportedAsset[]) => {
    const traitCounts: { [key: string]: { [value: string]: number } } = {};
    const totalAssets = assets.length;
    
    assets.forEach(asset => {
      const traits = asset.traits || asset.attributes || [];
      traits.forEach((trait: any) => {
        const traitType = trait.trait_type || trait.type || '';
        const value = trait.value || '';
        
        if (traitType && value) {
          if (!traitCounts[traitType]) {
            traitCounts[traitType] = {};
          }
          traitCounts[traitType][value] = (traitCounts[traitType][value] || 0) + 1;
        }
      });
    });
    
    return { traitCounts, totalAssets };
  };

  // Get rarity level for a trait value
  const getRarityLevel = (count: number, total: number) => {
    const percentage = (count / total) * 100;
    if (percentage <= 1) return { level: 'Legendary', color: 'text-yellow-400' };
    if (percentage <= 5) return { level: 'Epic', color: 'text-purple-400' };
    if (percentage <= 15) return { level: 'Rare', color: 'text-blue-400' };
    if (percentage <= 30) return { level: 'Uncommon', color: 'text-green-400' };
    return { level: 'Common', color: 'text-gray-400' };
  };

  // IPFS caching with fallback
  const uploadToIPFSWithCache = async (file: File): Promise<string> => {
    const LIGHTHOUSE_API_KEY = process.env.REACT_APP_LIGHTHOUSE_API_KEY;
    
    try {
      if (!LIGHTHOUSE_API_KEY) throw new Error('Lighthouse API key missing');
      
      // Try primary upload
      const res = await lighthouse.upload([file], LIGHTHOUSE_API_KEY);
      if (!res || !res.data || !res.data.Hash) throw new Error('Lighthouse upload failed');
      
      const ipfsUrl = `https://gateway.lighthouse.storage/ipfs/${res.data.Hash}`;
      
      // Cache the result
      const cacheKey = `ipfs_${file.name}_${file.size}`;
      localStorage.setItem(cacheKey, JSON.stringify({
        hash: res.data.Hash,
        url: ipfsUrl,
        timestamp: Date.now()
      }));
      
      return ipfsUrl;
    } catch (err) {
      // Try fallback gateways
      const fallbackGateways = [
        'https://ipfs.io/ipfs/',
        'https://gateway.pinata.cloud/ipfs/',
        'https://cloudflare-ipfs.com/ipfs/'
      ];
      
      // For now, return a placeholder (in production, you'd implement actual fallback)
      throw new Error('IPFS upload failed. Please try again.');
    }
  };

  // Enhanced metadata upload with caching
  const uploadMetadataToIPFSWithCache = async (metadata: any): Promise<string> => {
    const LIGHTHOUSE_API_KEY = process.env.REACT_APP_LIGHTHOUSE_API_KEY;
    
    try {
      if (!LIGHTHOUSE_API_KEY) throw new Error('Lighthouse API key missing');
      
      const blob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
      const file = new File([blob], 'metadata.json');
      
      const res = await lighthouse.upload([file], LIGHTHOUSE_API_KEY);
      if (!res || !res.data || !res.data.Hash) throw new Error('Lighthouse metadata upload failed');
      
      const ipfsUrl = `https://gateway.lighthouse.storage/ipfs/${res.data.Hash}`;
      
      // Cache metadata
      const cacheKey = `metadata_${JSON.stringify(metadata).slice(0, 50)}`;
      localStorage.setItem(cacheKey, JSON.stringify({
        hash: res.data.Hash,
        url: ipfsUrl,
        metadata: metadata,
        timestamp: Date.now()
      }));
      
      return ipfsUrl;
    } catch (err) {
      throw new Error('Failed to upload metadata to IPFS');
    }
  };

  // Download metadata as JSON
  const downloadMetadataAsJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(metadata, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "metadata.json");
    dlAnchorElem.click();
  };

  // Download metadata as CSV
  const downloadMetadataAsCSV = () => {
    if (!metadata.length) return;
    const replacer = (key: string, value: any) => value === null ? '' : value;
    const flat = metadata.map(asset => {
      const flatTraits = (asset.traits || []).reduce((acc: { [key: string]: any }, t: any) => {
        acc[t.trait_type as string] = t.value;
        return acc;
      }, {} as { [key: string]: any });
      return { ...asset, ...flatTraits } as { [key: string]: any };
    });
    const header = Object.keys(flat[0]);
    const csv = [
      header.join(','),
      ...flat.map((row: { [key: string]: any }) => header.map((fieldName: string) => JSON.stringify(row[fieldName], replacer)).join(','))
    ].join('\r\n');
    const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "metadata.csv");
    dlAnchorElem.click();
  };

  // Helper to determine if there are new assets to preview
  const hasNewAssetsToPreview = images.length > 0 || imagePreviews.length > 0 || (metadata.length > 0 && metadata.some(asset => asset.image || asset.name || asset.description));

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1333] to-[#2d225a] text-white p-8 flex flex-col items-center">
      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-8 flex items-center gap-3 text-purple-400 border-b-4 border-purple-400 pb-2"
      >
        <UploadIcon />
        Import Assets
      </motion.h1>

      <AnimatePresence mode="wait">
        {step === 'choose' && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col gap-6 w-full max-w-2xl"
          >
            {/* Upload Images */}
            <div className="bg-white/10 rounded-lg p-6 border border-white/20">
              <label className="block font-semibold mb-3 flex items-center gap-2">
                <ImageIcon />
                Upload Images
              </label>
              <input 
                type="file" 
                accept="image/*" 
                multiple 
                onChange={handleImageUpload} 
                className="mb-3 w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700" 
              />
              {images.length > 0 && (
                <div className="text-sm text-purple-200">
                  {images.length} image(s) selected
                </div>
              )}
              
              {/* Manual Auto-Generate Button */}
              {images.length > 0 && (
                <button 
                  className="mt-3 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded text-sm flex items-center gap-2"
                  onClick={handleAutoGenerate}
                >
                  <Edit3Icon />
                  Auto-Generate Metadata
                </button>
              )}
            </div>

            {/* Upload Metadata */}
            <div className="bg-white/10 rounded-lg p-6 border border-white/20">
              <label className="block font-semibold mb-3 flex items-center gap-2">
                <FileTextIcon />
                Upload Metadata (CSV or JSON)
              </label>
              <input 
                type="file" 
                accept=".csv,.json" 
                onChange={handleMetadataUpload} 
                className="mb-3 w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700" 
              />
              {/* {metadata.length > 0 && (
                <div className="text-sm text-blue-200">
                  {metadata.length} asset(s) found in metadata
                </div>
              )} */}
            </div>

            {/* Auto-generate Metadata */}
            {showAutoGenerate && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-yellow-500/20 rounded-lg p-4 border border-yellow-500/50"
              >
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircleIcon />
                  <span className="font-semibold text-yellow-400">Auto-Generate Metadata?</span>
                </div>
                <p className="text-yellow-200 text-sm mb-3">
                  You've uploaded images but no metadata. Would you like to auto-generate basic metadata for them?
                </p>
                {/* <button>Download JSON</button> <button>Download CSV</button> */}
                <button 
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded text-sm"
                  onClick={handleAutoGenerate}
                >
                  Generate Metadata
                </button>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              {/* Back Button */}
              {(images.length > 0) && (
                <button 
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold"
                  onClick={handleBack}
                >
                  Back
                </button>
              )}
              
              {/* Preview Button */}
              <button 
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold text-lg flex items-center gap-2 transition-all duration-200" 
                onClick={handlePreview}
                disabled={images.length === 0 && imagePreviews.length === 0}
              >
                <EyeIcon />
                Preview Assets
              </button>
            </div>
          </motion.div>
        )}

        {step === 'validation' && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="w-full max-w-2xl"
          >
            <div className="bg-red-500/20 rounded-lg p-6 border border-red-500/50 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircleIcon />
                <h2 className="text-xl font-bold text-red-400">Validation Errors Found</h2>
              </div>
              <div className="space-y-2">
                {validationErrors.map((error, idx) => (
                  <div key={idx} className="text-red-300 text-sm">
                    <strong>Asset {error.index + 1}</strong> - {error.field}: {error.message}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-4">
              <button 
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded" 
                onClick={() => setStep('choose')}
              >
                Back to Import
              </button>
              <button 
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded" 
                onClick={() => setStep('preview')}
              >
                Continue Anyway
              </button>
            </div>
          </motion.div>
        )}

        {step === 'preview' && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="w-full max-w-4xl flex flex-col gap-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <EyeIcon />
                Preview & Edit Assets
              </h2>
            </div>
            {/* Trait Rarity Insights */}
            {previewAssets.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/10 rounded-lg p-6 border border-white/20"
              >
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Edit3Icon />
                  Trait Rarity Insights
                </h3>
                {(() => {
                  const { traitCounts, totalAssets } = calculateTraitRarity(previewAssets);
                  const traitTypes = Object.keys(traitCounts);
                  if (traitTypes.length === 0) {
                    return <p className="text-purple-200">No traits found in assets.</p>;
                  }
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {traitTypes.map(traitType => {
                        const values = traitCounts[traitType];
                        const valueEntries = Object.entries(values).sort((a, b) => a[1] - b[1]);
                        return (
                          <div key={traitType} className="bg-white/5 rounded-lg p-4">
                            <h4 className="text-white font-medium mb-3">{traitType}</h4>
                            <div className="space-y-2">
                              {valueEntries.map(([value, count]) => {
                                const { level, color } = getRarityLevel(count, totalAssets);
                                return (
                                  <div key={value} className="flex justify-between items-center text-sm">
                                    <span className="text-purple-200">{value}</span>
                                    <div className="flex items-center gap-2">
                                      <span className={color}>{level}</span>
                                      <span className="text-white/60">({count}/{totalAssets})</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </motion.div>
            )}
            {/* Asset Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {previewAssets.map((asset, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white/10 rounded-lg p-4 border border-white/20 hover:border-purple-500/50 transition-all duration-200"
                >
                  {/* Image */}
                  <div className="relative mb-4">
                    <img 
                      src={asset.image} 
                      alt={asset.name || `asset-${idx}`} 
                      className="w-full h-48 object-cover rounded-lg" 
                    />
                    <button 
                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg" 
                      onClick={() => handleRemove(idx)}
                    >
                      ×
                    </button>
                  </div>
                  {/* Asset Info */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-purple-200 mb-1">Name</label>
                      <input
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:border-purple-500"
                        value={asset.name || ''}
                        onChange={e => handleSetMetadata(metadata.map((r, index) => 
                          index === idx ? { ...r, name: e.target.value } : r
                        ))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-purple-200 mb-1">Description</label>
                      <textarea
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm resize-none focus:outline-none focus:border-purple-500"
                        rows={2}
                        value={asset.description || ''}
                        onChange={e => handleSetMetadata(metadata.map((r, index) => 
                          index === idx ? { ...r, description: e.target.value } : r
                        ))}
                      />
                    </div>
                    {/* Traits Section */}
                    <div className="w-full mt-2">
                      <div className="text-sm font-semibold text-purple-200 mb-2">Traits</div>
                      <div className="grid grid-cols-2 gap-2">
                        {Array.isArray(asset.traits) && asset.traits.map((trait, i) => {
                          // Defensive check to ensure trait is a valid object
                          if (!trait || typeof trait !== 'object') {
                            return null;
                          }
                          return (
                            <React.Fragment key={i}>
                              <div className="bg-white/10 rounded-l px-2 py-1 text-xs text-purple-200 font-semibold overflow-hidden break-words text-right">
                                {typeof trait.trait_type === 'string' ? trait.trait_type : 'Unknown'}
                              </div>
                              <input
                                className="bg-white/10 rounded-r px-2 py-1 text-xs text-white overflow-hidden break-words text-left focus:outline-none focus:border-purple-500 border border-transparent focus:bg-white/20"
                                value={typeof trait.value === 'string' ? trait.value : ''}
                                onChange={e => {
                                  const newValue = e.target.value;
                                  handleSetMetadata(metadata.map((r, assetIndex) => {
                                    if (assetIndex !== idx) return r;
                                    const newTraits = Array.isArray(r.traits) ? [...r.traits] : [];
                                    if (newTraits[i]) newTraits[i] = { ...newTraits[i], value: newValue };
                                    return { ...r, traits: newTraits };
                                  }));
                                }}
                              />
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <button 
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold" 
                onClick={() => setStep('choose')}
              >
                Back
              </button>
              
              {/* Reset Button - Only show if metadata was auto-generated */}
              {previewAssets.length > 0 && previewAssets.every(asset => 
                asset.name?.includes('Asset ') && 
                asset.description?.includes('Auto-generated')
              ) && (
                <button 
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2" 
                  onClick={() => {
                    handleSetMetadata([]);
                    setStep('choose');
                    setShowAutoGenerate(true);
                  }}
                >
                  <Edit3Icon />
                  Regenerate Metadata
                </button>
              )}
              
              <button 
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2" 
                onClick={handleConfirm}
              >
                <CheckCircleIcon />
                Confirm Import
              </button>
            </div>
          </motion.div>
        )}

        {step === 'uploading' && uploadSuccess && (
          <div className="w-full max-w-xl flex flex-col items-center justify-center gap-6 py-16">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-4 mx-auto">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-2xl font-bold mb-4 text-green-300">Upload Successful!</h2>
            <p className="text-green-200 mb-6">All images have been uploaded to Lighthouse and your assets are ready.</p>
            {uploadedUrls.length > 0 && (
              <div className="mt-6 w-full">
                <h3 className="text-lg font-bold text-green-200 mb-2">Uploaded IPFS URLs:</h3>
                <ul className="bg-white/10 rounded-lg p-4 border border-white/20 text-xs text-green-100 max-h-48 overflow-auto">
                  {uploadedUrls.map((url, idx) => (
                    <li key={idx} className="mb-1 break-all">
                      <a href={url} target="_blank" rel="noopener noreferrer" className="underline text-green-300 hover:text-green-400">{url}</a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {uploadedMetadataUrls.length > 0 && (
              <div className="mt-6 w-full">
                <h3 className="text-lg font-bold text-blue-200 mb-2">Uploaded Metadata IPFS URLs:</h3>
                <ul className="bg-white/10 rounded-lg p-4 border border-white/20 text-xs text-blue-100 max-h-48 overflow-auto">
                  {uploadedMetadataUrls.map((url, idx) => (
                    <li key={idx} className="mb-1 break-all">
                      <a href={url} target="_blank" rel="noopener noreferrer" className="underline text-blue-300 hover:text-blue-400">{url}</a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <button
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold text-lg flex items-center gap-2 transition-all duration-200"
              onClick={() => navigate('/')}
            >
              Go to Gallery
            </button>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ImportAssets; 