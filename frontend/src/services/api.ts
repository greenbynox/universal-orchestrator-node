import axios from 'axios';
import type { 
  NodeInfo, 
  WalletInfo, 
  SystemResources, 
  NodeModeRecommendation,
  BlockchainType,
  NodeMode,
} from '../types';

const API_BASE = '/api';

// Timeout configurations for different types of operations
const TIMEOUTS = {
  DEFAULT: 30000,     // 30 seconds for regular operations
  LONG_RUNNING: 120000, // 2 minutes for Docker operations (start, stop, restart)
};

// Instance Axios configurée
const api = axios.create({
  baseURL: API_BASE,
  timeout: TIMEOUTS.DEFAULT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = error.response?.data?.error || error.message || 'Une erreur est survenue';
    
    // Provide better messages for timeout errors
    if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      message = 'L\'opération prend plus de temps que prévu. Veuillez vérifier l\'état du node dans quelques instants.';
    }
    
    console.error('API Error:', message);
    throw new Error(message);
  }
);

// ============================================================
// NODES API
// ============================================================

export const nodesApi = {
  // Obtenir tous les nodes
  getAll: async (): Promise<NodeInfo[]> => {
    const { data } = await api.get('/nodes');
    return data.data;
  },

  // Obtenir un node par ID
  getById: async (id: string): Promise<NodeInfo> => {
    const { data } = await api.get(`/nodes/${id}`);
    return data.data;
  },

  // Créer un nouveau node
  create: async (params: {
    name?: string;
    blockchain: BlockchainType;
    mode?: NodeMode;
  }): Promise<NodeInfo> => {
    const { data } = await api.post('/nodes', params, { timeout: TIMEOUTS.LONG_RUNNING });
    return data.data;
  },

  // Démarrer un node
  start: async (id: string): Promise<void> => {
    await api.post(`/nodes/${id}/start`, {}, { timeout: TIMEOUTS.LONG_RUNNING });
  },

  // Arrêter un node
  stop: async (id: string): Promise<void> => {
    await api.post(`/nodes/${id}/stop`, {}, { timeout: TIMEOUTS.LONG_RUNNING });
  },

  // Redémarrer un node
  restart: async (id: string): Promise<void> => {
    await api.post(`/nodes/${id}/restart`, {}, { timeout: TIMEOUTS.LONG_RUNNING });
  },

  // Supprimer un node
  delete: async (id: string): Promise<void> => {
    await api.delete(`/nodes/${id}`, { timeout: TIMEOUTS.LONG_RUNNING });
  },

  // Obtenir les logs d'un node
  getLogs: async (id: string, lines: number = 100): Promise<string[]> => {
    const { data } = await api.get(`/nodes/${id}/logs`, { params: { lines } });
    return data.data;
  },

  // Obtenir les recommandations
  getRecommendations: async (): Promise<{
    system: SystemResources;
    recommendations: NodeModeRecommendation[];
  }> => {
    const { data } = await api.get('/nodes/recommendations');
    return data.data;
  },

  // Compter les nodes par blockchain
  getCounts: async (): Promise<Record<BlockchainType, number>> => {
    const { data } = await api.get('/nodes/counts');
    return data.data;
  },
};

// ============================================================
// WALLETS API
// ============================================================

export const walletsApi = {
  // Obtenir tous les wallets
  getAll: async (): Promise<WalletInfo[]> => {
    const { data } = await api.get('/wallets');
    return data.data;
  },

  // Obtenir un wallet par ID
  getById: async (id: string): Promise<WalletInfo> => {
    const { data } = await api.get(`/wallets/${id}`);
    return data.data;
  },

  // Créer un nouveau wallet (avec chiffrement AES-256-GCM)
  create: async (params: {
    name?: string;
    blockchain: string;
    importSeed?: string;
    addressType?: string;
    password: string; // Required for encryption
  }): Promise<WalletInfo & { mnemonic?: string }> => {
    const { data } = await api.post('/wallets', params);
    return data.data;
  },

  // Obtenir l'adresse
  getAddress: async (id: string): Promise<string> => {
    const { data } = await api.get(`/wallets/${id}/address`);
    return data.data.address;
  },

  // Obtenir le solde
  getBalance: async (id: string): Promise<string> => {
    const { data } = await api.get(`/wallets/${id}/balance`);
    return data.data.balance;
  },

  // Obtenir la seed phrase (nécessite mot de passe pour déchiffrer)
  getSeed: async (id: string, password: string): Promise<string | null> => {
    const { data } = await api.post(`/wallets/${id}/seed`, { password });
    return data.data?.seed || null;
  },

  // Vérifier le mot de passe du wallet
  verifyPassword: async (id: string, password: string): Promise<boolean> => {
    const { data } = await api.post(`/wallets/${id}/verify-password`, { password });
    return data.data?.valid || false;
  },

  // Renommer un wallet
  rename: async (id: string, name: string): Promise<WalletInfo> => {
    const { data } = await api.patch(`/wallets/${id}`, { name });
    return data.data;
  },

  // Supprimer un wallet
  delete: async (id: string): Promise<void> => {
    await api.delete(`/wallets/${id}`);
  },
};

// ============================================================
// SYSTEM API (100% FREE - No payments needed)
// ============================================================

export const systemApi = {
  // Obtenir les ressources système
  getResources: async (): Promise<SystemResources> => {
    const { data } = await api.get('/system/resources');
    return data.data;
  },

  // Obtenir les métriques en temps réel
  getMetrics: async (): Promise<{
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
  }> => {
    const { data } = await api.get('/system/metrics');
    return data.data;
  },

  // Obtenir les blockchains supportées
  getBlockchains: async (): Promise<any[]> => {
    const { data } = await api.get('/blockchains');
    return data.data || [];
  },

  // Health check
  health: async (): Promise<{
    status: string;
    uptime: number;
    version: string;
  }> => {
    const { data } = await api.get('/system/health');
    return data.data;
  },
};

// ============================================================
// DASHBOARD & ALERTS
// ============================================================

export const dashboardApi = {
  getStats: async (): Promise<any> => {
    const { data } = await api.get('/dashboard/stats');
    return data;
  },
};

export const alertsApi = {
  list: async (params: { limit?: number; offset?: number; resolved?: boolean | null } = {}): Promise<{ total: number; items: any[] }> => {
    const { data } = await api.get('/alerts', { params });
    return { total: data.total, items: data.items };
  },
  resolve: async (id: string): Promise<void> => {
    await api.post(`/alerts/${id}/resolve`);
  },
};

export default api;
