import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import CollectionDeployment from './components/CollectionDeployment';
import Gallery from './components/Gallery';
import CollectionManager from './components/CollectionManager';
import PreviewPanel from './components/PreviewPanel';
import WalletConnectButton from './components/WalletConnectButton';
import { useWallet } from './contexts/WalletContext';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ManageCollection from './components/ManageCollection';
import EditCollectionMetadata from './components/EditCollectionMetadata';
import MintNFT from './components/MintNFT';
import CollectionNFTs from './components/CollectionNFTs';
import Permissions from './components/Permissions';
import ImportAssets from './components/ImportAssets';
import { ImportedAssetsProvider } from './contexts/ImportedAssetsContext';

// Simple SVG Icons to replace lucide-react
const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const PaletteIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="13.5" cy="6.5" r=".5"></circle>
    <circle cx="17.5" cy="10.5" r=".5"></circle>
    <circle cx="8.5" cy="7.5" r=".5"></circle>
    <circle cx="6.5" cy="12.5" r=".5"></circle>
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path>
  </svg>
);

const LayersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
    <polyline points="2,17 12,22 22,17"></polyline>
    <polyline points="2,12 12,17 22,12"></polyline>
  </svg>
);

const CollectionsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="4" y="6" width="16" height="12" rx="2"/>
    <rect x="7" y="3" width="10" height="12" rx="2"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>
);

const DownloadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7,10 12,15 17,10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
);

const UploadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="17,8 12,3 7,8"></polyline>
    <line x1="12" y1="3" x2="12" y2="15"></line>
  </svg>
);

const SparklesIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
  </svg>
);

export interface Trait {
  id: string;
  name: string;
  category: string;
  image: string;
  supply: number; // Number of NFTs with this trait
  color?: string;
}

export interface NFTCollection {
  id: string;
  name: string;
  symbol: string;
  description: string;
  traits: Trait[];
  totalSupply: number;
  mintPrice: number;
  royaltyPercentage: number;
  isActive: boolean;
  createdAt: Date;
}

const MONAD_PARAMS = {
  chainId: '0x279f', // 10143 in hex
  chainName: 'Monad Testnet',
  nativeCurrency: {
    name: 'Monad',
    symbol: 'MON',
    decimals: 18,
  },
  rpcUrls: ['https://testnet-rpc.monad.xyz'],
  blockExplorerUrls: ['https://testnet.monadexplorer.com'],
};

