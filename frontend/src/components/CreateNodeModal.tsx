import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { BlockchainType, NodeMode, BLOCKCHAIN_COLORS, BLOCKCHAIN_ICONS, BLOCKCHAIN_NAMES } from '../types';
import { nodesApi, systemApi } from '../services/api';
import { useStore } from '../store';
import toast from 'react-hot-toast';

interface CreateNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Default blockchains (fallback)
const defaultBlockchains: BlockchainType[] = ['bitcoin', 'ethereum', 'solana', 'monero', 'bnb'];
const modes: { value: NodeMode; label: string; description: string }[] = [
  { value: 'full', label: 'Full Node', description: 'Blockchain complète, plus d\'espace requis' },
  { value: 'pruned', label: 'Pruned', description: 'Blockchain élaguée, moins d\'espace' },
  { value: 'light', label: 'Light', description: 'Mode léger, synchronisation rapide' },
];

export default function CreateNodeModal({ isOpen, onClose }: CreateNodeModalProps) {
  const [name, setName] = useState('');
  const [blockchain, setBlockchain] = useState<BlockchainType>('bitcoin');
  const [mode, setMode] = useState<NodeMode>('pruned');
  const [isLoading, setIsLoading] = useState(false);
  const [blockchains, setBlockchains] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { addNode } = useStore();

  // Load blockchains from API
  useEffect(() => {
    if (isOpen) {
      systemApi.getBlockchains().then((chains) => {
        if (chains && chains.length > 0) {
          setBlockchains(chains);
        }
      }).catch(console.error);
    }
  }, [isOpen]);

  // Filter blockchains by search
  const filteredBlockchains = blockchains.length > 0 
    ? blockchains.filter(bc => 
        bc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bc.symbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bc.id?.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 20) // Show max 20 at a time
    : defaultBlockchains.map(id => ({ id, name: BLOCKCHAIN_NAMES[id], symbol: id.toUpperCase() }));

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
                    Blockchain {blockchains.length > 0 && `(${blockchains.length} disponibles)`}
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
                  <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto">
                    {filteredBlockchains.map((bc) => {
                      const bcId = bc.id || bc;
                      const bcName = bc.name || BLOCKCHAIN_NAMES[bcId] || bcId;
                      const bcColor = bc.color || BLOCKCHAIN_COLORS[bcId] || '#888';
                      const bcIcon = bc.icon || BLOCKCHAIN_ICONS[bcId] || '🔗';
                      return (
                        <button
                          key={bcId}
                          type="button"
                          onClick={() => setBlockchain(bcId as BlockchainType)}
                          className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                            blockchain === bcId
                              ? 'border-primary-500 bg-primary-500/10'
                              : 'border-dark-600 hover:border-dark-500'
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
                        onClick={() => setMode(m.value)}
                        className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                          mode === m.value
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
