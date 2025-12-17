import axios from 'axios';
import type { 
  NodeInfo, 
  WalletInfo, 
  SystemResources, 
  NodeModeRecommendation,
  NodeConnectionInfo,
  NodeRpcTestResult,
  BlockchainType,
  NodeMode,
} from '../types';

const API_BASE = '/api';

// Keep in sync with SettingsPage
const SETTINGS_STORAGE_KEY = 'orchestratorSettings';

function readRuntimeAuthFromLocalStorage(): {
  mode?: string;
  token?: string;
  basicUser?: string;
  basicPass?: string;
} {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as any;
    return {
      mode: typeof parsed?.apiAuthMode === 'string' ? parsed.apiAuthMode : undefined,
      token: typeof parsed?.apiToken === 'string' ? parsed.apiToken : undefined,
      basicUser: typeof parsed?.apiBasicUser === 'string' ? parsed.apiBasicUser : undefined,
      basicPass: typeof parsed?.apiBasicPass === 'string' ? parsed.apiBasicPass : undefined,
    };
  } catch {
    return {};
  }
}

function computeAuthorizationHeader(): string | undefined {
  const local = readRuntimeAuthFromLocalStorage();

  const envMode = (import.meta as any).env?.VITE_API_AUTH_MODE?.toLowerCase?.() as string | undefined;
  const envToken = (import.meta as any).env?.VITE_API_TOKEN as string | undefined;
  const envBasicUser = (import.meta as any).env?.VITE_API_BASIC_USER as string | undefined;
  const envBasicPass = (import.meta as any).env?.VITE_API_BASIC_PASS as string | undefined;

  const mode = (local.mode ?? envMode ?? 'none').toLowerCase();
  if (mode === 'token') {
    const token = (local.token ?? envToken ?? '').trim();
    return token ? `Bearer ${token}` : undefined;
  }
  if (mode === 'basic') {
    const u = (local.basicUser ?? envBasicUser ?? '').trim();
    const p = (local.basicPass ?? envBasicPass ?? '').trim();
    return u && p ? `Basic ${btoa(`${u}:${p}`)}` : undefined;
  }
  return undefined;
}

// Timeouts (ms)
const DEFAULT_TIMEOUT = 30000;        // requêtes courtes
const LONG_TIMEOUT = 180000;          // opérations longues (pull d'images, start/restart de node)

// Instance Axios configurée
const api = axios.create({
  baseURL: API_BASE,
  timeout: DEFAULT_TIMEOUT,
  headers: (() => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const authMode = (import.meta as any).env?.VITE_API_AUTH_MODE?.toLowerCase?.() as string | undefined;
    const token = (import.meta as any).env?.VITE_API_TOKEN as string | undefined;
    const basicUser = (import.meta as any).env?.VITE_API_BASIC_USER as string | undefined;
    const basicPass = (import.meta as any).env?.VITE_API_BASIC_PASS as string | undefined;

    if (authMode === 'token' && token) {
      headers.Authorization = `Bearer ${token}`;
    } else if (authMode === 'basic' && basicUser && basicPass) {
      headers.Authorization = `Basic ${btoa(`${basicUser}:${basicPass}`)}`;
    }

    return headers;
  })(),
});

// Inject auth headers per-request so runtime settings changes apply immediately.
api.interceptors.request.use((cfg) => {
  const auth = computeAuthorizationHeader();
  const headers: any = cfg.headers ?? {};

  if (auth) {
    headers.Authorization = auth;
  } else {
    // Ensure we don't keep stale Authorization when switching to mode=none
    if (headers.Authorization) delete headers.Authorization;
    if (headers.authorization) delete headers.authorization;
  }

  cfg.headers = headers;
  return cfg;
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
    const status = error.response?.status;
    const url = error.config?.url;
    console.error('API Error:', { message, status, url });

    const err = new Error(message) as Error & { status?: number; url?: string; details?: any };
    err.status = status;
    err.url = url;
    err.details = error.response?.data;
    throw err;
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
    await api.post(`/nodes/${id}/start`, undefined, { timeout: LONG_TIMEOUT });
  },

  // Arrêter un node
  stop: async (id: string): Promise<void> => {
    await api.post(`/nodes/${id}/stop`, undefined, { timeout: LONG_TIMEOUT });
  },

  // Redémarrer un node
  restart: async (id: string): Promise<void> => {
    await api.post(`/nodes/${id}/restart`, undefined, { timeout: LONG_TIMEOUT });
  },

  // Supprimer un node
  delete: async (id: string): Promise<void> => {
    await api.delete(`/nodes/${id}`, { timeout: LONG_TIMEOUT });
  },

  // Obtenir les logs d'un node
  getLogs: async (id: string, lines: number = 100): Promise<string[]> => {
    const { data } = await api.get(`/nodes/${id}/logs`, { params: { lines } });
    return data.data;
  },

  // Endpoints de connexion (RPC/WS/P2P)
  getConnection: async (id: string): Promise<NodeConnectionInfo> => {
    const { data } = await api.get(`/nodes/${id}/connection`);
    return data.data;
  },

  // Tester rapidement si le RPC répond
  rpcTest: async (id: string): Promise<NodeRpcTestResult> => {
    const { data } = await api.get(`/nodes/${id}/rpc-test`, { timeout: 5000 });
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
// SETTINGS API
// ============================================================

export const settingsApi = {
  get: async (): Promise<Record<string, any>> => {
    const { data } = await api.get('/system/settings');
    return data.data;
  },

  update: async (partial: Record<string, any>): Promise<Record<string, any>> => {
    const { data } = await api.put('/system/settings', partial);
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
