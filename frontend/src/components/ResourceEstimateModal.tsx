import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { systemApi, nodesApi } from '../services/api';
import { useStore } from '../store';
import toast from 'react-hot-toast';
import type { BlockchainType, NodeMode, SystemResources, BLOCKCHAIN_NAMES } from '../types';

const REQUIREMENTS: Record<string, Record<NodeMode, { disk: number; memory: number; cpu: number; syncTime: string }>> = {
  bitcoin: {
    full: { disk: 600, memory: 4, cpu: 1, syncTime: '~7 days' },
    pruned: { disk: 50, memory: 2, cpu: 1, syncTime: '~2 days' },
    light: { disk: 5, memory: 1, cpu: 1, syncTime: 'hours' },
  },
  ethereum: {
    full: { disk: 1000, memory: 8, cpu: 4, syncTime: '~5 days' },
    pruned: { disk: 200, memory: 4, cpu: 2, syncTime: '~2 days' },
    light: { disk: 10, memory: 2, cpu: 1, syncTime: 'hours' },
  },
};

const modes: { value: NodeMode; label: string; description: string }[] = [
  { value: 'full', label: 'Full Node', description: 'Blockchain complète, plus d\'espace requis' },
  { value: 'pruned', label: 'Pruned', description: 'Blockchain élaguée, moins d\'espace' },
  { value: 'light', label: 'Light', description: 'Mode léger, synchronisation rapide' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function ResourceEstimateModal({ isOpen, onClose }: Props) {
  const { addNode } = useStore();
  const [nodeName, setNodeName] = useState('');
  const [blockchain, setBlockchain] = useState<BlockchainType>('bitcoin');
  const [mode, setMode] = useState<NodeMode>('pruned');
  const [resources, setResources] = useState<SystemResources | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [blockchains, setBlockchains] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);
      setResources(null);
      
      // Load system resources
      const fetchResources = async () => {
        try {
          const res = await systemApi.getResources();
          setResources(res);
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          setError(errMsg);
        } finally {
          setLoading(false);
        }
      };
      
      // Load blockchains
      const fetchBlockchains = async () => {
        try {
          const chains = await systemApi.getBlockchains();
          if (chains && chains.length > 0) {
            setBlockchains(chains);
          }
        } catch (err) {
          console.error('Error loading blockchains:', err);
        }
      };
      
      fetchResources();
      fetchBlockchains();
    } else {
      setResources(null);
      setError(null);
      setLoading(false);
      setNodeName('');
      setSearchTerm('');
      setIsCreating(false);
    }
  }, [isOpen]);

  const req = REQUIREMENTS[blockchain]?.[mode];
  const diskOk = resources && req ? resources.availableDiskGB >= req.disk : true;
  const memOk = resources && req ? resources.availableMemoryGB >= req.memory : true;
  const cpuOk = true;

  // Filter blockchains by search
  const filteredBlockchains = blockchains.length > 0 
    ? blockchains.filter(bc => 
        bc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bc.symbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bc.id?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const handleCreateNode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const newNode = await nodesApi.create({ 
        name: nodeName || undefined, 
        blockchain, 
        mode 
      });
      addNode(newNode);
      toast.success('Node créé avec succès!');
      onClose();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div className="fixed inset-0 bg-black/60 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
            <div className="bg-dark-800 border border-dark-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-white">Créer un Node</h2>
                <button onClick={onClose} className="text-dark-400 hover:text-white transition">
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateNode} className="space-y-4">
                {/* Node Name */}
                <div>
                  <label className="text-sm text-dark-400 block mb-2">Nom du node (optionnel)</label>
                  <input 
                    type="text" 
                    placeholder="ex: Mon Bitcoin Full Node" 
                    value={nodeName}
                    onChange={(e) => setNodeName(e.target.value)}
                    className="input-base w-full"
                  />
                </div>

                {/* Blockchain Selection with Search */}
                <div>
                  <label className="text-sm text-dark-400 block mb-2">Blockchain</label>
                  {filteredBlockchains.length > 0 ? (
                    <>
                      <input 
                        type="text" 
                        placeholder="Rechercher une blockchain..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-base w-full mb-3"
                      />
                      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-64 overflow-y-auto p-2 bg-dark-900 rounded-lg border border-dark-700">
                        {filteredBlockchains.map((bc) => (
                          <button
                            key={bc.id}
                            type="button"
                            onClick={() => {
                              setBlockchain(bc.id as BlockchainType);
                              setSearchTerm('');
                            }}
                            className={`p-2 rounded text-center text-xs font-medium transition ${
                              blockchain === bc.id
                                ? 'bg-blue-600 text-white border border-blue-400'
                                : 'bg-dark-700 text-dark-200 border border-dark-600 hover:border-blue-400'
                            }`}
                          >
                            {bc.symbol || bc.id.slice(0, 3).toUpperCase()}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-dark-400 mt-2">Sélectionné: {blockchain}</p>
                    </>
                  ) : (
                    <div className="text-dark-400 text-sm">Chargement des blockchains...</div>
                  )}
                </div>

                {/* Mode Selection */}
                <div>
                  <label className="text-sm text-dark-400 block mb-2">Mode de synchronisation</label>
                  <div className="space-y-2">
                    {modes.map((m) => (
                      <label key={m.value} className="flex items-center p-3 rounded-lg border-2 cursor-pointer transition" style={{
                        borderColor: mode === m.value ? '#0066cc' : '#2a3f5f',
                        backgroundColor: mode === m.value ? 'rgba(0, 102, 204, 0.1)' : 'transparent'
                      }}>
                        <input 
                          type="radio" 
                          name="mode" 
                          value={m.value}
                          checked={mode === m.value}
                          onChange={(e) => setMode(e.target.value as NodeMode)}
                          className="w-4 h-4"
                        />
                        <div className="ml-3">
                          <p className="text-white font-medium">{m.label}</p>
                          <p className="text-xs text-dark-400">{m.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Requirements */}
                {req && (
                  <div className="bg-dark-900 border border-dark-700 rounded-xl p-4 space-y-2">
                    <div className="font-semibold text-white">Exigences estimées</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p className="text-dark-300">Disque: <span className="text-white font-medium">{req.disk} GB</span></p>
                      <p className="text-dark-300">Mémoire: <span className="text-white font-medium">{req.memory} GB</span></p>
                      <p className="text-dark-300">CPU: <span className="text-white font-medium">{req.cpu} core(s)</span></p>
                      <p className="text-dark-300">Sync: <span className="text-white font-medium">{req.syncTime}</span></p>
                    </div>
                  </div>
                )}

                {/* System Resources */}
                {resources && (
                  <div className="bg-dark-900 border border-dark-700 rounded-xl p-4 space-y-2">
                    <div className="font-semibold text-white">Votre système</div>
                    <p className={`text-sm ${diskOk ? 'text-green-400' : 'text-amber-400'}`}>
                      Disque libre: <span className="font-medium">{resources.availableDiskGB.toFixed(0)} GB</span> {diskOk ? '✅' : '⚠️'}
                    </p>
                    <p className={`text-sm ${memOk ? 'text-green-400' : 'text-amber-400'}`}>
                      Mémoire libre: <span className="font-medium">{resources.availableMemoryGB.toFixed(1)} GB</span> {memOk ? '✅' : '⚠️'}
                    </p>
                    <p className={`text-sm ${cpuOk ? 'text-green-400' : 'text-amber-400'}`}>
                      CPU disponible: <span className="font-medium">{resources.cpuCores} cores</span> ✅
                    </p>
                  </div>
                )}

                {!diskOk && <p className="text-amber-400 text-sm">⚠️ ATTENTION: Espace disque insuffisant pour ce node.</p>}

                {loading && (
                  <div className="text-center text-dark-300 py-4">
                    <div className="inline-block animate-spin text-dark-400 mb-2">⟳</div>
                    <p>Chargement des ressources système...</p>
                  </div>
                )}

                {error && (
                  <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-300 text-sm">
                    <p className="font-semibold">Erreur lors du chargement:</p>
                    <p>{error}</p>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-4 border-t border-dark-700">
                  <button type="button" className="btn-secondary flex-1 justify-center" onClick={onClose}>Annuler</button>
                  <button 
                    type="submit"
                    className="btn-primary flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed" 
                    disabled={loading || error !== null || isCreating}
                  >
                    {isCreating ? 'Création en cours...' : 'Créer le Node'}
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