async function ensureMonadNetwork() {
  if (!window.ethereum) throw new Error('No wallet found');
  const provider = window.ethereum;
  const monadChainId = MONAD_PARAMS.chainId;
  const currentChainId = await provider.request({ method: 'eth_chainId' });
  if (currentChainId !== monadChainId) {
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: monadChainId }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [MONAD_PARAMS],
        });
      } else {
        throw switchError;
      }
    }
  }
}

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    // Filter out errors from browser extensions (e.g., walletRouter, chrome-extension, shouldSetTallyForCurrentProvider, window$walletRouter, Tally)
    if (
      (error.stack && error.stack.includes('chrome-extension://')) ||
      (error.message && error.message.includes('walletRouter')) ||
      (error.message && error.message.includes('shouldSetTallyForCurrentProvider')) ||
      (error.message && error.message.includes('window$walletRouter')) ||
      (error.stack && error.stack.includes('window$walletRouter')) ||
      (error.message && error.message.includes('Tally'))
    ) {
      // Do not trigger error UI for extension errors
      return { hasError: false, error: null };
    }
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Optionally log only non-extension errors
    if (
      !(error.stack && error.stack.includes('chrome-extension://')) &&
      !(error.message && error.message.includes('walletRouter'))
    ) {
      console.error('React Error Boundary caught an error:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#1a1333] to-[#2d225a] text-white p-8 flex flex-col items-center justify-center">
          <div className="bg-red-900/20 rounded-xl p-8 border border-red-500/50 max-w-2xl text-center">
            <h1 className="text-2xl font-bold text-red-300 mb-4">Something went wrong</h1>
            <p className="text-red-200 mb-6">
              The app encountered an error. This might be due to corrupted data.
            </p>
            <div className="space-y-4">
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold"
              >
                Clear All Data & Reload
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold ml-4"
              >
                Try Again
              </button>
            </div>
            {this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-red-300">Error Details</summary>
                <pre className="mt-2 text-xs text-red-200 bg-red-900/50 p-4 rounded overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'create' | 'rarity' | 'collections' | 'templates'>('create');
  const [currentCollection, setCurrentCollection] = useState<NFTCollection | null>(null);
  const [previewNFT, setPreviewNFT] = useState<any>(null);
  const [newCollectionKey, setNewCollectionKey] = useState(0);
  const { wallet } = useWallet();
  const [isSwitching, setIsSwitching] = useState(false);
  const [chainId, setChainId] = useState('');
  const [collectionsRefreshKey, setCollectionsRefreshKey] = useState(0);

  const tabs = [
    { id: 'create', label: 'Create', icon: PaletteIcon },
    { id: 'collections', label: 'Collections', icon: CollectionsIcon },
    { id: 'rarity', label: 'Gallery', icon: LayersIcon },
  ];

  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.request({ method: 'eth_chainId' }).then((id: string) => setChainId(id));
      // Handle chain changes without page refresh
      const handleChainChanged = (id: string) => {
        setChainId(id);
        // Optionally show a success message
        console.log('Network switched successfully');
      };
      window.ethereum.on('chainChanged', handleChainChanged);
      // Cleanup listener
      return () => {
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  const showSwitchButton = wallet.isConnected && chainId !== MONAD_PARAMS.chainId;

  const handleSwitchMonad = async () => {
    setIsSwitching(true);
    try {
      await ensureMonadNetwork();
      // Don't need to do anything here - the chainChanged event will update the state
    } catch (err) {
      console.error('Failed to switch to Monad network:', err);
      alert('Failed to switch to Monad network. Please try again.');
    } finally {
      setIsSwitching(false);
    }
  };

  // Handler to create a new collection
  const handleNewCollection = () => {
    setCurrentCollection({
      id: Date.now().toString(),
      name: 'Untitled Collection',
      symbol: '',
      description: '',
      traits: [],
      totalSupply: 0,
      mintPrice: 0.1,
      royaltyPercentage: 5,
      isActive: false,
      createdAt: new Date(),
    });
    setPreviewNFT(null);
    setActiveTab('create');
    setNewCollectionKey(prev => prev + 1);
  };

  // Generate a random preview NFT
  const generatePreview = () => {
    if (!currentCollection || currentCollection.traits.length === 0) return;
    const categories = [
      'Background', 'Body', 'Eyes', 'Mouth', 'Accessories', 'Clothing', 'Hair', 'Special'
    ];
    const previewTraits: Trait[] = [];
    const selectedTraitIds: Record<string, string | null> = {};
    categories.forEach(category => {
      const categoryTraits = currentCollection.traits.filter(t => t.category === category);
      if (categoryTraits.length > 0) {
        const randomIndex = Math.floor(Math.random() * categoryTraits.length);
        const selectedTrait = categoryTraits[randomIndex];
        previewTraits.push(selectedTrait);
        selectedTraitIds[category] = selectedTrait.id;
      } else {
        selectedTraitIds[category] = null;
      }
    });
    setPreviewNFT({
      id: 'preview-' + Date.now() + '-' + Math.random(),
      traits: previewTraits,
      generatedAt: Date.now() // Use timestamp instead of Date object
    });
  };

  // Handler to trigger refresh after deployment
  const handleCollectionDeployed = () => {
    setCollectionsRefreshKey(prev => prev + 1);
  };

  // Cleanup function to clear corrupted data
  const clearCorruptedData = () => {
    try {
      localStorage.removeItem('importedAssets');
      localStorage.removeItem('currentCollection');
      localStorage.removeItem('previewNFT');
      console.log('Cleared corrupted data from localStorage');
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  };

  // Add cleanup on component mount
  useEffect(() => {
    // Clear any corrupted data on app start
    clearCorruptedData();
  }, []);

  return (
    <ErrorBoundary>
      <ImportedAssetsProvider>
    <Router>
      {/* Wallet Connect Button - absolute top right, always visible */}
      <div className="fixed top-6 right-8 z-50">
        <WalletConnectButton />
      </div>
      <Routes>
        <Route path="/" element={
      <div className="min-h-screen bg-gradient-to-br from-[#1a1333] to-[#2d225a]">
      {/* Wallet Connect Button - absolute top right */}
      <div className="w-full flex justify-end items-center pt-4 space-x-2">
        {showSwitchButton && (
          <button
            onClick={handleSwitchMonad}
            disabled={isSwitching}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg ml-2 font-bold transition-colors"
          >
            {isSwitching ? 'Switching...' : 'Switch to Monad'}
          </button>
        )}
      </div>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 relative"
        >
          <h1 className="text-4xl font-bold text-purple-400 mb-2 flex items-center justify-center space-x-3">
            <SparklesIcon />
            <span>Monad NFT Studio</span>
          </h1>
          <p className="text-purple-200 text-lg">
            Create, manage, and launch unique NFT collections with advanced rarity systems
          </p>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="glass-effect rounded-xl p-4">
              <h3 className="text-white font-semibold mb-4">Studio Tools</h3>
              {/* Tab Navigation */}
              <div className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-purple-600 text-white shadow-lg'
                          : 'text-purple-200 hover:bg-white/10'
                      }`}
                    >
                        <Icon />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
              {/* Quick Actions */}
              <div className="mt-6 pt-6 border-t border-white/20">
                <h4 className="text-white font-semibold mb-3">Quick Actions</h4>
                <div className="space-y-2">
                  <button className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
                    onClick={handleNewCollection}
                  >
                      <PlusIcon />
                    <span>New Collection</span>
                  </button>
                    <Link
                      to="/import-assets"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
                    >
                      <UploadIcon />
                    <span>Import Assets</span>
                    </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <div className="glass-effect rounded-xl p-6">
              {activeTab === 'create' && (
                      <CollectionDeployment key={newCollectionKey} onDeployed={handleCollectionDeployed} />
              )}
              {activeTab === 'rarity' && (
                  <Gallery />
              )}
              {activeTab === 'collections' && (
                <CollectionManager 
                        refreshKey={collectionsRefreshKey}
                />
              )}
            </div>
          </div>
        </div>
        {/* Preview Panel */}
        {previewNFT && (
          <div className="mt-6">
            <PreviewPanel nft={previewNFT} generatePreview={generatePreview} />
          </div>
        )}
      </div>
    </div>
        } />
            <Route path="/import-assets" element={<ImportAssets />} />
        <Route path="/collection/:address" element={<ManageCollection />} />
        <Route path="/collection/:address/edit" element={<EditCollectionMetadata />} />
        <Route path="/collection/:address/mint" element={<MintNFT />} />
        <Route path="/collection/:address/nfts" element={<CollectionNFTs />} />
        <Route path="/collection/:address/permissions" element={<Permissions />} />
      </Routes>
    </Router>
      </ImportedAssetsProvider>
    </ErrorBoundary>
  );
}

export default App;
