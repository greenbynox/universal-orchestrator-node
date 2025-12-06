/**
 * ============================================================
 * NODE ORCHESTRATOR - Types & Interfaces
 * ============================================================
 * Définitions TypeScript pour l'ensemble du projet
 */

// ============================================================
// BLOCKCHAIN TYPES
// ============================================================

/** Blockchains supportées */
export type BlockchainType = 'bitcoin' | 'ethereum' | 'solana' | 'monero' | 'bnb';

/** Mode de synchronisation du node */
export type NodeMode = 'full' | 'pruned' | 'light';

/** Statut du node */
export type NodeStatus = 
  | 'stopped'      // Node arrêté
  | 'starting'     // En cours de démarrage
  | 'syncing'      // Synchronisation en cours
  | 'ready'        // Prêt et synchronisé
  | 'error'        // Erreur
  | 'stopping';    // En cours d'arrêt

// ============================================================
// NODE INTERFACES
// ============================================================

/** Configuration d'un node */
export interface NodeConfig {
  id: string;
  name: string;
  blockchain: BlockchainType;
  mode: NodeMode;
  dataPath: string;
  rpcPort: number;
  p2pPort: number;
  wsPort?: number;
  customConfig?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/** État actuel d'un node */
export interface NodeState {
  id: string;
  status: NodeStatus;
  syncProgress: number;        // 0-100
  blockHeight: number;
  latestBlock: number;
  peers: number;
  uptime: number;              // secondes
  lastError?: string;
  containerId?: string;
  processId?: number;
}

/** Métriques d'un node */
export interface NodeMetrics {
  id: string;
  cpuUsage: number;            // pourcentage
  memoryUsage: number;         // MB
  memoryLimit: number;         // MB
  diskUsage: number;           // GB
  networkIn: number;           // MB/s
  networkOut: number;          // MB/s
  timestamp: Date;
}

/** Informations complètes d'un node */
export interface NodeInfo {
  config: NodeConfig;
  state: NodeState;
  metrics: NodeMetrics;
}

/** Logs d'un node */
export interface NodeLog {
  id: string;
  nodeId: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// ============================================================
// WALLET INTERFACES
// ============================================================

/** Type de wallet */
export type WalletType = 'hd' | 'imported' | 'hardware';

/** Configuration d'un wallet */
export interface WalletConfig {
  id: string;
  name: string;
  blockchain: BlockchainType;
  type: WalletType;
  derivationPath: string;
  createdAt: Date;
}

/** Données sécurisées du wallet (chiffrées) */
export interface WalletSecureData {
  encryptedSeed?: string;      // Seed chiffrée (BIP39)
  encryptedPrivateKey?: string;
  publicKey: string;
  address: string;
}

/** Informations wallet pour l'UI */
export interface WalletInfo {
  id: string;
  name: string;
  blockchain: BlockchainType;
  address: string;
  balance?: string;
  createdAt: Date;
}

// ============================================================
// SYSTEM INTERFACES
// ============================================================

/** Ressources système disponibles */
export interface SystemResources {
  cpuCores: number;
  cpuModel: string;
  totalMemoryGB: number;
  availableMemoryGB: number;
  totalDiskGB: number;
  availableDiskGB: number;
  platform: 'windows' | 'darwin' | 'linux';
  arch: string;
}

/** Recommandation de mode node basée sur les ressources */
export interface NodeModeRecommendation {
  blockchain: BlockchainType;
  recommendedMode: NodeMode;
  reason: string;
  requirements: {
    diskGB: number;
    memoryGB: number;
    syncDays: number;
  };
}

// ============================================================
// API INTERFACES
// ============================================================

/** Réponse API standard */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
}

/** Pagination */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/** Requête de création de node */
export interface CreateNodeRequest {
  name?: string;
  blockchain: BlockchainType;
  mode?: NodeMode;
  customConfig?: Record<string, unknown>;
}

/** Requête de création de wallet */
export interface CreateWalletRequest {
  name?: string;
  blockchain: BlockchainType;
  importSeed?: string;
}

// ============================================================
// EVENTS (WebSocket)
// ============================================================

export type EventType = 
  | 'node:status'
  | 'node:metrics'
  | 'node:log'
  | 'node:sync'
  | 'wallet:balance'
  | 'payment:status'
  | 'system:resources';

export interface WebSocketEvent<T = unknown> {
  type: EventType;
  payload: T;
  timestamp: Date;
}

// ============================================================
// PLUGIN SYSTEM
// ============================================================

/** Interface pour plugins de blockchain */
export interface BlockchainPlugin {
  name: BlockchainType;
  displayName: string;
  icon: string;
  version: string;
  
  // Méthodes requises
  getDockerImage(mode: NodeMode): string;
  getDefaultPorts(): { rpc: number; p2p: number; ws?: number };
  getStartCommand(config: NodeConfig): string[];
  parseBlockHeight(rpcResponse: unknown): number;
  parseSyncStatus(rpcResponse: unknown): { syncing: boolean; progress: number };
  
  // Wallet support
  supportsHDWallet: boolean;
  getDerivationPath(): string;
  generateAddress(publicKey: string): string;
}
