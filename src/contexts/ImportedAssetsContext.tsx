import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useWallet } from './WalletContext';

export interface ImportedAsset {
  image?: string;
  name?: string;
  description?: string;
  attributes?: any[];
  [key: string]: any;
}

interface ImportedAssetsContextType {
  assets: ImportedAsset[];
  setAssets: React.Dispatch<React.SetStateAction<ImportedAsset[]>>;
  clearCorruptedData: () => void;
  walletAddress: string;
  setWalletAddress: (address: string) => void;
}

const ImportedAssetsContext = createContext<ImportedAssetsContextType | undefined>(undefined);

export const ImportedAssetsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { wallet } = useWallet();
  const [walletAddress, setWalletAddress] = useState<string>(wallet.address || '');
  const [assets, setAssets] = useState<ImportedAsset[]>([]);

  // Helper to get the localStorage key for the current wallet
  const getStorageKey = useCallback((address: string) => {
    return address ? `importedAssets_${address.toLowerCase()}` : 'importedAssets_';
  }, []);

  // Load assets from localStorage when walletAddress changes
  useEffect(() => {
    if (!walletAddress) {
      setAssets([]);
      return;
    }
    try {
      const stored = localStorage.getItem(getStorageKey(walletAddress));
      if (!stored) {
        setAssets([]);
        return;
      }
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) {
        localStorage.removeItem(getStorageKey(walletAddress));
        setAssets([]);
        return;
      }
      const validAssets = parsed.filter((asset: any) => asset && typeof asset === 'object');
      if (validAssets.length !== parsed.length) {
        localStorage.setItem(getStorageKey(walletAddress), JSON.stringify(validAssets));
      }
      setAssets(validAssets);
    } catch (error) {
      localStorage.removeItem(getStorageKey(walletAddress));
      setAssets([]);
    }
  }, [walletAddress, getStorageKey]);

  // Save assets to localStorage when assets or walletAddress changes
  useEffect(() => {
    if (!walletAddress) return;
    try {
      localStorage.setItem(getStorageKey(walletAddress), JSON.stringify(assets));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error saving assets to localStorage:', error);
    }
  }, [assets, walletAddress, getStorageKey]);

  // Update walletAddress when wallet changes
  useEffect(() => {
    setWalletAddress(wallet.address || '');
  }, [wallet.address]);

  const clearCorruptedData = () => {
    if (walletAddress) {
      localStorage.removeItem(getStorageKey(walletAddress));
    }
    setAssets([]);
  };

  return (
    <ImportedAssetsContext.Provider value={{ assets, setAssets, clearCorruptedData, walletAddress, setWalletAddress }}>
      {children}
    </ImportedAssetsContext.Provider>
  );
};

export const useImportedAssets = () => {
  const context = useContext(ImportedAssetsContext);
  if (!context) throw new Error('useImportedAssets must be used within an ImportedAssetsProvider');
  return context;
}; 