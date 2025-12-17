import { create, StoreApi } from 'zustand';
import type { NodeInfo, WalletInfo, SystemResources, NodeStatus, NodeMetrics } from '../types';

type NodeMeta = {
  lastSeenAt: number;
  lastStatusAt: number;
  lastMetricsAt: number;
  lastNonZeroPeersAt?: number;
  peersHoldUntil?: number;
  peersHeldValue?: number;
  pendingDeleteUntil?: number;
};

export type LogNotification = {
  id: string;
  nodeId: string;
  nodeName?: string;
  message: string;
  timestamp: number;
};

const STATUS_REGRESSION_GUARD_MS = 15_000;
const MISSING_NODE_GRACE_MS = 30_000;
const PENDING_DELETE_GRACE_MS = 30_000;
const PEERS_DROP_HOLD_MS = 20_000;

function isRunningLike(status: NodeStatus | undefined): boolean {
  return status === 'starting' || status === 'pulling' || status === 'syncing' || status === 'ready' || status === 'stopping';
}

function isActiveLike(status: NodeStatus | undefined): boolean {
  // Like running, but excludes 'stopping' so a real stop confirmation is applied immediately.
  return status === 'starting' || status === 'pulling' || status === 'syncing' || status === 'ready';
}

function parseTimestampMs(ts: unknown): number {
  if (!ts) return NaN;
  if (typeof ts === 'number') return ts;
  if (ts instanceof Date) return ts.getTime();
  if (typeof ts === 'string') {
    const ms = Date.parse(ts);
    return Number.isFinite(ms) ? ms : NaN;
  }
  return NaN;
}

interface AppState {
  // Connection state
  isConnected: boolean;
  setConnected: (connected: boolean) => void;

  // Nodes
  nodes: NodeInfo[];
  nodeMeta: Record<string, NodeMeta>;
  setNodes: (nodes: NodeInfo[]) => void;
  addNode: (node: NodeInfo) => void;
  removeNode: (nodeId: string) => void;
  updateNodeStatus: (nodeId: string, status: NodeStatus, error?: string) => void;
  updateNodeMetrics: (nodeId: string, metrics: Partial<NodeMetrics>) => void;
  updateNodeSync: (nodeId: string, syncData: {
    progress?: number;
    currentBlock?: number;
    highestBlock?: number;
    peers?: number;
    stage?: string;
    stageProgress?: number;
    stageHeight?: number;
    stageTargetHeight?: number;
    timestamp?: unknown;
    source?: string;
  }) => void;
  
  // Node logs
  nodeLogs: Record<string, string[]>;
  addNodeLog: (nodeId: string, log: string) => void;
  clearNodeLogs: (nodeId: string) => void;

  // UI log notifications (optional)
  logNotifications: LogNotification[];
  unreadLogNotifications: number;
  addLogNotification: (n: Omit<LogNotification, 'id'> & { id?: string }) => void;
  markLogNotificationsRead: () => void;
  clearLogNotifications: () => void;

  // Wallets
  wallets: WalletInfo[];
  setWallets: (wallets: WalletInfo[]) => void;
  addWallet: (wallet: WalletInfo) => void;
  removeWallet: (walletId: string) => void;

  // System
  systemResources: SystemResources | null;
  setSystemResources: (resources: SystemResources) => void;
  
  // Blockchains cache
  blockchains: any[];
  setBlockchains: (blockchains: any[]) => void;

