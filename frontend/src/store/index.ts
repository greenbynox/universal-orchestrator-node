import { create, StoreApi } from 'zustand';
import type { NodeInfo, WalletInfo, SystemResources, NodeStatus, NodeMetrics } from '../types';

interface AppState {
  // Connection state
  isConnected: boolean;
  setConnected: (connected: boolean) => void;

  // Nodes
  nodes: NodeInfo[];
  setNodes: (nodes: NodeInfo[]) => void;
  addNode: (node: NodeInfo) => void;
  removeNode: (nodeId: string) => void;
  updateNodeStatus: (nodeId: string, status: NodeStatus, error?: string) => void;
  updateNodeMetrics: (nodeId: string, metrics: Partial<NodeMetrics>) => void;
  updateNodeSync: (nodeId: string, syncData: { progress: number; currentBlock: number; highestBlock: number; peers: number }) => void;
  
  // Node logs
  nodeLogs: Record<string, string[]>;
  addNodeLog: (nodeId: string, log: string) => void;
  clearNodeLogs: (nodeId: string) => void;

  // Wallets
  wallets: WalletInfo[];
  setWallets: (wallets: WalletInfo[]) => void;
  addWallet: (wallet: WalletInfo) => void;
  removeWallet: (walletId: string) => void;

  // System
  systemResources: SystemResources | null;
  setSystemResources: (resources: SystemResources) => void;

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
  setNodes: (nodes: NodeInfo[]) => set({ nodes }),
  addNode: (node: NodeInfo) => set((state: AppState) => ({ nodes: [...state.nodes, node] })),
  removeNode: (nodeId) => set((state) => ({
    nodes: state.nodes.filter((n) => n?.config?.id !== nodeId),
  })),
  updateNodeStatus: (nodeId, status, error) => set((state) => ({
    nodes: state.nodes.map((n) =>
      n?.config?.id === nodeId
        ? { ...n, state: { ...n.state, status, lastError: error } }
        : n
    ),
  })),
  updateNodeMetrics: (nodeId, metrics) => set((state) => ({
    nodes: state.nodes.map((n) =>
      n.config.id === nodeId
        ? { ...n, metrics: { ...n.metrics, ...metrics } }
        : n
    ),
  })),
  updateNodeSync: (nodeId, syncData) => set((state) => ({
    nodes: state.nodes.map((n) =>
      n.config.id === nodeId
        ? {
            ...n,
            state: {
              ...n.state,
              syncProgress: syncData.progress,
              blockHeight: syncData.currentBlock,
              latestBlock: syncData.highestBlock,
              peers: syncData.peers,
            },
          }
        : n
    ),
  })),

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
