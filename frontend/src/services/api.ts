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

// Instance Axios configurée
const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour les erreurs
api.interceptors.response.use(
  (response) => {
    console.log('[API Interceptor] Response received:', {
      url: response.config.url,
      status: response.status,
      data: response.data,
    });
    return response;
  },
  (error) => {
    const message = error.response?.data?.error || error.message || 'Une erreur est survenue';
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
    const { data } = await api.post('/nodes', params);
    return data.data;
  },

  // Démarrer un node
  start: async (id: string): Promise<void> => {
    await api.post(`/nodes/${id}/start`);
  },

  // Arrêter un node
  stop: async (id: string): Promise<void> => {
    await api.post(`/nodes/${id}/stop`);
  },

  // Redémarrer un node
  restart: async (id: string): Promise<void> => {
    await api.post(`/nodes/${id}/restart`);
  },

  // Supprimer un node
  delete: async (id: string): Promise<void> => {
    await api.delete(`/nodes/${id}`);
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
    console.log('[systemApi.getResources] Calling API...');
    const response = await api.get('/system/resources');
    console.log('[systemApi.getResources] Raw API response:', response);
    console.log('[systemApi.getResources] response.data:', response.data);
    console.log('[systemApi.getResources] response.data.data:', response.data.data);
    const result = response.data.data;
    console.log('[systemApi.getResources] Returning:', result);
    return result;
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
