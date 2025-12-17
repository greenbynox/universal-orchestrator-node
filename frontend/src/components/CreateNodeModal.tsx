import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { BlockchainType, NodeMode, BLOCKCHAIN_COLORS, BLOCKCHAIN_ICONS, BLOCKCHAIN_NAMES } from '../types';
import { nodesApi } from '../services/api';
import { useStore } from '../store';
import toast from 'react-hot-toast';

interface CreateNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultBlockchain?: BlockchainType;
  defaultMode?: NodeMode;
}

// Default blockchains (fallback)
const defaultBlockchains: BlockchainType[] = ['bitcoin', 'ethereum', 'solana', 'monero', 'bnb'];
const modes: { value: NodeMode; label: string; description: string }[] = [
  { value: 'full', label: 'Full Node', description: 'Blockchain complète, plus d\'espace requis' },
  { value: 'pruned', label: 'Pruned', description: 'Blockchain élaguée, moins d\'espace' },
  { value: 'light', label: 'Light', description: 'Mode léger, synchronisation rapide' },
];

export default function CreateNodeModal({ isOpen, onClose, defaultBlockchain = 'bitcoin', defaultMode = 'pruned' }: CreateNodeModalProps) {
  const [name, setName] = useState('');
  const [blockchain, setBlockchain] = useState<BlockchainType>(defaultBlockchain);
  const [mode, setMode] = useState<NodeMode>(defaultMode);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  // Use blockchains from store (already loaded by App.tsx)
  const { addNode, blockchains: storeBlockchains } = useStore();
  const blockchains = storeBlockchains;

  const isStoreLoaded = blockchains.length > 0;
  const supportedCount = isStoreLoaded ? blockchains.filter((bc: any) => bc?.nodeSupported === true).length : 0;

  const selectedChain = blockchains.find((bc: any) => bc?.id === blockchain);
  const supportedModes: NodeMode[] = useMemo(
    () => (selectedChain?.nodeSupportedModes as NodeMode[]) || ['full', 'pruned', 'light'],
    [selectedChain]
  );

  useEffect(() => {
    if (isOpen) {
      setBlockchain(defaultBlockchain);
      setMode(defaultMode);
    }
  }, [defaultBlockchain, defaultMode, isOpen]);

  useEffect(() => {
    // If selected blockchain doesn't support the currently selected mode, pick a supported one.
    if (supportedModes.length > 0 && !supportedModes.includes(mode)) {
      setMode(supportedModes[0]);
    }
  }, [blockchain, mode, supportedModes]);

  // Filter blockchains by search (catalog) - show unsupported as disabled.
  const filteredBlockchains = isStoreLoaded
    ? blockchains
        .filter((bc: any) => {
          const q = searchTerm.trim().toLowerCase();
          if (!q) return true;
          return (
            bc.name?.toLowerCase().includes(q) ||
            bc.symbol?.toLowerCase().includes(q) ||
            bc.id?.toLowerCase().includes(q)
          );
        })
        .slice(0, 30) // Show max 30 at a time
    : defaultBlockchains.map(id => ({ id, name: BLOCKCHAIN_NAMES[id], symbol: id.toUpperCase(), nodeSupported: true }));

  const hasNoMatches = isStoreLoaded && filteredBlockchains.length === 0 && searchTerm.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const newNode = await nodesApi.create({ name: name || undefined, blockchain, mode });
      addNode(newNode);  // Update store immediately
      toast.success('Node créé avec succès!');
      onClose();
      setName('');
      setSearchTerm('');
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-dark-800 rounded-2xl w-full max-w-lg border border-dark-700 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-dark-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-600/20 flex items-center justify-center">
                    <PlusIcon className="w-5 h-5 text-primary-500" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">Créer un Node</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-dark-700 transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-dark-400" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Nom */}
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Nom du node (optionnel)
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Mon node Bitcoin..."
                    className="input-base"
                  />
                </div>

                {/* Blockchain */}
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Blockchain {isStoreLoaded && `(${supportedCount} supportées sur ${blockchains.length})`}
                  </label>
                  {blockchains.length > 5 && (
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Rechercher une blockchain..."
                      className="input-base mb-3"
                    />
                  )}
                  {hasNoMatches ? (
                    <div className="bg-dark-900 border border-dark-700 rounded-xl p-4 text-center">
                      <div className="text-dark-300 text-sm">Aucun résultat pour “{searchTerm.trim()}”.</div>
                      <button
                        type="button"
                        onClick={() => setSearchTerm('')}
                        className="mt-3 text-sm text-primary-400 hover:text-primary-300"
                      >
                        Effacer la recherche
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto">
                      {filteredBlockchains.map((bc: any) => {
                        const bcId = bc.id || bc;
                        const bcName = bc.name || BLOCKCHAIN_NAMES[bcId] || bcId;
                        const bcColor = bc.color || BLOCKCHAIN_COLORS[bcId] || '#888';
                        const bcIcon = bc.icon || BLOCKCHAIN_ICONS[bcId] || '🔗';
                        const isSupported = bc?.nodeSupported === true;
                        return (
                          <button
                            key={bcId}
                            type="button"
                            onClick={() => {
                              if (!isSupported) {
                                toast.error('Blockchain pas encore supportée pour la création de node');
                                return;
                              }
                              setBlockchain(bcId as BlockchainType);
                            }}
                            className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                              !isSupported
                                ? 'opacity-40 cursor-not-allowed border-dark-700'
                                : (blockchain === bcId
                                  ? 'border-primary-500 bg-primary-500/10'
                                  : 'border-dark-600 hover:border-dark-500')
                            }`}
                          >
                            <span 
                              className="text-2xl"
                              style={{ color: bcColor }}
                            >
                              {bcIcon}
                            </span>
                            <span className="text-xs text-dark-300 truncate w-full text-center">
                              {bcName.slice(0, 8)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Mode */}
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-3">
                    Mode de synchronisation
                  </label>
                  <div className="space-y-2">
                    {modes.map((m) => (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => supportedModes.includes(m.value) && setMode(m.value)}
                        disabled={!supportedModes.includes(m.value)}
                        className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                          !supportedModes.includes(m.value)
                            ? 'opacity-50 cursor-not-allowed border-dark-700'
                            : mode === m.value
                              ? 'border-primary-500 bg-primary-500/10'
                              : 'border-dark-600 hover:border-dark-500'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-white">{m.label}</p>
                            <p className="text-sm text-dark-400">{m.description}</p>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              mode === m.value
                                ? 'border-primary-500 bg-primary-500'
                                : 'border-dark-500'
                            }`}
                          >
                            {mode === m.value && (
                              <div className="w-2 h-2 rounded-full bg-white" />
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 btn-secondary justify-center"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 btn-primary justify-center"
                  >
                    {isLoading ? 'Création...' : 'Créer le Node'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
