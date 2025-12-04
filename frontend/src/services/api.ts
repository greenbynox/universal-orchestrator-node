import axios from 'axios';
import type { 
  NodeInfo, 
  WalletInfo, 
  SystemResources, 
  NodeModeRecommendation,
  PricingPlan,
  Payment,
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
  (response) => response,
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

  // Créer un nouveau wallet
  create: async (params: {
    name?: string;
    blockchain: BlockchainType;
    importSeed?: string;
  }): Promise<WalletInfo> => {
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

  // Exporter la seed (ATTENTION: sensible!)
  exportSeed: async (id: string, password: string): Promise<string> => {
    const { data } = await api.post(`/wallets/${id}/export-seed`, { password });
    return data.data.seed;
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
// PAYMENTS API
// ============================================================

export const paymentsApi = {
  // Obtenir les plans disponibles
  getPlans: async (): Promise<PricingPlan[]> => {
    const { data } = await api.get('/payments/plans');
    return data.data;
  },

  // Créer un paiement
  create: async (params: {
    userId: string;
    plan: string;
    currency: string;
  }): Promise<Payment> => {
    const { data } = await api.post('/payments', params);
    return data.data;
  },

  // Obtenir un paiement par ID
  getById: async (id: string): Promise<Payment> => {
    const { data } = await api.get(`/payments/${id}`);
    return data.data;
  },

  // Obtenir l'abonnement d'un utilisateur
  getSubscription: async (userId: string): Promise<{
    subscription: any;
    limits: { maxNodes: number; cloudHosting: boolean };
    hasPremiumAccess: boolean;
  }> => {
    const { data } = await api.get(`/payments/subscription/${userId}`);
    return data.data;
  },

  // Simuler une confirmation (dev only)
  simulate: async (id: string): Promise<void> => {
    await api.post(`/payments/${id}/simulate`);
  },
};

// ============================================================
// SYSTEM API
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
    const { data } = await api.get('/system/blockchains');
    return data.data;
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

export default api;
