import { useState } from 'react';
import { motion } from 'framer-motion';
import { PlusIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { useStore } from '../store';
import NodeCard from '../components/NodeCard';
import CreateNodeModal from '../components/CreateNodeModal';
import ResourceEstimateModal from '../components/ResourceEstimateModal';
import { BlockchainType, BLOCKCHAIN_NAMES, NodeStatus, NodeMode } from '../types';

export default function NodesPage() {
  const { nodes } = useStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEstimateModal, setShowEstimateModal] = useState(false);
  const [defaultBlockchain, setDefaultBlockchain] = useState<BlockchainType>('bitcoin');
  const [defaultMode, setDefaultMode] = useState<NodeMode>('pruned');
  const [filterBlockchain, setFilterBlockchain] = useState<BlockchainType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<NodeStatus | 'all'>('all');

  // Filtrer les nodes
  const filteredNodes = nodes.filter((node) => {
    if (filterBlockchain !== 'all' && node.config.blockchain !== filterBlockchain) {
      return false;
    }
    if (filterStatus !== 'all' && node.state?.status !== filterStatus) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Nodes</h1>
          <p className="text-dark-400 mt-1">
            {nodes.length} node(s) • {filteredNodes.length} affiché(s)
          </p>
        </div>
        <button
          onClick={() => setShowEstimateModal(true)}
          className="btn-primary"
        >
          <PlusIcon className="w-5 h-5" />
          Nouveau Node
        </button>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-4 bg-dark-800 rounded-xl p-4 border border-dark-700">
        <FunnelIcon className="w-5 h-5 text-dark-400" />
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-dark-400">Blockchain:</span>
          <select
            value={filterBlockchain}
            onChange={(e) => setFilterBlockchain(e.target.value as BlockchainType | 'all')}
            className="select-base w-auto"
          >
            <option value="all">Toutes</option>
            {Object.entries(BLOCKCHAIN_NAMES).map(([key, name]) => (
              <option key={key} value={key}>{name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-dark-400">Statut:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as NodeStatus | 'all')}
            className="select-base w-auto"
          >
            <option value="all">Tous</option>
            <option value="ready">Prêt</option>
            <option value="syncing">Sync</option>
            <option value="stopped">Arrêté</option>
            <option value="error">Erreur</option>
          </select>
        </div>

        {(filterBlockchain !== 'all' || filterStatus !== 'all') && (
          <button
            onClick={() => {
              setFilterBlockchain('all');
              setFilterStatus('all');
            }}
            className="text-sm text-primary-500 hover:text-primary-400"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* Liste des nodes */}
      {filteredNodes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-dark-800 rounded-xl p-12 border border-dark-700 text-center"
        >
          <p className="text-dark-400">
            {nodes.length === 0
              ? 'Aucun node créé. Cliquez sur "Nouveau Node" pour commencer.'
              : 'Aucun node ne correspond aux filtres sélectionnés.'}
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredNodes.map((node, index) => (
            <motion.div
              key={node.config.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <NodeCard node={node} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <CreateNodeModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        defaultBlockchain={defaultBlockchain as BlockchainType}
        defaultMode={defaultMode}
      />

      <ResourceEstimateModal
        isOpen={showEstimateModal}
        onClose={() => setShowEstimateModal(false)}
        onProceed={(bc, mode) => {
          setDefaultBlockchain(bc);
          setDefaultMode(mode as any);
          setShowEstimateModal(false);
          setShowCreateModal(true);
        }}
      />
    </div>
  );
}
