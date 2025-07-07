import React, { createContext, useContext, useEffect, useState } from 'react';
import { ethers, Signer } from 'ethers';
import EthereumProvider from '@walletconnect/ethereum-provider';

export interface WalletInfo {
  address: string;
  balance: string;
  chainId: number;
  isConnected: boolean;
  provider: ethers.providers.Web3Provider | null;
  signer: Signer | null;
}

interface WalletContextType {
  wallet: WalletInfo;
  connectWallet: (walletType?: string) => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: (chainId: number) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

interface WalletProviderProps {
  children: React.ReactNode;
}

const WALLETCONNECT_PROJECT_ID = '6b9d177bf515235717cbe18feecda11e';

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [wallet, setWallet] = useState<WalletInfo>({
    address: '',
    balance: '0',
    chainId: 1,
    isConnected: false,
    provider: null,
    signer: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if wallet is already connected on mount
  useEffect(() => {
    checkExistingConnection();
  }, []);

  const checkExistingConnection = async () => {
    try {
      // Check for MetaMask
      if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          await connectWallet('metamask');
        }
      }
    } catch (err) {
      console.log('No existing wallet connection');
    }
  };

  const detectAvailableWallets = () => {
    const wallets = [];
    if (typeof window !== 'undefined' && window.ethereum) {
      if (window.ethereum.isMetaMask) wallets.push('metamask');
      if (window.ethereum.isRabby) wallets.push('rabby');
      if (window.ethereum.isOkxWallet) wallets.push('okx');
      if (window.ethereum.isBackpack) wallets.push('backpack');
      if (window.ethereum.isPhantom) wallets.push('phantom');
      if (window.ethereum.isHahaWallet) wallets.push('haha');
    }
    wallets.push('walletconnect'); // Always offer WalletConnect
    return wallets;
  };

  const connectWallet = async (walletType?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      let provider: ethers.providers.Web3Provider | null = null;
      let selectedWallet = walletType;
      const availableWallets = detectAvailableWallets();
      if (!selectedWallet) {
        // Auto-pick: prefer MetaMask, Rabby, OKX, Backpack, Phantom, Haha, else WalletConnect
        selectedWallet = availableWallets[0];
      }
      switch (selectedWallet) {
        case 'metamask': provider = await connectMetaMask(); break;
        case 'rabby': provider = await connectRabby(); break;
        case 'okx': provider = await connectOKX(); break;
        case 'backpack': provider = await connectBackpack(); break;
        case 'phantom': provider = await connectPhantom(); break;
        case 'haha': provider = await connectHaha(); break;
        case 'walletconnect': provider = await connectWalletConnect(); break;
        default: throw new Error('No supported wallet found');
      }
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();
      setWallet({
        address,
        balance: '0',
        chainId: network.chainId,
        isConnected: true,
        provider,
        signer,
      });
      // Listen for account/network changes
      const prov: any = provider.provider;
      if (prov && typeof prov.on === 'function') {
        prov.on('accountsChanged', handleAccountsChanged);
        prov.on('chainChanged', handleChainChanged);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
      disconnectWallet();
    } finally {
      setIsLoading(false);
    }
  };

