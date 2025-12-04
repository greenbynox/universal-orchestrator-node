import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  PlusIcon, 
  WalletIcon,
  ClipboardDocumentIcon,
  EyeIcon,
  EyeSlashIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { useStore } from '../store';
import { walletsApi } from '../services/api';
import { BlockchainType, BLOCKCHAIN_COLORS, BLOCKCHAIN_ICONS, BLOCKCHAIN_NAMES } from '../types';
import toast from 'react-hot-toast';

const blockchains: BlockchainType[] = ['bitcoin', 'ethereum', 'solana', 'monero', 'bnb'];

export default function WalletsPage() {
  const { wallets, addWallet, removeWallet } = useStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBlockchain, setSelectedBlockchain] = useState<BlockchainType>('bitcoin');
  const [walletName, setWalletName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showSeed, setShowSeed] = useState<string | null>(null);
  const [seedPassword, setSeedPassword] = useState('');
  const [revealedSeed, setRevealedSeed] = useState<string | null>(null);

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const wallet = await walletsApi.create({
        name: walletName || undefined,
        blockchain: selectedBlockchain,
      });
      addWallet(wallet);
      toast.success('Wallet créé avec succès!');
      setShowCreateModal(false);
      setWalletName('');
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (walletId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce wallet ?')) return;
    
    try {
      await walletsApi.delete(walletId);
      removeWallet(walletId);
      toast.success('Wallet supprimé');
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleRevealSeed = async (walletId: string) => {
    try {
      const seed = await walletsApi.exportSeed(walletId, seedPassword);
      setRevealedSeed(seed);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copié dans le presse-papiers');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Wallets</h1>
          <p className="text-dark-400 mt-1">{wallets.length} wallet(s) HD</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          <PlusIcon className="w-5 h-5" />
          Nouveau Wallet
        </button>
      </div>

      {/* Liste des wallets */}
      {wallets.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-dark-800 rounded-xl p-12 border border-dark-700 text-center"
        >
          <WalletIcon className="w-16 h-16 text-dark-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            Aucun wallet créé
          </h3>
          <p className="text-dark-400 mb-6">
            Créez votre premier wallet HD pour commencer
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary inline-flex"
          >
            <PlusIcon className="w-5 h-5" />
            Créer un Wallet
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {wallets.map((wallet, index) => (
            <motion.div
              key={wallet.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden"
            >
              {/* Header coloré */}
              <div
                className="h-2"
                style={{ backgroundColor: BLOCKCHAIN_COLORS[wallet.blockchain] }}
              />

              <div className="p-5">
                {/* Titre */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `${BLOCKCHAIN_COLORS[wallet.blockchain]}20` }}
                    >
                      {BLOCKCHAIN_ICONS[wallet.blockchain]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{wallet.name}</h3>
                      <p className="text-sm text-dark-400">{BLOCKCHAIN_NAMES[wallet.blockchain]}</p>
                    </div>
                  </div>
                </div>

                {/* Adresse */}
                <div className="bg-dark-900 rounded-lg p-3 mb-4">
                  <p className="text-xs text-dark-400 mb-1">Adresse</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-white font-mono truncate flex-1">
                      {wallet.address}
                    </p>
                    <button
                      onClick={() => copyToClipboard(wallet.address)}
                      className="p-1.5 rounded-lg hover:bg-dark-800 transition-colors"
                      title="Copier"
                    >
                      <ClipboardDocumentIcon className="w-4 h-4 text-dark-400" />
                    </button>
                  </div>
                </div>

                {/* Balance placeholder */}
                <div className="bg-dark-900 rounded-lg p-3 mb-4">
                  <p className="text-xs text-dark-400 mb-1">Solde</p>
                  <p className="text-lg font-semibold text-white">
                    {wallet.balance || '0.00'} {wallet.blockchain === 'bitcoin' ? 'BTC' : 
                      wallet.blockchain === 'ethereum' ? 'ETH' : 
                      wallet.blockchain === 'solana' ? 'SOL' :
                      wallet.blockchain === 'monero' ? 'XMR' : 'BNB'}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowSeed(wallet.id)}
                    className="flex-1 btn-secondary text-sm justify-center"
                  >
                    <EyeIcon className="w-4 h-4" />
                    Voir Seed
                  </button>
                  <button
                    onClick={() => handleDelete(wallet.id)}
                    className="btn-danger text-sm"
                    title="Supprimer"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal création wallet */}
      {showCreateModal && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-dark-800 rounded-2xl w-full max-w-md border border-dark-700 p-6"
            >
              <h2 className="text-xl font-semibold text-white mb-6">
                Créer un Wallet HD
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Nom (optionnel)
                  </label>
                  <input
                    type="text"
                    value={walletName}
                    onChange={(e) => setWalletName(e.target.value)}
                    placeholder="Mon wallet Bitcoin..."
                    className="input-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-3">
                    Blockchain
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {blockchains.map((bc) => (
                      <button
                        key={bc}
                        type="button"
                        onClick={() => setSelectedBlockchain(bc)}
                        className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                          selectedBlockchain === bc
                            ? 'border-primary-500 bg-primary-500/10'
                            : 'border-dark-600 hover:border-dark-500'
                        }`}
                      >
                        <span
                          className="text-2xl"
                          style={{ color: BLOCKCHAIN_COLORS[bc] }}
                        >
                          {BLOCKCHAIN_ICONS[bc]}
                        </span>
                        <span className="text-xs text-dark-300">
                          {BLOCKCHAIN_NAMES[bc].slice(0, 3)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 btn-secondary justify-center"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreate}
                  disabled={isCreating}
                  className="flex-1 btn-primary justify-center"
                >
                  {isCreating ? 'Création...' : 'Créer le Wallet'}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}

      {/* Modal affichage seed */}
      {showSeed && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={() => {
              setShowSeed(null);
              setRevealedSeed(null);
              setSeedPassword('');
            }}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-dark-800 rounded-2xl w-full max-w-md border border-dark-700 p-6"
            >
              <h2 className="text-xl font-semibold text-white mb-4">
                Seed Phrase
              </h2>

              <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-4">
                <p className="text-sm text-red-400">
                  ⚠️ Ne partagez JAMAIS votre seed phrase. Quiconque la possède peut accéder à vos fonds.
                </p>
              </div>

              {!revealedSeed ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">
                      Mot de passe pour révéler
                    </label>
                    <input
                      type="password"
                      value={seedPassword}
                      onChange={(e) => setSeedPassword(e.target.value)}
                      placeholder="Entrez votre mot de passe..."
                      className="input-base"
                    />
                  </div>
                  <button
                    onClick={() => handleRevealSeed(showSeed)}
                    disabled={seedPassword.length < 8}
                    className="w-full btn-danger justify-center"
                  >
                    <EyeSlashIcon className="w-5 h-5" />
                    Révéler la Seed
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-dark-900 rounded-lg p-4">
                    <p className="text-white font-mono text-sm leading-relaxed break-words">
                      {revealedSeed}
                    </p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(revealedSeed)}
                    className="w-full btn-secondary justify-center"
                  >
                    <ClipboardDocumentIcon className="w-5 h-5" />
                    Copier la Seed
                  </button>
                </div>
              )}

              <button
                onClick={() => {
                  setShowSeed(null);
                  setRevealedSeed(null);
                  setSeedPassword('');
                }}
                className="w-full btn-secondary justify-center mt-4"
              >
                Fermer
              </button>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}
