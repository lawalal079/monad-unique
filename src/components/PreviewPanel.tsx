import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Simple SVG Icons to replace lucide-react
const RefreshCwIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23,4 23,10 17,10"></polyline>
    <polyline points="1,20 1,14 7,14"></polyline>
    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
  </svg>
);

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7,10 12,15 17,10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
);

const Share2Icon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="18" cy="5" r="3"></circle>
    <circle cx="6" cy="12" r="3"></circle>
    <circle cx="18" cy="19" r="3"></circle>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
  </svg>
);

const StarIcon = ({ className }: { className?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
  </svg>
);

const ZapIcon = ({ className, size = 16 }: { className?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"></polygon>
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20,6 9,17 4,12"></polyline>
  </svg>
);

interface PreviewPanelProps {
  nft: any;
  generatePreview: () => void;
  onTraitsChange?: (traits: any[]) => void;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ nft, generatePreview, onTraitsChange }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [shareSuccess, setShareSuccess] = useState(false);

  // Defensive check to ensure nft is valid
  if (!nft || typeof nft !== 'object') {
    console.warn('Invalid nft object passed to PreviewPanel:', nft);
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
      >
        <div className="text-center">
          <h3 className="text-2xl font-bold text-white mb-2">NFT Preview</h3>
          <p className="text-red-300">Invalid NFT data. Please try generating a new preview.</p>
          <button
            onClick={generatePreview}
            className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Generate New Preview
          </button>
        </div>
      </motion.div>
    );
  }

  // Ensure traits is an array
  const safeTraits = Array.isArray(nft.traits) ? nft.traits : [];

  const generateNewPreview = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
    }, 1000);
  };

  const toggleFavorite = (nftId: string) => {
    setFavorites(prev =>
      prev.includes(nftId)
        ? prev.filter(id => id !== nftId)
        : [...prev, nftId]
    );
  };

  const getRarityTier = (rarityPercent: number) => {
    if (rarityPercent <= 1) return { name: 'Legendary', color: 'text-yellow-400', bg: 'bg-yellow-400/20' };
    if (rarityPercent <= 5) return { name: 'Epic', color: 'text-purple-400', bg: 'bg-purple-400/20' };
    if (rarityPercent <= 15) return { name: 'Rare', color: 'text-blue-400', bg: 'bg-blue-400/20' };
    if (rarityPercent <= 30) return { name: 'Uncommon', color: 'text-green-400', bg: 'bg-green-400/20' };
    return { name: 'Common', color: 'text-gray-400', bg: 'bg-gray-400/20' };
  };

  const calculateTotalRarityPercent = () => {
    if (!safeTraits || safeTraits.length === 0) return 0;
    
    const totalSupply = typeof nft.totalSupply === 'number' ? nft.totalSupply : 1000;
    if (totalSupply === 0) return 0;
    
    let totalRarity = 0;
    let validTraits = 0;
    
    safeTraits.forEach((trait: any) => {
      if (trait && typeof trait === 'object' && typeof trait.supply === 'number') {
        const rarity = (trait.supply / totalSupply) * 100;
        totalRarity += rarity;
        validTraits++;
      }
    });
    
    return validTraits > 0 ? totalRarity / validTraits : 0;
  };

  const totalRarityPercent = calculateTotalRarityPercent();
  const overallTier = getRarityTier(totalRarityPercent / (nft?.traits?.length || 1));

  // Calculate total trait supply and total supply for disabling mint
  const totalSupply = nft?.totalSupply || 1000;
  const totalTraitSupply = nft?.traits?.reduce((sum: number, t: any) => sum + (t.supply || 0), 0) || 0;
  const exceeds = totalTraitSupply > totalSupply;

  // Render trait images layered on top of each other
  const renderTraitImages = () => {
    if (!safeTraits || safeTraits.length === 0) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-white font-bold text-lg">NFT Preview</span>
        </div>
      );
    }
    return (
      <div className="relative w-48 h-48 mx-auto">
        {safeTraits.map((trait: any, idx: number) => {
          // Defensive check to ensure trait is valid
          if (!trait || typeof trait !== 'object') {
            console.warn('Invalid trait found at index', idx, trait);
            return null;
          }
          
          const traitId = typeof trait.id === 'string' ? trait.id : idx;
          const traitImage = typeof trait.image === 'string' ? trait.image : '';
          const traitName = typeof trait.name === 'string' ? trait.name : 'Unknown';
          
          return (
            <img
              key={traitId}
              src={traitImage}
              alt={traitName}
              className="absolute top-0 left-0 w-48 h-48 object-contain"
              style={{ zIndex: idx }}
            />
          );
        })}
      </div>
    );
  };

  // Helper to render the preview as a canvas and copy/download
  const handleShare = async () => {
    // Find the preview container
    const previewDiv = document.getElementById('nft-preview-canvas');
    if (!previewDiv) return;
    // Create a canvas
    const canvas = document.createElement('canvas');
    canvas.width = 192;
    canvas.height = 192;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Draw each trait image in order
    for (const trait of safeTraits) {
      if (trait && typeof trait === 'object' && typeof trait.image === 'string') {
        const img = new window.Image();
        img.src = trait.image;
        await new Promise((resolve) => {
          img.onload = () => {
            ctx.drawImage(img, 0, 0, 192, 192);
            resolve(true);
          };
        });
      }
    }
    // Try to copy to clipboard
    if (navigator.clipboard && (window as any).ClipboardItem) {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new (window as any).ClipboardItem({ 'image/png': blob })
          ]);
          setShareSuccess(true);
          setTimeout(() => setShareSuccess(false), 2000);
        } catch (e) {
          // fallback to download
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'nft-preview.png';
          a.click();
        }
      }, 'image/png');
    } else {
      // fallback to download
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = 'nft-preview.png';
      a.click();
    }
  };

  const handleTraitChange = (idx: number, field: string, value: string) => {
    if (!onTraitsChange) return;
    const updated = safeTraits.map((t: any, i: number) => i === idx ? { ...t, [field]: value } : t);
    onTraitsChange(updated);
  };
  const handleAddTrait = () => {
    if (!onTraitsChange) return;
    onTraitsChange([...safeTraits, { trait_type: '', value: '' }]);
  };
  const handleRemoveTrait = (idx: number) => {
    if (!onTraitsChange) return;
    onTraitsChange(safeTraits.filter((_: any, i: number) => i !== idx));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">NFT Preview</h3>
          <p className="text-purple-200">Live preview of your generated NFT</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={generatePreview}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
          >
            <RefreshCwIcon />
            <span>Generate New</span>
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2">
            <DownloadIcon />
            <span>Download</span>
          </button>
          <button
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            onClick={handleShare}
          >
            <Share2Icon />
            <span>{shareSuccess ? <><CheckIcon /> Shared!</> : 'Share'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* NFT Preview */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-purple-900 to-blue-900 rounded-xl p-6 border border-purple-400/30">
            <div className="text-center mb-4">
              <h4 className="text-white font-bold text-lg mb-2">Generated NFT</h4>
              <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full ${overallTier.bg} border border-current ${overallTier.color}`}>
                <StarIcon />
                <span className="text-sm font-semibold">{overallTier.name}</span>
              </div>
            </div>
            {/* NFT Image Preview */}
            <div id="nft-preview-canvas" className="bg-white/10 rounded-lg p-2 border-2 border-dashed border-white/30 text-center flex items-center justify-center min-h-[200px] min-w-[200px]" style={{height:'220px'}}>
              {renderTraitImages()}
            </div>
            {/* Overall Stats */}
            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-white font-bold text-lg">{safeTraits.length}</p>
                <p className="text-purple-200 text-sm">Traits</p>
              </div>
              <div>
                <p className="text-white font-bold text-lg">{Math.round(totalRarityPercent)}</p>
                <p className="text-purple-200 text-sm">Total Rarity</p>
              </div>
              <div>
                <p className="text-white font-bold text-lg">
                  {safeTraits.length > 0 ? Math.round(totalRarityPercent / safeTraits.length) : 0}
                </p>
                <p className="text-purple-200 text-sm">Avg Rarity</p>
              </div>
            </div>
          </div>
        </div>

        {/* Traits Breakdown */}
        <div className="space-y-4">
          <h4 className="text-white font-bold text-lg">Traits Breakdown</h4>
          {onTraitsChange ? (
            <div className="space-y-2 mb-4">
              {safeTraits.map((trait: any, i: number) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={trait.trait_type || trait.category || ''}
                    onChange={e => handleTraitChange(i, 'trait_type', e.target.value)}
                    placeholder="Trait type"
                    className="flex-1 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
                  />
                  <input
                    type="text"
                    value={trait.value || trait.name || ''}
                    onChange={e => handleTraitChange(i, 'value', e.target.value)}
                    placeholder="Value"
                    className="flex-1 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
                  />
                  <button type="button" onClick={() => handleRemoveTrait(i)} className="text-red-400 hover:text-red-600 text-lg px-2" title="Delete trait">
                    🗑️
                  </button>
                </div>
              ))}
              <button type="button" onClick={handleAddTrait} className="mt-2 flex items-center gap-1 text-green-400 hover:text-green-600 text-sm font-bold">
                <span className="text-lg">＋</span> Add Trait
              </button>
            </div>
          ) : null}
          <AnimatePresence>
            {safeTraits.map((trait: any, index: number) => {
              // Defensive check to ensure trait is valid
              if (!trait || typeof trait !== 'object') {
                console.warn('Invalid trait found at index', index, trait);
                return null;
              }
              
              const totalSupply = typeof nft.totalSupply === 'number' ? nft.totalSupply : 1000;
              const traitSupply = typeof trait.supply === 'number' ? trait.supply : 0;
              const percent = totalSupply > 0 ? (traitSupply / totalSupply) * 100 : 0;
              let formatted = percent.toFixed(4).replace(/\.0+$/, '').replace(/(\.[0-9]*[1-9])0+$/, '$1');
              let tier = getRarityTier(percent);
              
              const traitId = typeof trait.id === 'string' ? trait.id : index;
              const traitImage = typeof trait.image === 'string' ? trait.image : '';
              const traitName = typeof trait.name === 'string' ? trait.name : 'Unknown';
              const traitCategory = typeof trait.category === 'string' ? trait.category : 'Unknown';
              
              return (
                <motion.div
                  key={`${traitId}-${index}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-purple-400/30 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center overflow-hidden">
                        {traitImage ? (
                          <img src={traitImage} alt={traitName} className="w-10 h-10 object-contain" />
                        ) : (
                          <span className="text-white font-bold text-sm">{traitCategory.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <p className="text-white font-semibold">{traitName}</p>
                        <p className="text-purple-200 text-sm">{traitCategory}</p>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-semibold ${tier.bg} ${tier.color}`}>
                      {tier.name}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-white/60 text-sm">Supply</span>
                      <span className="text-white font-semibold">{traitSupply} NFTs</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/60 text-sm">Rarity</span>
                      <span className="text-white font-semibold">{formatted}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          tier.name === 'Legendary' ? 'bg-yellow-400' :
                          tier.name === 'Epic' ? 'bg-purple-400' :
                          tier.name === 'Rare' ? 'bg-blue-400' :
                          tier.name === 'Uncommon' ? 'bg-green-400' :
                          'bg-gray-400'
                        }`}
                        style={{ width: `${Math.min(100, percent)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-white/60">
                      <span>0%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {(!nft?.traits || nft.traits.length === 0) && (
            <div className="text-center py-8">
              <ZapIcon className="mx-auto text-white/40 mb-4" size={48} />
              <p className="text-white/60">No traits selected. Generate a preview to see traits breakdown.</p>
            </div>
          )}
        </div>
      </div>

      {/* Action Bar */}
      <div className="mt-6 pt-6 border-t border-white/20 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => toggleFavorite(nft?.id || 'preview')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              favorites.includes(nft?.id || 'preview')
                ? 'bg-yellow-600 text-white'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            <StarIcon className={favorites.includes(nft?.id || 'preview') ? 'fill-current' : ''} />
            <span>{favorites.includes(nft?.id || 'preview') ? 'Favorited' : 'Add to Favorites'}</span>
          </button>
          <div className="text-white/60 text-sm">
            Generated at: {nft?.generatedAt?.toLocaleTimeString() || 'Just now'}
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={exceeds}
          >
            Mint This NFT
          </button>
          {exceeds && (
            <span className="text-red-400 font-bold ml-2">Exceeds total supply!</span>
          )}
          <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors">
            Save Template
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default PreviewPanel; 