  const connectMetaMask = async (): Promise<ethers.providers.Web3Provider> => {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed');
    }
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send('eth_requestAccounts', []);
    return provider;
  };

  const connectRabby = async (): Promise<ethers.providers.Web3Provider> => {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('Rabby Wallet is not installed');
    }
    // Check if Rabby is the active wallet
    if (!window.ethereum.isRabby) {
      throw new Error('Please switch to Rabby Wallet in your browser');
    }
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send('eth_requestAccounts', []);
    return provider;
  };

  const connectBackpack = async (): Promise<ethers.providers.Web3Provider> => {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('Backpack is not installed');
    }
    // Check if Backpack is the active wallet
    if (!window.ethereum.isBackpack) {
      throw new Error('Please switch to Backpack in your browser');
    }
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send('eth_requestAccounts', []);
    return provider;
  };

  const connectPhantom = async (): Promise<ethers.providers.Web3Provider> => {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('Phantom is not installed');
    }
    // Check if Phantom is the active wallet
    if (!window.ethereum.isPhantom) {
      throw new Error('Please switch to Phantom in your browser');
    }
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send('eth_requestAccounts', []);
    return provider;
  };

  const connectOKX = async (): Promise<ethers.providers.Web3Provider> => {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('OKX Web3 is not installed');
    }
    // Check if OKX is the active wallet
    if (!window.ethereum.isOkxWallet) {
      throw new Error('Please switch to OKX Web3 in your browser');
    }
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send('eth_requestAccounts', []);
    return provider;
  };

  const connectHaha = async (): Promise<ethers.providers.Web3Provider> => {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('Haha Wallet is not installed');
    }
    // Check if Haha is the active wallet
    if (!window.ethereum.isHahaWallet) {
      throw new Error('Please switch to Haha Wallet in your browser');
    }
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send('eth_requestAccounts', []);
    return provider;
  };

  const connectWalletConnect = async (): Promise<ethers.providers.Web3Provider> => {
    // WalletConnect v2 integration
    const provider = await EthereumProvider.init({
      projectId: WALLETCONNECT_PROJECT_ID,
      chains: [10143], // Monad Testnet chainId
      showQrModal: true,
      rpcMap: {
        10143: 'https://testnet-rpc.monad.xyz',
      },
    });
    await provider.enable();
    return new ethers.providers.Web3Provider(provider);
  };

  const handleAccountsChanged = async (accounts: string[]) => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      // Update the address
      setWallet(prev => ({
        ...prev,
        address: accounts[0],
      }));
    }
  };

  const handleChainChanged = async (chainId: string) => {
    // Just update wallet state, do NOT reload
    setWallet(prev => ({
      ...prev,
      chainId: parseInt(chainId, 16),
    }));
    // Optionally, show a toast or update UI
  };

  const disconnectWallet = () => {
    setWallet({
      address: '',
      balance: '0',
      chainId: 1,
      isConnected: false,
      provider: null,
      signer: null,
    });
    setError(null);

    // Remove event listeners
    if (window.ethereum) {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    }
  };

  const switchNetwork = async (chainId: number) => {
    if (!wallet.provider) {
      throw new Error('No wallet connected');
    }

    try {
      await wallet.provider.send('wallet_switchEthereumChain', [
        { chainId: `0x${chainId.toString(16)}` },
      ]);
    } catch (err: any) {
      if (err.code === 4902) {
        // Chain not added, add it
        await wallet.provider.send('wallet_addEthereumChain', [
          {
            chainId: `0x${chainId.toString(16)}`,
            chainName: getChainName(chainId),
            nativeCurrency: {
              name: getChainCurrency(chainId),
              symbol: getChainSymbol(chainId),
              decimals: 18,
            },
            rpcUrls: [getChainRPC(chainId)],
            blockExplorerUrls: [getChainExplorer(chainId)],
          },
        ]);
      } else {
        throw err;
      }
    }
  };

  const getChainName = (chainId: number): string => {
    switch (chainId) {
      case 1: return 'Ethereum Mainnet';
      case 5: return 'Goerli Testnet';
      case 137: return 'Polygon Mainnet';
      case 80001: return 'Mumbai Testnet';
      case 56: return 'BNB Smart Chain';
      case 97: return 'BNB Smart Chain Testnet';
      default: return 'Unknown Network';
    }
  };

  const getChainCurrency = (chainId: number): string => {
    switch (chainId) {
      case 1: return 'Ether';
      case 5: return 'Goerli Ether';
      case 137: return 'MATIC';
      case 80001: return 'MATIC';
      case 56: return 'BNB';
      case 97: return 'tBNB';
      default: return 'ETH';
    }
  };

  const getChainSymbol = (chainId: number): string => {
    switch (chainId) {
      case 1: return 'ETH';
      case 5: return 'ETH';
      case 137: return 'MATIC';
      case 80001: return 'MATIC';
      case 56: return 'BNB';
      case 97: return 'tBNB';
      default: return 'ETH';
    }
  };

  const getChainRPC = (chainId: number): string => {
    switch (chainId) {
      case 1: return 'https://eth-mainnet.alchemyapi.io/v2/your-api-key';
      case 5: return 'https://eth-goerli.alchemyapi.io/v2/your-api-key';
      case 137: return 'https://polygon-rpc.com';
      case 80001: return 'https://rpc-mumbai.maticvigil.com';
      case 56: return 'https://bsc-dataseed.binance.org';
      case 97: return 'https://data-seed-prebsc-1-s1.binance.org:8545';
      default: return 'https://eth-mainnet.alchemyapi.io/v2/your-api-key';
    }
  };

  const getChainExplorer = (chainId: number): string => {
    switch (chainId) {
      case 1: return 'https://etherscan.io';
      case 5: return 'https://goerli.etherscan.io';
      case 137: return 'https://polygonscan.com';
      case 80001: return 'https://mumbai.polygonscan.com';
      case 56: return 'https://bscscan.com';
      case 97: return 'https://testnet.bscscan.com';
      default: return 'https://etherscan.io';
    }
  };

  return (
    <WalletContext.Provider
      value={{
        wallet,
        connectWallet,
        disconnectWallet,
        switchNetwork,
        isLoading,
        error,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}; 