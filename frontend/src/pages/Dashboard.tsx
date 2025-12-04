import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ServerStackIcon,
  WalletIcon,
  CpuChipIcon,
  CircleStackIcon,
  PlusIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import { useStore } from '../store';
import NodeCard from '../components/NodeCard';
import CreateNodeModal from '../components/CreateNodeModal';
import { BLOCKCHAIN_COLORS, BLOCKCHAIN_NAMES, BlockchainType } from '../types';

export default function Dashboard() {
  const { nodes, wallets, systemResources } = useStore();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Stats
  const totalNodes = nodes.length;
  const runningNodes = nodes.filter(
    (n) => n.state.status === 'ready' || n.state.status === 'syncing'
  ).length;
  const totalWallets = wallets.length;

  // Nodes par blockchain
  const nodesByBlockchain = nodes.reduce((acc, node) => {
    acc[node.config.blockchain] = (acc[node.config.blockchain] || 0) + 1;
    return acc;
  }, {} as Record<BlockchainType, number>);

  // Les 4 derniers nodes
  const recentNodes = [...nodes]
    .sort((a, b) => new Date(b.config.createdAt).getTime() - new Date(a.config.createdAt).getTime())
    .slice(0, 4);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-dark-400 mt-1">Vue d'ensemble de vos nodes blockchain</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          <PlusIcon className="w-5 h-5" />
          Nouveau Node
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Nodes actifs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-dark-800 rounded-xl p-6 border border-dark-700"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
              <ServerStackIcon className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-dark-400">Nodes Actifs</p>
              <p className="text-2xl font-bold text-white">
                {runningNodes} / {totalNodes}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Wallets */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-dark-800 rounded-xl p-6 border border-dark-700"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
              <WalletIcon className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <p className="text-sm text-dark-400">Wallets</p>
              <p className="text-2xl font-bold text-white">{totalWallets}</p>
            </div>
          </div>
        </motion.div>

        {/* CPU */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-dark-800 rounded-xl p-6 border border-dark-700"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <CpuChipIcon className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-dark-400">CPU</p>
              <p className="text-2xl font-bold text-white">
                {systemResources?.cpuCores || '-'} cores
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stockage */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-dark-800 rounded-xl p-6 border border-dark-700"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <CircleStackIcon className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-dark-400">Stockage Dispo</p>
              <p className="text-2xl font-bold text-white">
                {systemResources?.availableDiskGB?.toFixed(0) || '-'} GB
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Répartition des nodes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Nodes par blockchain */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-dark-800 rounded-xl p-6 border border-dark-700"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <ArrowTrendingUpIcon className="w-5 h-5 text-primary-500" />
            Nodes par Blockchain
          </h3>
          
          {Object.keys(nodesByBlockchain).length === 0 ? (
            <p className="text-dark-400 text-center py-8">
              Aucun node créé
            </p>
          ) : (
            <div className="space-y-3">
              {(Object.keys(nodesByBlockchain) as BlockchainType[]).map((bc) => (
                <div key={bc} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: BLOCKCHAIN_COLORS[bc] }}
                    />
                    <span className="text-dark-300">{BLOCKCHAIN_NAMES[bc]}</span>
                  </div>
                  <span className="font-semibold text-white">
                    {nodesByBlockchain[bc]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Ressources système */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-dark-800 rounded-xl p-6 border border-dark-700 lg:col-span-2"
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            Ressources Système
          </h3>
          
          {systemResources ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-dark-900 rounded-lg p-4">
                <p className="text-sm text-dark-400 mb-1">CPU</p>
                <p className="text-white font-medium truncate" title={systemResources.cpuModel}>
                  {systemResources.cpuModel}
                </p>
              </div>
              <div className="bg-dark-900 rounded-lg p-4">
                <p className="text-sm text-dark-400 mb-1">Mémoire</p>
                <p className="text-white font-medium">
                  {systemResources.availableMemoryGB.toFixed(1)} / {systemResources.totalMemoryGB.toFixed(1)} GB
                </p>
              </div>
              <div className="bg-dark-900 rounded-lg p-4">
                <p className="text-sm text-dark-400 mb-1">Stockage</p>
                <p className="text-white font-medium">
                  {systemResources.availableDiskGB.toFixed(0)} / {systemResources.totalDiskGB.toFixed(0)} GB
                </p>
              </div>
              <div className="bg-dark-900 rounded-lg p-4">
                <p className="text-sm text-dark-400 mb-1">Système</p>
                <p className="text-white font-medium capitalize">
                  {systemResources.platform} ({systemResources.arch})
                </p>
              </div>
            </div>
          ) : (
            <p className="text-dark-400 text-center py-8">
              Chargement des ressources...
            </p>
          )}
        </motion.div>
      </div>

      {/* Nodes récents */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Nodes Récents</h2>
          {nodes.length > 4 && (
            <a href="/nodes" className="text-primary-500 hover:text-primary-400 text-sm">
              Voir tous →
            </a>
          )}
        </div>

        {recentNodes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-dark-800 rounded-xl p-12 border border-dark-700 text-center"
          >
            <ServerStackIcon className="w-16 h-16 text-dark-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              Aucun node créé
            </h3>
            <p className="text-dark-400 mb-6">
              Commencez par créer votre premier node blockchain
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary inline-flex"
            >
              <PlusIcon className="w-5 h-5" />
              Créer un Node
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {recentNodes.map((node) => (
              <NodeCard key={node.config.id} node={node} />
            ))}
          </div>
        )}
      </div>

      {/* Modal création node */}
      <CreateNodeModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}
