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
import { useStore } from '../store';
import { useLanguage } from '../i18n';
import toast from 'react-hot-toast';
import { useEffect, useMemo, useState } from 'react';
import type { NodeConnectionInfo, NodeRpcTestResult } from '../types';

interface NodeCardProps {
  node: NodeInfo;
  onSelect?: () => void;
}

export default function NodeCard({ node, onSelect }: NodeCardProps) {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const { removeNode, updateNodeStatus } = useStore();
  const { config } = node;
  // Provide default state if undefined
  const state = node.state || {
    status: 'stopped' as const,
    syncProgress: 0,
    blockHeight: 0,
    latestBlock: 0,
    peers: 0,
    lastError: null,
  };
  // Provide default metrics if undefined
  const metrics = node.metrics || {
    cpuUsage: 0,
    memoryUsage: 0,
    diskUsage: 0,
    networkIn: 0,
    networkOut: 0,
  };

  const isRunningLike = ['starting', 'pulling', 'syncing', 'ready'].includes(state.status);
  const [connection, setConnection] = useState<NodeConnectionInfo | null>(null);
  const [rpcTest, setRpcTest] = useState<NodeRpcTestResult | null>(null);
  const [isRpcTesting, setIsRpcTesting] = useState(false);
  const [showRpcAuth, setShowRpcAuth] = useState(false);
  const metricsTimestamp = metrics?.timestamp ? Date.parse(metrics.timestamp) : NaN;
  const metricsFresh = Number.isFinite(metricsTimestamp) ? (Date.now() - metricsTimestamp) < 30_000 : false;
  const canShowMetrics = isRunningLike && metricsFresh;
  const color = BLOCKCHAIN_COLORS[config.blockchain];
  const icon = BLOCKCHAIN_ICONS[config.blockchain];
  const name = BLOCKCHAIN_NAMES[config.blockchain];

  const fallbackRpcUrl = useMemo(() => {
    const port = (config as any)?.rpcPort;
    return typeof port === 'number' ? `http://127.0.0.1:${port}` : undefined;
  }, [config]);

  const fallbackWsUrl = useMemo(() => {
    const port = (config as any)?.wsPort;
    return typeof port === 'number' ? `ws://127.0.0.1:${port}` : undefined;
  }, [config]);

  useEffect(() => {
    let cancelled = false;
    // Fetch connection info once we know the node exists (even if stopped, URLs are useful).
    (async () => {
      try {
        const info = await nodesApi.getConnection(config.id);
        if (!cancelled) setConnection(info);
      } catch {
        // Non-blocking; we'll fall back to local port display.
      }
    })();
    return () => { cancelled = true; };
  }, [config.id]);

  const rpcUrl = connection?.rpcUrl || fallbackRpcUrl;
  const wsUrl = connection?.wsUrl || fallbackWsUrl;
  const hasRpc = !!rpcUrl;

  const connectionHint = useMemo(() => {
    if (!rpcUrl) return '';
    if (connection?.localOnly === false) {
      let host = '';
      try {
        host = new URL(rpcUrl).hostname;
      } catch {
        // Fallback parsing (should not happen)
        const m = rpcUrl.match(/^https?:\/\/([^/:]+)/i);
        host = m?.[1] || '';
      }
      return host ? t('nodes.card.accessHost', { host }) : t('nodes.card.localOnly');
    }
    return t('nodes.card.localOnly');
  }, [connection?.localOnly, rpcUrl, t]);

  const copyToClipboard = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(t('nodes.card.copied'));
    } catch {
      toast.error(t('nodes.card.copyFailed'));
    }
  };

  const runRpcTest = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasRpc) return;
    setIsRpcTesting(true);
    try {
      const result = await nodesApi.rpcTest(config.id);
      setRpcTest(result);
      if (result.ok) {
        toast.success(t('nodes.card.rpcOk', { ms: result.latencyMs ?? 0 }));
      } else {
        toast.error(result.error || t('nodes.card.rpcKo'));
      }
    } finally {
      setIsRpcTesting(false);
    }
  };

  const handleStart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    const prevStatus = state.status;
    updateNodeStatus(config.id, 'starting');
    try {
      await nodesApi.start(config.id);
      updateNodeStatus(config.id, 'syncing');
      toast.success(t('nodes.card.started'));
    } catch (error) {
      const err = error as Error & { status?: number };
      if (err.status === 404) {
        removeNode(config.id);
      } else {
        updateNodeStatus(config.id, prevStatus, err.message);
      }
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    const prevStatus = state.status;
    updateNodeStatus(config.id, 'stopping');
    try {
      await nodesApi.stop(config.id);
      // Don't force 'stopped' here: the backend may return before Docker actually stops,
      // and a subsequent poll can revert the UI back to 'syncing'. We'll keep 'stopping'
      // until the backend confirms 'stopped' via socket/poll.
      toast.success(t('nodes.card.stopped'));
    } catch (error) {
      const err = error as Error & { status?: number };
      if (err.status === 404) {
        removeNode(config.id);
      } else {
        updateNodeStatus(config.id, prevStatus, err.message);
      }
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(t('nodes.card.confirmDelete'))) return;
    
    setIsLoading(true);
    try {
      await nodesApi.delete(config.id);
      removeNode(config.id);  // Update store immediately
      toast.success(t('nodes.card.deleted'));
    } catch (error) {
      const err = error as Error & { status?: number };
      if (err.status === 404) {
        removeNode(config.id);
        toast.success(t('nodes.card.deleted'));
        return;
      }
      toast.error(err.message);
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
    const syncStage = (state as any)?.syncStage as string | undefined;
    const syncStageProgress = (state as any)?.syncStageProgress as number | undefined;
    const stageLabel = (() => {
      if (!syncStage) return '';
      switch (syncStage) {
        case 'headers-presync':
          return 'Headers (pré-sync)';
        case 'headers-sync':
          return 'Headers';
        case 'blocks':
          return 'Blocs';
        default:
          return syncStage;
      }
    })();

    switch (state.status) {
      case 'ready':
        return t('nodes.status.readyText');
      case 'syncing':
        if (stageLabel && typeof syncStageProgress === 'number' && Number.isFinite(syncStageProgress)) {
          return `${t('nodes.status.syncing')} • ${stageLabel} ${syncStageProgress.toFixed(2)}%`;
        }
        return state.syncProgress > 0 ? t('nodes.status.syncText', { progress: state.syncProgress }) : t('nodes.status.syncing');
      case 'error':
        return t('nodes.status.errorText');
      case 'starting':
        return t('nodes.status.startingText');
      case 'stopping':
        return t('nodes.status.stoppingText');
      case 'pulling':
        return t('nodes.status.pulling');
      case 'stopped':
        return t('nodes.status.stoppedText');
      default:
        return state.status;
    }
  };

  const showProgress = ['starting', 'pulling', 'syncing'].includes(state.status);
  const progressValue = typeof state.syncProgress === 'number' ? state.syncProgress : 0;
  const progressWidth = progressValue > 0 ? `${Math.min(100, Math.max(0, progressValue))}%` : '30%';
  const hasBlockInfo = (state.blockHeight ?? 0) > 0 || (state.latestBlock ?? 0) > 0;
  const stage = (state as any)?.syncStage as string | undefined;
  const stageHeight = Number((state as any)?.syncStageHeight ?? 0);
  const stageTarget = Number((state as any)?.syncStageTargetHeight ?? 0);
  const hasStageInfo = !!stage || stageHeight > 0 || stageTarget > 0;
  const stageLabelShort = (() => {
    switch (stage) {
      case 'headers-presync':
        return 'Headers';
      case 'headers-sync':
        return 'Headers';
      case 'blocks':
        return t('nodes.card.block');
      default:
        return t('nodes.card.block');
    }
  })();

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

        {/* Barre de progression */}
        {showProgress && (
          <div className="mb-4">
            <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
              <motion.div
                initial={progressValue > 0 ? { width: 0 } : false}
                animate={progressValue > 0 ? { width: progressWidth } : { width: progressWidth, opacity: [0.6, 1, 0.6] }}
                transition={progressValue > 0 ? undefined : { duration: 1.2, repeat: Infinity }}
                className="h-full rounded-full"
                style={{ backgroundColor: color }}
              />
            </div>
            <div className="flex justify-between text-xs text-dark-400 mt-1">
              <span>
                {hasBlockInfo
                  ? `${t('nodes.card.block')} ${(state.blockHeight ?? 0).toLocaleString()}`
                  : (hasStageInfo
                      ? `${stageLabelShort} ${(stageHeight || 0).toLocaleString()}`
                      : t('nodes.status.syncing'))}
              </span>
              <span>
                {hasBlockInfo
                  ? (state.latestBlock ?? 0).toLocaleString()
                  : (hasStageInfo && stageTarget > 0 ? stageTarget.toLocaleString() : '')}
              </span>
            </div>
          </div>
        )}

        {/* Métriques */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-dark-900 rounded-lg p-3 text-center">
            <p className="text-xs text-dark-400 mb-1">{t('nodes.card.cpu')}</p>
            <p className="text-sm font-medium text-white">{canShowMetrics ? `${(metrics?.cpuUsage ?? 0).toFixed(1)}%` : '—'}</p>
          </div>
          <div className="bg-dark-900 rounded-lg p-3 text-center">
            <p className="text-xs text-dark-400 mb-1">{t('nodes.card.ram')}</p>
            <p className="text-sm font-medium text-white">{canShowMetrics ? `${(metrics?.memoryUsage ?? 0).toFixed(0)} MB` : '—'}</p>
          </div>
          <div className="bg-dark-900 rounded-lg p-3 text-center">
            <p className="text-xs text-dark-400 mb-1">{t('nodes.card.peers')}</p>
            <p className="text-sm font-medium text-white">{isRunningLike ? String(state.peers) : '—'}</p>
          </div>
        </div>

        {/* Après Start: endpoints & RPC readiness */}
        {(hasRpc || wsUrl) && (
          <div className="mb-4 bg-dark-900 rounded-lg p-3 border border-dark-700/60">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-dark-400">{t('nodes.card.connection')}</p>
                {hasRpc && (
                  <p className="text-sm text-white truncate">RPC: {rpcUrl}</p>
                )}
                {wsUrl && (
                  <p className="text-sm text-white truncate">WS: {wsUrl}</p>
                )}
                {connectionHint ? (
                  <p className="text-xs text-dark-500 mt-1">{connectionHint}</p>
                ) : null}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    rpcTest ? (rpcTest.ok ? 'bg-green-500' : 'bg-red-500') : 'bg-dark-500'
                  }`}
                  title={rpcTest ? (rpcTest.ok ? t('nodes.card.rpcStatusReady') : t('nodes.card.rpcStatusDown')) : t('nodes.card.rpcStatusUnknown')}
                />
                {hasRpc && (
                  <button
                    className="btn-secondary text-xs px-2 py-1"
                    onClick={(e) => { e.stopPropagation(); copyToClipboard(rpcUrl!); }}
                    title={t('nodes.card.copyRpc')}
                  >
                    {t('nodes.card.copy')}
                  </button>
                )}
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                className="btn-secondary text-xs px-2 py-1"
                disabled={isRpcTesting || !hasRpc}
                onClick={runRpcTest}
              >
                {isRpcTesting ? t('nodes.card.testingRpc') : t('nodes.card.testRpc')}
              </button>

              {connection?.rpcAuth && (
                <button
                  className="btn-secondary text-xs px-2 py-1"
                  onClick={(e) => { e.stopPropagation(); setShowRpcAuth(v => !v); }}
                >
                  {showRpcAuth ? t('nodes.card.hideCredentials') : t('nodes.card.showCredentials')}
                </button>
              )}
            </div>

            {showRpcAuth && connection?.rpcAuth && (
              <div className="mt-2 grid grid-cols-1 gap-2">
                <div className="flex items-center justify-between bg-dark-800 rounded-md px-2 py-1">
                  <p className="text-xs text-dark-300 truncate">{t('nodes.card.rpcUser')}: <span className="text-white">{connection.rpcAuth.username}</span></p>
                  <button
                    className="btn-secondary text-xs px-2 py-1"
                    onClick={(e) => { e.stopPropagation(); copyToClipboard(connection.rpcAuth!.username); }}
                  >
                    {t('nodes.card.copy')}
                  </button>
                </div>
                <div className="flex items-center justify-between bg-dark-800 rounded-md px-2 py-1">
                  <p className="text-xs text-dark-300 truncate">{t('nodes.card.rpcPassword')}: <span className="text-white">{connection.rpcAuth.password}</span></p>
                  <button
                    className="btn-secondary text-xs px-2 py-1"
                    onClick={(e) => { e.stopPropagation(); copyToClipboard(connection.rpcAuth!.password); }}
                  >
                    {t('nodes.card.copy')}
                  </button>
                </div>
              </div>
            )}

            {rpcTest?.error && !rpcTest.ok && (
              <p className="text-xs text-red-400 mt-2 break-words">{rpcTest.error}</p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {state.status === 'stopped' || state.status === 'error' ? (
            <button
              onClick={handleStart}
              disabled={isLoading}
              className="flex-1 btn-success text-sm justify-center"
            >
              <PlayIcon className="w-4 h-4" />
              {t('nodes.card.start')}
            </button>
          ) : state.status === 'ready' || state.status === 'syncing' ? (
            <button
              onClick={handleStop}
              disabled={isLoading}
              className="flex-1 btn-secondary text-sm justify-center"
            >
              <StopIcon className="w-4 h-4" />
              {t('nodes.card.stop')}
            </button>
          ) : (
            <button
              disabled
              className="flex-1 btn-secondary text-sm justify-center opacity-50"
            >
              <ArrowPathIcon className="w-4 h-4 animate-spin" />
              {t('nodes.card.processing')}
            </button>
          )}
          
          <button
            onClick={handleDelete}
            disabled={isLoading || state.status !== 'stopped'}
            className="btn-danger text-sm"
            title={t('nodes.card.delete')}
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
