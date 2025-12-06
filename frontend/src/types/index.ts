/**
 * Types partagés avec le backend
 * Node Orchestrator v1.0.3 - 205 blockchains supportées
 */

// BlockchainType étendu pour supporter 205+ blockchains
// Les principales sont typées, les autres sont string
export type MajorBlockchainType = 
  | 'bitcoin' | 'ethereum' | 'solana' | 'monero' | 'bnb'
  | 'cardano' | 'polkadot' | 'avalanche' | 'polygon' | 'cosmos'
  | 'near' | 'algorand' | 'tezos' | 'ton' | 'sui' | 'aptos';

// Type flexible pour toutes les blockchains (205+)
export type BlockchainType = MajorBlockchainType | string;

export type NodeMode = 'full' | 'pruned' | 'light';
export type NodeStatus = 'stopped' | 'starting' | 'syncing' | 'ready' | 'error' | 'stopping';

// 100% GRATUIT - Aucune limite sur le nombre de nodes
// Pas de plans d'abonnement, pas de paiements

export interface NodeConfig {
  id: string;
  name: string;
  blockchain: string; // Flexible pour 205+ blockchains
  syncMode?: string;
  mode?: NodeMode;
  network?: string;
  dataPath?: string;
  dataDir?: string;
  rpcPort?: number;
  p2pPort?: number;
  wsPort?: number;
  ports?: Record<string, number>;
  createdAt: string;
  updatedAt?: string;
}

export interface NodeState {
  id?: string;
  status: NodeStatus;
  syncProgress: number;
  blockHeight: number;
  latestBlock: number;
  peers: number;
  uptime?: number;
  lastError?: string | null;
  containerId?: string;
}

export interface NodeMetrics {
  id?: string;
  cpuUsage: number;
  memoryUsage: number;
  memoryLimit?: number;
  diskUsage: number;
  networkIn: number;
  networkOut: number;
  timestamp?: string;
}

export interface NodeInfo {
  config: NodeConfig;
  state: NodeState;
  metrics: NodeMetrics;
}

export interface WalletInfo {
  id: string;
  name: string;
  blockchain: string; // Flexible pour 205+ blockchains
  address: string;
  addressType?: string;
  balance?: string;
  isEncrypted?: boolean;
  createdAt: string;
  updatedAt?: string;
}

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

export interface NodeModeRecommendation {
  blockchain: BlockchainType;
  recommendedMode: NodeMode;
  reason: string;
  requirements: {
    minDiskGB: number;
    minMemoryGB: number;
    estimatedSyncDays: number;
  };
}

// 100% FREE - No payment interfaces needed

export interface BlockchainInfoLegacy {
  name: BlockchainType;
  displayName: string;
  symbol: string;
  color: string;
  icon: string;
}

// DEPRECATED: Utiliser frontend/src/config/blockchains.ts à la place
// Ces mappings sont conservés pour compatibilité mais ne couvrent que les principales
// Pour la liste complète de 205+ blockchains, importer depuis config/blockchains.ts

// Mapping des couleurs des blockchains (principales uniquement)
export const BLOCKCHAIN_COLORS: Record<string, string> = {
  bitcoin: '#F7931A',
  ethereum: '#627EEA',
  solana: '#14F195',
  monero: '#FF6600',
  bnb: '#F3BA2F',
  cardano: '#0033AD',
  polkadot: '#E6007A',
  avalanche: '#E84142',
  polygon: '#8247E5',
  cosmos: '#2E3148',
  near: '#00C08B',
  algorand: '#000000',
  tezos: '#2C7DF7',
  ton: '#0098EA',
  sui: '#6FBCF0',
  aptos: '#4CD7D0',
};

// Mapping des icônes des blockchains (principales uniquement)
export const BLOCKCHAIN_ICONS: Record<string, string> = {
  bitcoin: '₿',
  ethereum: 'Ξ',
  solana: '◎',
  monero: 'ɱ',
  bnb: '⬡',
  cardano: '₳',
  polkadot: '●',
  avalanche: '🔺',
  polygon: '⬡',
  cosmos: '⚛',
};

// Noms affichés (principales uniquement)
export const BLOCKCHAIN_NAMES: Record<string, string> = {
  bitcoin: 'Bitcoin',
  ethereum: 'Ethereum',
  solana: 'Solana',
  monero: 'Monero',
  bnb: 'BNB Chain',
  cardano: 'Cardano',
  polkadot: 'Polkadot',
  avalanche: 'Avalanche',
  polygon: 'Polygon',
  cosmos: 'Cosmos',
  near: 'NEAR',
  algorand: 'Algorand',
  tezos: 'Tezos',
  ton: 'TON',
  sui: 'Sui',
  aptos: 'Aptos',
};
