import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Contract } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import MonadNFTCollectionArtifact from '../abi/MonadNFTCollection.json';

const Permissions: React.FC = () => {
  const { address } = useParams<{ address: string }>();
  const navigate = useNavigate();
  const { wallet } = useWallet();
  const [owner, setOwner] = useState<string | null>(null);
  const [signers, setSigners] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [signersLoading, setSignersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signersError, setSignersError] = useState<string | null>(null);
  const [addSignerAddress, setAddSignerAddress] = useState('');
  const [addSignerLoading, setAddSignerLoading] = useState(false);
  const [addSignerError, setAddSignerError] = useState<string | null>(null);
  const [addSignerSuccess, setAddSignerSuccess] = useState<string | null>(null);
  const [removeSignerLoading, setRemoveSignerLoading] = useState<string | null>(null); // address being removed
  const [removeSignerError, setRemoveSignerError] = useState<string | null>(null);
  const [removeSignerSuccess, setRemoveSignerSuccess] = useState<string | null>(null);
  const [paused, setPaused] = useState<boolean | null>(null);
  const [pauseLoading, setPauseLoading] = useState(false);
  const [pauseError, setPauseError] = useState<string | null>(null);
  const [pauseSuccess, setPauseSuccess] = useState<string | null>(null);
  const [admins, setAdmins] = useState<string[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [adminsError, setAdminsError] = useState<string | null>(null);
  const [addAdminAddress, setAddAdminAddress] = useState('');
  const [addAdminLoading, setAddAdminLoading] = useState(false);
  const [addAdminError, setAddAdminError] = useState<string | null>(null);
  const [addAdminSuccess, setAddAdminSuccess] = useState<string | null>(null);
  const [removeAdminLoading, setRemoveAdminLoading] = useState<string | null>(null);
  const [removeAdminError, setRemoveAdminError] = useState<string | null>(null);
  const [removeAdminSuccess, setRemoveAdminSuccess] = useState<string | null>(null);

  // Fetch owner
  useEffect(() => {
    const fetchOwner = async () => {
      if (!address || !wallet.provider) return;
      setLoading(true);
      setError(null);
      try {
        const contract = new Contract(address, MonadNFTCollectionArtifact.abi, wallet.provider);
        const ownerAddr = await contract.owner();
        setOwner(ownerAddr);
      } catch (err: any) {
        setError('Failed to fetch owner address');
      } finally {
        setLoading(false);
      }
    };
    fetchOwner();
  }, [address, wallet.provider]);

  // Fetch signers
  const refreshSigners = async () => {
    if (!address || !wallet.provider) return;
    setSignersLoading(true);
    setSignersError(null);
    try {
      const contract = new Contract(address, MonadNFTCollectionArtifact.abi, wallet.provider);
      const signersList = await contract.getSigners();
      setSigners(signersList);
    } catch (err: any) {
      setSignersError('Failed to fetch signers');
    } finally {
      setSignersLoading(false);
    }
  };
  useEffect(() => { refreshSigners(); }, [address, wallet.provider, addSignerSuccess, removeSignerSuccess]);

  // Fetch pause status
  const refreshPaused = async () => {
    if (!address || !wallet.provider) return;
    setPauseLoading(true);
    setPauseError(null);
    try {
      const contract = new Contract(address, MonadNFTCollectionArtifact.abi, wallet.provider);
      const isPaused = await contract.paused();
      setPaused(isPaused);
    } catch (err: any) {
      setPauseError('Failed to fetch pause status');
    } finally {
      setPauseLoading(false);
    }
  };
  useEffect(() => { refreshPaused(); }, [address, wallet.provider, pauseSuccess]);

  // Fetch admins
  const refreshAdmins = async () => {
    if (!address || !wallet.provider) return;
    setAdminsLoading(true);
    setAdminsError(null);
    try {
      const contract = new Contract(address, MonadNFTCollectionArtifact.abi, wallet.provider);
      const adminsList = await contract.getAdmins();
      setAdmins(adminsList);
    } catch (err: any) {
      setAdminsError('Failed to fetch admins');
    } finally {
      setAdminsLoading(false);
    }
  };
  useEffect(() => { refreshAdmins(); }, [address, wallet.provider, addAdminSuccess, removeAdminSuccess]);

  // Add signer
  const handleAddSigner = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddSignerLoading(true);
    setAddSignerError(null);
    setAddSignerSuccess(null);
    try {
      if (!wallet.signer) throw new Error('Connect your wallet');
      if (!address) throw new Error('No collection address');
      const contract = new Contract(address, MonadNFTCollectionArtifact.abi, wallet.signer);
      const tx = await contract.addSigner(addSignerAddress);
      await tx.wait();
      setAddSignerSuccess('Signer added successfully!');
      setAddSignerAddress('');
      refreshSigners();
    } catch (err: any) {
      setAddSignerError(err.reason || err.message || 'Failed to add signer');
    } finally {
      setAddSignerLoading(false);
    }
  };

  // Remove signer
  const handleRemoveSigner = async (signerAddr: string) => {
    setRemoveSignerLoading(signerAddr);
    setRemoveSignerError(null);
    setRemoveSignerSuccess(null);
    try {
      if (!wallet.signer) throw new Error('Connect your wallet');
      if (!address) throw new Error('No collection address');
      const contract = new Contract(address, MonadNFTCollectionArtifact.abi, wallet.signer);
      const tx = await contract.removeSigner(signerAddr);
      await tx.wait();
      setRemoveSignerSuccess('Signer removed successfully!');
      refreshSigners();
    } catch (err: any) {
      setRemoveSignerError(err.reason || err.message || 'Failed to remove signer');
    } finally {
      setRemoveSignerLoading(null);
    }
  };

  // Pause/unpause
  const handlePauseToggle = async () => {
    setPauseLoading(true);
    setPauseError(null);
    setPauseSuccess(null);
    try {
      if (!wallet.signer) throw new Error('Connect your wallet');
      if (!address) throw new Error('No collection address');
      const contract = new Contract(address, MonadNFTCollectionArtifact.abi, wallet.signer);
      let tx;
      if (paused) {
        tx = await contract.unpause();
      } else {
        tx = await contract.pause();
      }
      await tx.wait();
      setPauseSuccess(paused ? 'Contract unpaused!' : 'Contract paused!');
      refreshPaused();
    } catch (err: any) {
      setPauseError(err.reason || err.message || 'Failed to change pause status');
    } finally {
      setPauseLoading(false);
    }
  };

  // Add admin
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddAdminLoading(true);
    setAddAdminError(null);
    setAddAdminSuccess(null);
    try {
      if (!wallet.signer) throw new Error('Connect your wallet');
      if (!address) throw new Error('No collection address');
      const contract = new Contract(address, MonadNFTCollectionArtifact.abi, wallet.signer);
      const tx = await contract.addAdmin(addAdminAddress);
      await tx.wait();
      setAddAdminSuccess('Admin added successfully!');
      setAddAdminAddress('');
      refreshAdmins();
    } catch (err: any) {
      setAddAdminError(err.reason || err.message || 'Failed to add admin');
    } finally {
      setAddAdminLoading(false);
    }
  };

  // Remove admin
  const handleRemoveAdmin = async (adminAddr: string) => {
    setRemoveAdminLoading(adminAddr);
    setRemoveAdminError(null);
    setRemoveAdminSuccess(null);
    try {
      if (!wallet.signer) throw new Error('Connect your wallet');
      if (!address) throw new Error('No collection address');
      const contract = new Contract(address, MonadNFTCollectionArtifact.abi, wallet.signer);
      const tx = await contract.removeAdmin(adminAddr);
      await tx.wait();
      setRemoveAdminSuccess('Admin removed successfully!');
      refreshAdmins();
    } catch (err: any) {
      setRemoveAdminError(err.reason || err.message || 'Failed to remove admin');
    } finally {
      setRemoveAdminLoading(null);
    }
  };

  // Role info
  const roleInfo = (
    <div>
      <p className="mb-2">Roles in this collection:</p>
      <ul className="list-disc ml-6 text-sm">
        <li><span className="font-semibold text-blue-200">Owner/Admin</span>: Can add/remove signers, pause/unpause, and modify collection settings.</li>
        <li><span className="font-semibold text-blue-200">Signer</span>: Can mint NFTs and update NFT metadata, but cannot change roles or pause the contract.</li>
        <li><span className="font-semibold text-blue-200">Paused</span>: When paused, only the owner can unpause. All minting and transfers are disabled.</li>
      </ul>
    </div>
  );

  const isOwner = wallet.address && owner && wallet.address.toLowerCase() === owner.toLowerCase();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1333] to-[#2d225a] text-white p-8 flex flex-col items-center">
      <button
        className="absolute top-6 left-6 flex items-center bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg transition-colors z-10"
        onClick={() => navigate(-1)}
        title="Back"
      >
        &#8592; Back
      </button>
      <h1 className="text-3xl font-bold mb-8">Collection Permissions</h1>
      <div className="max-w-2xl w-full space-y-6">
        <div className="bg-white/10 rounded-lg p-6">
          <strong>Owner/Admin:</strong>{' '}
          {loading ? <span className="text-purple-300">Loading...</span> : error ? <span className="text-red-400">{error}</span> : <span className="font-mono text-blue-200">{owner}</span>}
        </div>
        <div className="bg-white/10 rounded-lg p-6">
          <strong>Signers:</strong>
          {signersLoading ? (
            <span className="text-purple-300 ml-2">Loading...</span>
          ) : signersError ? (
            <span className="text-red-400 ml-2">{signersError}</span>
          ) : signers.length === 0 ? (
            <span className="text-purple-300 ml-2">No signers</span>
          ) : (
            <ul className="list-disc ml-6">
              {signers.map(addr => (
                <li key={addr} className="font-mono text-blue-200 flex items-center gap-2">
                  {addr}
                  {isOwner && (
                    <button
                      className="ml-2 px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
                      disabled={removeSignerLoading === addr}
                      onClick={() => handleRemoveSigner(addr)}
                    >
                      {removeSignerLoading === addr ? 'Removing...' : 'Remove'}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {removeSignerError && <div className="text-red-400 mt-2">{removeSignerError}</div>}
          {removeSignerSuccess && <div className="text-green-400 mt-2">{removeSignerSuccess}</div>}
        </div>
        <div className="bg-white/10 rounded-lg p-6">
          <strong>Admins:</strong>
          {adminsLoading ? (
            <span className="text-purple-300 ml-2">Loading...</span>
          ) : adminsError ? (
            <span className="text-red-400 ml-2">{adminsError}</span>
          ) : admins.length === 0 ? (
            <span className="text-purple-300 ml-2">No admins</span>
          ) : (
            <ul className="list-disc ml-6">
              {admins.map(addr => (
                <li key={addr} className="font-mono text-blue-200 flex items-center gap-2">
                  {addr}
                  {isOwner && (
                    <button
                      className="ml-2 px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
                      disabled={removeAdminLoading === addr}
                      onClick={() => handleRemoveAdmin(addr)}
                    >
                      {removeAdminLoading === addr ? 'Removing...' : 'Remove'}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {removeAdminError && <div className="text-red-400 mt-2">{removeAdminError}</div>}
          {removeAdminSuccess && <div className="text-green-400 mt-2">{removeAdminSuccess}</div>}
        </div>
        <div className="bg-white/10 rounded-lg p-6">
          <strong>Add Signer:</strong>
          {isOwner ? (
            <form onSubmit={handleAddSigner} className="flex gap-2 mt-2">
              <input
                type="text"
                className="p-2 rounded bg-white/10 text-white font-mono flex-1"
                placeholder="Signer address (0x...)"
                value={addSignerAddress}
                onChange={e => setAddSignerAddress(e.target.value)}
                required
                pattern="^0x[a-fA-F0-9]{40}$"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                disabled={addSignerLoading}
              >
                {addSignerLoading ? 'Adding...' : 'Add'}
              </button>
            </form>
          ) : (
            <span className="text-purple-300 ml-2">Only the owner can add signers.</span>
          )}
          {addSignerError && <div className="text-red-400 mt-2">{addSignerError}</div>}
          {addSignerSuccess && <div className="text-green-400 mt-2">{addSignerSuccess}</div>}
        </div>
        <div className="bg-white/10 rounded-lg p-6">
          <strong>Add Admin:</strong>
          {isOwner ? (
            <form onSubmit={handleAddAdmin} className="flex gap-2 mt-2">
              <input
                type="text"
                className="p-2 rounded bg-white/10 text-white font-mono flex-1"
                placeholder="Admin address (0x...)"
                value={addAdminAddress}
                onChange={e => setAddAdminAddress(e.target.value)}
                required
                pattern="^0x[a-fA-F0-9]{40}$"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                disabled={addAdminLoading}
              >
                {addAdminLoading ? 'Adding...' : 'Add'}
              </button>
            </form>
          ) : (
            <span className="text-purple-300 ml-2">Only the owner can add admins.</span>
          )}
          {addAdminError && <div className="text-red-400 mt-2">{addAdminError}</div>}
          {addAdminSuccess && <div className="text-green-400 mt-2">{addAdminSuccess}</div>}
        </div>
        <div className="bg-white/10 rounded-lg p-6">
          <strong>Pause Status:</strong>{' '}
          {pauseLoading && paused === null ? (
            <span className="text-purple-300">Loading...</span>
          ) : pauseError ? (
            <span className="text-red-400">{pauseError}</span>
          ) : paused ? (
            <span className="text-yellow-400 font-semibold">Paused</span>
          ) : (
            <span className="text-green-400 font-semibold">Active</span>
          )}
        </div>
        <div className="bg-white/10 rounded-lg p-6">
          <strong>Pause/Unpause:</strong>
          {isOwner ? (
            <button
              className={`px-4 py-2 rounded font-bold ${paused ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'} text-white`}
              onClick={handlePauseToggle}
              disabled={pauseLoading}
            >
              {pauseLoading ? (paused ? 'Unpausing...' : 'Pausing...') : paused ? 'Unpause Contract' : 'Pause Contract'}
            </button>
          ) : (
            <span className="text-purple-300 ml-2">Only the owner can pause/unpause.</span>
          )}
          {pauseError && <div className="text-red-400 mt-2">{pauseError}</div>}
          {pauseSuccess && <div className="text-green-400 mt-2">{pauseSuccess}</div>}
        </div>
        <div className="bg-white/10 rounded-lg p-6">
          <strong>Role Info:</strong>
          {roleInfo}
        </div>
      </div>
    </div>
  );
};

export default Permissions; 