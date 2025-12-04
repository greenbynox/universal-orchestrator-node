import { motion } from 'framer-motion';
import { 
  PlayIcon, 
  StopIcon, 
  TrashIcon, 
  ArrowPathIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ArrowUpCircleIcon,
} from '@heroicons/react/24/outline';
import { NodeInfo, BLOCKCHAIN_COLORS, BLOCKCHAIN_ICONS, BLOCKCHAIN_NAMES } from '../types';
import { nodesApi } from '../services/api';
import toast from 'react-hot-toast';
import { useState } from 'react';

interface NodeCardProps {
  node: NodeInfo;
  onSelect?: () => void;
}

export default function NodeCard({ node, onSelect }: NodeCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { config, state, metrics } = node;
  const color = BLOCKCHAIN_COLORS[config.blockchain];
  const icon = BLOCKCHAIN_ICONS[config.blockchain];
  const name = BLOCKCHAIN_NAMES[config.blockchain];

  const handleStart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    try {
      await nodesApi.start(config.id);
      toast.success('Node démarré');
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    try {
      await nodesApi.stop(config.id);
      toast.success('Node arrêté');
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce node ?')) return;
    
    setIsLoading(true);
    try {
      await nodesApi.delete(config.id);
      toast.success('Node supprimé');
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (state.status) {
      case 'ready':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'syncing':
        return <ArrowUpCircleIcon className="w-5 h-5 text-yellow-500 animate-pulse" />;
      case 'error':
        return <ExclamationCircleIcon className="w-5 h-5 text-red-500" />;
      case 'starting':
      case 'stopping':
        return <ArrowPathIcon className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <div className="w-3 h-3 rounded-full bg-dark-500" />;
    }
  };

  const getStatusText = () => {
    switch (state.status) {
      case 'ready':
        return 'Prêt';
      case 'syncing':
        return `Sync ${state.syncProgress}%`;
      case 'error':
        return 'Erreur';
      case 'starting':
        return 'Démarrage...';
      case 'stopping':
        return 'Arrêt...';
      case 'stopped':
        return 'Arrêté';
      default:
        return state.status;
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden cursor-pointer card-hover"
      onClick={onSelect}
    >
      {/* Header avec couleur de la blockchain */}
      <div 
        className="h-2"
        style={{ backgroundColor: color }}
      />

      <div className="p-5">
        {/* Titre et icône */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{ backgroundColor: `${color}20` }}
            >
              {icon}
            </div>
            <div>
              <h3 className="font-semibold text-white">{config.name}</h3>
              <p className="text-sm text-dark-400">{name} • {config.mode}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="text-sm text-dark-300">{getStatusText()}</span>
          </div>
        </div>

        {/* Barre de progression (si sync) */}
        {state.status === 'syncing' && (
          <div className="mb-4">
            <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${state.syncProgress}%` }}
                className="h-full rounded-full"
                style={{ backgroundColor: color }}
              />
            </div>
            <div className="flex justify-between text-xs text-dark-400 mt-1">
              <span>Block {state.blockHeight.toLocaleString()}</span>
              <span>{state.latestBlock.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Métriques */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-dark-900 rounded-lg p-3 text-center">
            <p className="text-xs text-dark-400 mb-1">CPU</p>
            <p className="text-sm font-medium text-white">{metrics.cpuUsage.toFixed(1)}%</p>
          </div>
          <div className="bg-dark-900 rounded-lg p-3 text-center">
            <p className="text-xs text-dark-400 mb-1">RAM</p>
            <p className="text-sm font-medium text-white">{metrics.memoryUsage.toFixed(0)} MB</p>
          </div>
          <div className="bg-dark-900 rounded-lg p-3 text-center">
            <p className="text-xs text-dark-400 mb-1">Peers</p>
            <p className="text-sm font-medium text-white">{state.peers}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {state.status === 'stopped' || state.status === 'error' ? (
            <button
              onClick={handleStart}
              disabled={isLoading}
              className="flex-1 btn-success text-sm justify-center"
            >
              <PlayIcon className="w-4 h-4" />
              Démarrer
            </button>
          ) : state.status === 'ready' || state.status === 'syncing' ? (
            <button
              onClick={handleStop}
              disabled={isLoading}
              className="flex-1 btn-secondary text-sm justify-center"
            >
              <StopIcon className="w-4 h-4" />
              Arrêter
            </button>
          ) : (
            <button
              disabled
              className="flex-1 btn-secondary text-sm justify-center opacity-50"
            >
              <ArrowPathIcon className="w-4 h-4 animate-spin" />
              En cours...
            </button>
          )}
          
          <button
            onClick={handleDelete}
            disabled={isLoading || state.status !== 'stopped'}
            className="btn-danger text-sm"
            title="Supprimer"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Erreur */}
        {state.lastError && (
          <div className="mt-3 p-2 bg-red-900/20 border border-red-800 rounded-lg">
            <p className="text-xs text-red-400">{state.lastError}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