  // UI State
  selectedNodeId: string | null;
  setSelectedNodeId: (nodeId: string | null) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  // Loading states
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useStore = create<AppState>((set: StoreApi<AppState>['setState']) => ({
  // Connection
  isConnected: false,
  setConnected: (connected: boolean) => set({ isConnected: connected }),

  // Nodes
  nodes: [],
  nodeMeta: {},
  setNodes: (incoming: NodeInfo[]) => set((state: AppState) => {
    const now = Date.now();
    const nextMeta: Record<string, NodeMeta> = { ...state.nodeMeta };

    const byId = new Map<string, NodeInfo>();
    for (const n of state.nodes) {
      const id = n?.config?.id;
      if (id) byId.set(id, n);
    }

    // Upsert all incoming nodes
    for (const n of incoming || []) {
      const id = n?.config?.id;
      if (!id) continue;

      const meta = nextMeta[id] ?? { lastSeenAt: 0, lastStatusAt: 0, lastMetricsAt: 0 };
      const pendingDeleteUntil = meta.pendingDeleteUntil ?? 0;
      if (pendingDeleteUntil > now) {
        // Ignore re-appearances while delete is in-flight / just completed.
        continue;
      }

      const existing = byId.get(id);

      // Merge metrics preferring freshest timestamp
      const incomingMetricsTs = parseTimestampMs((n as any)?.metrics?.timestamp);
      const existingMetricsTs = parseTimestampMs((existing as any)?.metrics?.timestamp);
      const takeIncomingMetrics = !existing || (!Number.isFinite(existingMetricsTs) && Number.isFinite(incomingMetricsTs)) || (Number.isFinite(incomingMetricsTs) && incomingMetricsTs >= existingMetricsTs);

      // Prevent short-lived regressions like ready/syncing->stopped due to a fast poll after click.
      const incomingStatus = (n as any)?.state?.status as NodeStatus | undefined;
      const existingStatus = (existing as any)?.state?.status as NodeStatus | undefined;
      const statusWouldRegress = isActiveLike(existingStatus) && incomingStatus === 'stopped' && (now - meta.lastStatusAt) < STATUS_REGRESSION_GUARD_MS;

      const baseMergedState = statusWouldRegress && existing?.state
        ? existing.state
        : ({ ...(existing?.state as any), ...(n as any).state } as any);

      // Guard against peers flapping to 0 (transient RPC/log gaps).
      const existingPeers = Number((existing as any)?.state?.peers ?? 0);
      const incomingPeers = Number((n as any)?.state?.peers ?? NaN);
      const lastNonZeroPeersAt = meta.lastNonZeroPeersAt ?? 0;
      const peersWouldRegressToZero = Number.isFinite(incomingPeers) && incomingPeers === 0 && existingPeers > 0 && (now - lastNonZeroPeersAt) < 30_000;

      // Smooth peer drops: hold decreases for a short period (peers can legitimately fluctuate).
      let nextPeersHoldUntil = meta.peersHoldUntil ?? 0;
      let nextPeersHeldValue = meta.peersHeldValue ?? existingPeers;
      let mergedPeersValue = baseMergedState.peers ?? existingPeers;

      if (Number.isFinite(incomingPeers)) {
        if (incomingPeers > existingPeers) {
          mergedPeersValue = incomingPeers;
          nextPeersHoldUntil = 0;
          nextPeersHeldValue = incomingPeers;
        } else if (incomingPeers < existingPeers) {
          if (peersWouldRegressToZero) {
            mergedPeersValue = existingPeers;
          } else if (nextPeersHoldUntil > now) {
            mergedPeersValue = Math.max(incomingPeers, nextPeersHeldValue);
          } else {
            // Start a new hold window.
            mergedPeersValue = existingPeers;
            nextPeersHoldUntil = now + PEERS_DROP_HOLD_MS;
            nextPeersHeldValue = existingPeers;
          }
        } else {
          mergedPeersValue = incomingPeers;
        }
      }

      // Guard against progress/height regressions while running.
      const existingProgress = Number((existing as any)?.state?.syncProgress ?? 0);
      const incomingProgress = Number((n as any)?.state?.syncProgress ?? NaN);
      const progressWouldRegress = isRunningLike(existingStatus) && isRunningLike(incomingStatus) && Number.isFinite(incomingProgress) && incomingProgress < existingProgress;

      const existingBlock = Number((existing as any)?.state?.blockHeight ?? 0);
      const incomingBlock = Number((n as any)?.state?.blockHeight ?? NaN);
      const blockWouldRegress = isRunningLike(existingStatus) && isRunningLike(incomingStatus) && Number.isFinite(incomingBlock) && incomingBlock < existingBlock;

      const existingLatest = Number((existing as any)?.state?.latestBlock ?? 0);
      const incomingLatest = Number((n as any)?.state?.latestBlock ?? NaN);
      const latestWouldRegress = isRunningLike(existingStatus) && isRunningLike(incomingStatus) && Number.isFinite(incomingLatest) && incomingLatest < existingLatest;

      const mergedState: any = {
        ...baseMergedState,
        peers: mergedPeersValue,
        syncProgress: progressWouldRegress ? existingProgress : (Number.isFinite(incomingProgress) ? incomingProgress : baseMergedState.syncProgress),
        blockHeight: blockWouldRegress ? existingBlock : (Number.isFinite(incomingBlock) ? incomingBlock : baseMergedState.blockHeight),
        latestBlock: latestWouldRegress ? existingLatest : (Number.isFinite(incomingLatest) ? incomingLatest : baseMergedState.latestBlock),
      };

      const merged: NodeInfo = {
        ...(existing || ({} as NodeInfo)),
        ...n,
        state: mergedState,
        metrics: takeIncomingMetrics ? { ...(existing?.metrics as any), ...(n as any).metrics } : (existing?.metrics || (n as any).metrics),
      } as NodeInfo;

      byId.set(id, merged);

      const mergedPeers = Number((merged as any)?.state?.peers ?? 0);
      nextMeta[id] = {
        ...meta,
        lastSeenAt: now,
        lastStatusAt: incomingStatus && incomingStatus !== existingStatus ? now : meta.lastStatusAt || now,
        lastMetricsAt: takeIncomingMetrics && Number.isFinite(incomingMetricsTs) ? incomingMetricsTs : meta.lastMetricsAt,
        lastNonZeroPeersAt: mergedPeers > 0 ? now : meta.lastNonZeroPeersAt,
        peersHoldUntil: nextPeersHoldUntil,
        peersHeldValue: nextPeersHeldValue,
      };
    }

    // Evict nodes that haven't been seen for a while (prevents permanent ghosts)
    const nextNodes: NodeInfo[] = [];
    for (const [id, node] of byId.entries()) {
      const meta = nextMeta[id] ?? { lastSeenAt: 0, lastStatusAt: 0, lastMetricsAt: 0 };
      const pendingDeleteUntil = meta.pendingDeleteUntil ?? 0;
      if (pendingDeleteUntil > now) continue;

      if (meta.lastSeenAt && (now - meta.lastSeenAt) > MISSING_NODE_GRACE_MS) {
        // Drop stale nodes (missing from API / nodes:list for long enough)
        delete nextMeta[id];
        continue;
      }

      nextNodes.push(node);
    }

    // Keep a stable order (existing order first, then new)
    nextNodes.sort((a, b) => {
      const aCreated = Date.parse((a as any)?.config?.createdAt ?? '') || 0;
      const bCreated = Date.parse((b as any)?.config?.createdAt ?? '') || 0;
      return bCreated - aCreated;
    });

    return { nodes: nextNodes, nodeMeta: nextMeta };
  }),
  addNode: (node: NodeInfo) => set((state: AppState) => {
    const id = (node as any)?.config?.id;
    if (!id) return { nodes: state.nodes };
    const existingIndex = state.nodes.findIndex((n) => n?.config?.id === id);
    const now = Date.now();
    const meta: NodeMeta = state.nodeMeta[id] ?? { lastSeenAt: 0, lastStatusAt: 0, lastMetricsAt: 0 };
    if ((meta.pendingDeleteUntil ?? 0) > now) {
      return { nodes: state.nodes, nodeMeta: state.nodeMeta };
    }

    if (existingIndex === -1) return { nodes: [...state.nodes, node], nodeMeta: { ...state.nodeMeta, [id]: { ...meta, lastSeenAt: now, lastStatusAt: now } } };
    const next = state.nodes.slice();
    next[existingIndex] = { ...next[existingIndex], ...node };
    return { nodes: next, nodeMeta: { ...state.nodeMeta, [id]: { ...meta, lastSeenAt: now, lastStatusAt: now } } };
  }),
  removeNode: (nodeId) => set((state) => {
    const now = Date.now();
    const meta: NodeMeta = state.nodeMeta[nodeId] ?? { lastSeenAt: 0, lastStatusAt: 0, lastMetricsAt: 0 };
    return {
      nodes: state.nodes.filter((n) => n?.config?.id !== nodeId),
      nodeMeta: {
        ...state.nodeMeta,
        [nodeId]: { ...meta, pendingDeleteUntil: now + PENDING_DELETE_GRACE_MS, lastSeenAt: now, lastStatusAt: now },
      },
    };
  }),
  updateNodeStatus: (nodeId, status, error) => set((state) => {
    const now = Date.now();
    const meta: NodeMeta = state.nodeMeta[nodeId] ?? { lastSeenAt: 0, lastStatusAt: 0, lastMetricsAt: 0 };
    return {
      nodes: state.nodes.map((n) =>
        n?.config?.id === nodeId
          ? { ...n, state: { ...n.state, status, lastError: error } }
          : n
      ),
      nodeMeta: { ...state.nodeMeta, [nodeId]: { ...meta, lastStatusAt: now, lastSeenAt: now } },
    };
  }),
  updateNodeMetrics: (nodeId, metrics) => set((state) => {
    const now = Date.now();
    const meta: NodeMeta = state.nodeMeta[nodeId] ?? { lastSeenAt: 0, lastStatusAt: 0, lastMetricsAt: 0 };
    const metricsTs = parseTimestampMs((metrics as any)?.timestamp);
    return {
      nodes: state.nodes.map((n) =>
        n?.config?.id === nodeId
          ? { ...n, metrics: { ...n.metrics, ...metrics } }
          : n
      ),
      nodeMeta: { ...state.nodeMeta, [nodeId]: { ...meta, lastMetricsAt: Number.isFinite(metricsTs) ? metricsTs : meta.lastMetricsAt, lastSeenAt: now } },
    };
  }),
  updateNodeSync: (nodeId, syncData) => set((state) => {
    const now = Date.now();
    const meta: NodeMeta = state.nodeMeta[nodeId] ?? { lastSeenAt: 0, lastStatusAt: 0, lastMetricsAt: 0 };

    const prevNode = state.nodes.find((n) => n?.config?.id === nodeId);
    const prevPeersForMeta = Number((prevNode as any)?.state?.peers ?? 0);
    const incomingPeersForMeta = typeof syncData.peers === 'number' ? syncData.peers : undefined;

    let nextPeersHoldUntil = meta.peersHoldUntil ?? 0;
    let nextPeersHeldValue = meta.peersHeldValue ?? prevPeersForMeta;

    if (typeof incomingPeersForMeta === 'number' && Number.isFinite(incomingPeersForMeta)) {
      if (incomingPeersForMeta > prevPeersForMeta) {
        nextPeersHoldUntil = 0;
        nextPeersHeldValue = incomingPeersForMeta;
      } else if (incomingPeersForMeta < prevPeersForMeta) {
        const lastNonZeroPeersAt = meta.lastNonZeroPeersAt ?? 0;
        const peersWouldRegressToZero = prevPeersForMeta > 0 && incomingPeersForMeta === 0 && (now - lastNonZeroPeersAt) < 30_000;
        if (!peersWouldRegressToZero && !(nextPeersHoldUntil > now)) {
          nextPeersHoldUntil = now + PEERS_DROP_HOLD_MS;
          nextPeersHeldValue = prevPeersForMeta;
        }
      }
    }

    return {
      nodes: state.nodes.map((n) =>
        n?.config?.id === nodeId
          ? {
              ...n,
              state: {
                ...n.state,
                syncProgress: typeof syncData.progress === 'number' ? syncData.progress : n.state?.syncProgress,
                blockHeight: typeof syncData.currentBlock === 'number' ? syncData.currentBlock : n.state?.blockHeight,
                latestBlock: typeof syncData.highestBlock === 'number' ? syncData.highestBlock : n.state?.latestBlock,
                syncStage: typeof (syncData as any).stage === 'string' ? (syncData as any).stage : (n.state as any)?.syncStage,
                syncStageProgress: typeof (syncData as any).stageProgress === 'number' ? (syncData as any).stageProgress : (n.state as any)?.syncStageProgress,
                syncStageHeight: typeof (syncData as any).stageHeight === 'number' ? (syncData as any).stageHeight : (n.state as any)?.syncStageHeight,
                syncStageTargetHeight: typeof (syncData as any).stageTargetHeight === 'number' ? (syncData as any).stageTargetHeight : (n.state as any)?.syncStageTargetHeight,
                peers: (() => {
                  const prev = Number(n.state?.peers ?? 0);
                  const next = typeof syncData.peers === 'number' ? syncData.peers : prev;
                  const lastNonZeroPeersAt = meta.lastNonZeroPeersAt ?? 0;
                  if (prev > 0 && next === 0 && (now - lastNonZeroPeersAt) < 30_000) return prev;
                  if (typeof syncData.peers !== 'number') return prev;

                  if (next > prev) {
                    return next;
                  }
                  if (next < prev) {
                    const holdUntil = meta.peersHoldUntil ?? 0;
                    const held = meta.peersHeldValue ?? prev;
                    if (holdUntil > now) return Math.max(next, held);
                    // Start hold; actual meta update happens below.
                    return prev;
                  }
                  return next;
                })(),
              },
            }
          : n
      ),
      nodeMeta: {
        ...state.nodeMeta,
        [nodeId]: {
          ...meta,
          lastSeenAt: now,
          lastNonZeroPeersAt: (typeof syncData.peers === 'number' && syncData.peers > 0) ? now : meta.lastNonZeroPeersAt,
          peersHoldUntil: nextPeersHoldUntil,
          peersHeldValue: nextPeersHeldValue,
        },
      },
    };
  }),

  // Node logs
  nodeLogs: {},
  addNodeLog: (nodeId, log) => set((state) => ({
    nodeLogs: {
      ...state.nodeLogs,
      [nodeId]: [...(state.nodeLogs[nodeId] || []).slice(-500), log], // Keep last 500 logs
    },
  })),
  clearNodeLogs: (nodeId) => set((state) => ({
    nodeLogs: { ...state.nodeLogs, [nodeId]: [] },
  })),

  // UI log notifications
  logNotifications: [],
  unreadLogNotifications: 0,
  addLogNotification: (n) => set((state) => {
    const timestamp = Number.isFinite(n.timestamp) ? n.timestamp : Date.now();
    const maybeCrypto = (globalThis as any).crypto as { randomUUID?: () => string } | undefined;
    const id = n.id ?? (typeof maybeCrypto?.randomUUID === 'function' ? maybeCrypto.randomUUID() : `${timestamp}-${Math.random().toString(16).slice(2)}`);

    const next: LogNotification = {
      id,
      nodeId: n.nodeId,
      nodeName: n.nodeName,
      message: n.message,
      timestamp,
    };

    const MAX = 200;
    const list = [...state.logNotifications, next].slice(-MAX);
    return {
      logNotifications: list,
      unreadLogNotifications: Math.min(state.unreadLogNotifications + 1, MAX),
    };
  }),
  markLogNotificationsRead: () => set({ unreadLogNotifications: 0 }),
  clearLogNotifications: () => set({ logNotifications: [], unreadLogNotifications: 0 }),

  // Wallets
  wallets: [],
  setWallets: (wallets) => set({ wallets }),
  addWallet: (wallet) => set((state) => ({ wallets: [...state.wallets, wallet] })),
  removeWallet: (walletId) => set((state) => ({
    wallets: state.wallets.filter((w) => w.id !== walletId),
  })),

  // System
  systemResources: null,
  setSystemResources: (resources) => set({ systemResources: resources }),
  
  // Blockchains cache
  blockchains: [],
  setBlockchains: (blockchains) => set({ blockchains }),

  // UI State
  selectedNodeId: null,
  setSelectedNodeId: (nodeId) => set({ selectedNodeId: nodeId }),
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Loading
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),
}));

export default useStore;
