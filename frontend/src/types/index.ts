/**
 * Types partagés avec le backend
 */

export type BlockchainType = 'bitcoin' | 'ethereum' | 'solana' | 'monero' | 'bnb';
export type NodeMode = 'full' | 'pruned' | 'light';
export type NodeStatus = 'stopped' | 'starting' | 'syncing' | 'ready' | 'error' | 'stopping';
export type PaymentCurrency = 'BTC' | 'ETH' | 'USDC' | 'SOL' | 'BNB';
export type SubscriptionPlan = 'free' | 'basic' | 'premium' | 'enterprise';

export interface NodeConfig {
  id: string;
  name: string;
  blockchain: BlockchainType;
  mode: NodeMode;
  dataPath: string;
  rpcPort: number;
  p2pPort: number;
  wsPort?: number;
  createdAt: string;
  updatedAt: string;
}

export interface NodeState {
  id: string;
  status: NodeStatus;
  syncProgress: number;
  blockHeight: number;
  latestBlock: number;
  peers: number;
  uptime: number;
  lastError?: string;
  containerId?: string;
}

export interface NodeMetrics {
  id: string;
  cpuUsage: number;
  memoryUsage: number;
  memoryLimit: number;
  diskUsage: number;
  networkIn: number;
  networkOut: number;
  timestamp: string;
}

export interface NodeInfo {
  config: NodeConfig;
  state: NodeState;
  metrics: NodeMetrics;
}

export interface WalletInfo {
  id: string;
  name: string;
  blockchain: BlockchainType;
  address: string;
  balance?: string;
  createdAt: string;
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

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: PaymentCurrency;
  amountUSD: number;
  status: 'pending' | 'confirmed' | 'failed' | 'expired';
  txHash?: string;
  toAddress: string;
  plan: SubscriptionPlan;
  createdAt: string;
  expiresAt: string;
  confirmedAt?: string;
}

export interface PricingPlan {
  plan: SubscriptionPlan;
  priceUSD: number;
  maxNodes: number;
  features: string[];
  cloudHosting: boolean;
  support: 'community' | 'email' | 'priority';
}

export interface BlockchainInfo {
  name: BlockchainType;
  displayName: string;
  symbol: string;
  color: string;
  icon: string;
}

// Mapping des couleurs des blockchains
export const BLOCKCHAIN_COLORS: Record<BlockchainType, string> = {
  bitcoin: '#F7931A',
  ethereum: '#627EEA',
  solana: '#14F195',
  monero: '#FF6600',
  bnb: '#F3BA2F',
};

// Mapping des icônes des blockchains
export const BLOCKCHAIN_ICONS: Record<BlockchainType, string> = {
  bitcoin: '₿',
  ethereum: 'Ξ',
  solana: '◎',
  monero: 'ɱ',
  bnb: '🔶',
};

// Noms affichés
export const BLOCKCHAIN_NAMES: Record<BlockchainType, string> = {
  bitcoin: 'Bitcoin',
  ethereum: 'Ethereum',
  solana: 'Solana',
  monero: 'Monero',
  bnb: 'BNB Chain',
};
