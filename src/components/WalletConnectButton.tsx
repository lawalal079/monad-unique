import React, { useState, useRef, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import mmIcon from '../assets/wallet-icons/mm-removebg-preview.png';
import rabbyIcon from '../assets/wallet-icons/rabby-removebg-preview.png';
import okxIcon from '../assets/wallet-icons/Okx-removebg-preview.png';
import backpackIcon from '../assets/wallet-icons/backpack-removebg-preview.png';
import phantomIcon from '../assets/wallet-icons/phantom.png';
import hahaIcon from '../assets/wallet-icons/haha.png';
import gateIcon from '../assets/wallet-icons/gate-removebg-preview.png';
import tokenpocketIcon from '../assets/wallet-icons/tokenpocket-removebg-preview.png';
import hotIcon from '../assets/wallet-icons/hot-removebg-preview.png';
import bitgetIcon from '../assets/wallet-icons/bitget.png';

// Simple SVG Icons to replace lucide-react
const LogOutIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16,17 21,12 16,7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);

const CopyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20,6 9,17 4,12"></polyline>
  </svg>
);

// Add SVG icons for known wallets
const WALLET_ICONS: Record<string, React.ReactNode> = {
  metamask: <img src={mmIcon} alt="MetaMask" className="inline w-5 h-5 align-middle" />,
  rabby: <img src={rabbyIcon} alt="Rabby" className="inline w-5 h-5 align-middle" />,
  okx: <img src={okxIcon} alt="OKX" className="inline w-5 h-5 align-middle" />,
  backpack: <img src={backpackIcon} alt="Backpack" className="inline w-5 h-5 align-middle" />,
  phantom: <img src={phantomIcon} alt="Phantom" className="inline w-5 h-5 align-middle" />,
  haha: <img src={hahaIcon} alt="Haha" className="inline w-5 h-5 align-middle" />,
  gate: <img src={gateIcon} alt="Gate.io" className="inline w-5 h-5 align-middle" />,
  tokenpocket: <img src={tokenpocketIcon} alt="TokenPocket" className="inline w-5 h-5 align-middle" />,
  hot: <img src={hotIcon} alt="Hot Wallet" className="inline w-5 h-5 align-middle" />,
  bitget: <img src={bitgetIcon} alt="Bitget Web3" className="inline w-5 h-5 align-middle" />,
  walletconnect: (
    <svg width="20" height="20" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#3B99FC"/><text x="16" y="21" textAnchor="middle" fontSize="13" fill="#fff">WC</text></svg>
  ),
};

const KNOWN_WALLETS = [
  'metamask', 'rabby', 'okx', 'backpack', 'phantom', 'haha', 'gate', 'tokenpocket', 'hot', 'bitget'
];

const WALLET_LABELS: Record<string, string> = {
  metamask: 'MetaMask',
  rabby: 'Rabby',
  okx: 'OKX Wallet',
  backpack: 'Backpack',
  phantom: 'Phantom',
  haha: 'Haha Wallet',
  gate: 'Gate.io Wallet',
  tokenpocket: 'TokenPocket',
  hot: 'Hot Wallet',
  bitget: 'Bitget Web3',
  walletconnect: 'WalletConnect (QR Code, Mobile, etc.)',
};

const getWalletLabel = (key: string) => WALLET_LABELS[key] || key.charAt(0).toUpperCase() + key.slice(1) + ' Wallet';
const getWalletIcon = (key: string) => WALLET_ICONS[key] || (
  <svg width="20" height="20" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#888"/><text x="16" y="21" textAnchor="middle" fontSize="13" fill="#fff">W</text></svg>
);

const WalletConnectButton: React.FC = () => {
  const { wallet, connectWallet, disconnectWallet, isLoading, error } = useWallet();
  const [showModal, setShowModal] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Dynamic detection of all extension wallets
  const detectAvailableWallets = () => {
    const wallets: string[] = [];
    if (typeof window !== 'undefined' && window.ethereum) {
      for (const key in window.ethereum) {
        if (
          key.startsWith('is') &&
          window.ethereum[key] === true &&
          key !== 'isWalletConnect'
        ) {
          const walletKey = key.slice(2).toLowerCase();
          if (KNOWN_WALLETS.includes(walletKey)) {
            wallets.push(walletKey);
          }
        }
      }
    }
    wallets.push('walletconnect'); // Always offer WalletConnect
    return wallets;
  };

  const availableWallets = detectAvailableWallets();

  const handleConnect = async (walletType: string) => {
    setConnecting(walletType);
    setConnectError(null);
    try {
      await connectWallet(walletType);
      setShowModal(false);
    } catch (err: any) {
      setConnectError(err.message || 'Failed to connect');
    } finally {
      setConnecting(null);
    }
  };

  // Dropdown logic for connected wallet
  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(wallet.address);
    setDropdownOpen(false);
  };

  if (wallet.isConnected) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          className="bg-purple-700 hover:bg-purple-800 text-white px-4 py-2 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          onClick={() => setDropdownOpen((v) => !v)}
        >
          {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
        </button>
        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-40 bg-[#1a1333] border border-purple-400 rounded-lg shadow-lg z-50">
            <button
              className="w-full text-left px-4 py-2 hover:bg-purple-800 text-white rounded-t-lg"
              onClick={handleCopy}
            >
              Copy Address
            </button>
            <button
              className="w-full text-left px-4 py-2 hover:bg-purple-800 text-white rounded-b-lg"
              onClick={() => { disconnectWallet(); setDropdownOpen(false); }}
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold"
        onClick={() => setShowModal(true)}
        disabled={isLoading}
      >
        Connect Wallet
      </button>
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-[#1a1333] border border-purple-400 rounded-xl p-8 w-full max-w-xs mx-auto flex flex-col items-center">
            <h2 className="text-lg font-bold text-purple-400 mb-4">Select Wallet</h2>
            <div className="flex flex-col gap-3 w-full">
              {availableWallets.map((w) => (
                <button
                  key={w}
                  className={`w-full px-4 py-2 rounded-lg border border-white/20 text-white font-semibold transition-colors ${connecting === w ? 'bg-purple-700' : 'bg-white/10 hover:bg-purple-800/30'}`}
                  onClick={() => handleConnect(w)}
                  disabled={!!connecting}
                >
                  {getWalletIcon(w)} <span className="ml-2">{getWalletLabel(w)}</span>
                  {connecting === w && ' (Connecting...)'}
                </button>
              ))}
            </div>
            {connectError && <div className="text-red-400 mt-4 text-sm">{connectError}</div>}
            <button
              className="mt-6 text-purple-300 hover:underline text-sm"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default WalletConnectButton; 