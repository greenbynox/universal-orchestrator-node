/**
 * ============================================================
 * NODE ORCHESTRATOR - Configuration
 * ============================================================
 * Gestion centralisée de la configuration
 */

import dotenv from 'dotenv';
import path from 'path';
import { BlockchainType, NodeMode, PricingPlan, SubscriptionPlan } from '../types';

// Charger les variables d'environnement
dotenv.config();

// ============================================================
// CONFIGURATION GÉNÉRALE
// ============================================================

export const config = {
  // Environnement
  env: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',
  
  // Serveur
  server: {
    port: parseInt(process.env.PORT || '3001'),
    host: process.env.HOST || '0.0.0.0',
  },
  
  // Sécurité
  security: {
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
    encryptionKey: process.env.ENCRYPTION_KEY || 'dev-encryption-key-32chars!!',
  },
  
  // Chemins
  paths: {
    data: path.resolve(process.env.NODES_DATA_PATH || './data'),
    nodes: path.resolve(process.env.NODES_DATA_PATH || './data/nodes'),
    wallets: path.resolve(process.env.WALLETS_DATA_PATH || './data/wallets'),
    logs: path.resolve(process.env.LOGS_PATH || './data/logs'),
  },
  
  // Docker
  docker: {
    socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock',
    networkName: 'node-orchestrator-network',
  },
  
  // Limites
  limits: {
    maxNodesFree: parseInt(process.env.MAX_NODES_FREE || '3'),
    maxNodesPremium: process.env.MAX_NODES_PREMIUM === 'unlimited' ? Infinity : parseInt(process.env.MAX_NODES_PREMIUM || '100'),
  },
  
  // Paiements
  payments: {
    btcAddress: process.env.PAYMENT_BTC_ADDRESS || '',
    ethAddress: process.env.PAYMENT_ETH_ADDRESS || '',
    usdcContract: process.env.PAYMENT_USDC_CONTRACT || '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  },
  
  // APIs externes
  external: {
    infuraProjectId: process.env.INFURA_PROJECT_ID || '',
    alchemyApiKey: process.env.ALCHEMY_API_KEY || '',
  },
};

// ============================================================
// CONFIGURATION DES BLOCKCHAINS
// ============================================================

export interface BlockchainConfig {
  name: BlockchainType;
  displayName: string;
  symbol: string;
  color: string;
  icon: string;
  dockerImages: Record<NodeMode, string>;
  defaultPorts: { rpc: number; p2p: number; ws?: number };
  requirements: {
    full: { diskGB: number; memoryGB: number; syncDays: number };
    pruned: { diskGB: number; memoryGB: number; syncDays: number };
    light: { diskGB: number; memoryGB: number; syncDays: number };
  };
  derivationPath: string;
  rpcMethods: {
    getBlockHeight: string;
    getSyncStatus: string;
    getPeers: string;
  };
}

export const BLOCKCHAIN_CONFIGS: Record<BlockchainType, BlockchainConfig> = {
  bitcoin: {
    name: 'bitcoin',
    displayName: 'Bitcoin',
    symbol: 'BTC',
    color: '#F7931A',
    icon: '₿',
    dockerImages: {
      full: 'kylemanna/bitcoind:latest',
      pruned: 'kylemanna/bitcoind:latest',
      light: 'lncm/neutrino:latest',
    },
    defaultPorts: { rpc: 8332, p2p: 8333 },
    requirements: {
      full: { diskGB: 600, memoryGB: 4, syncDays: 7 },
      pruned: { diskGB: 10, memoryGB: 2, syncDays: 3 },
      light: { diskGB: 1, memoryGB: 1, syncDays: 0.1 },
    },
    derivationPath: "m/84'/0'/0'/0/0",
    rpcMethods: {
      getBlockHeight: 'getblockcount',
      getSyncStatus: 'getblockchaininfo',
      getPeers: 'getpeerinfo',
    },
  },
  
  ethereum: {
    name: 'ethereum',
    displayName: 'Ethereum',
    symbol: 'ETH',
    color: '#627EEA',
    icon: 'Ξ',
    dockerImages: {
      full: 'ethereum/client-go:latest',
      pruned: 'ethereum/client-go:latest',
      light: 'ethereum/client-go:latest',
    },
    defaultPorts: { rpc: 8545, p2p: 30303, ws: 8546 },
    requirements: {
      full: { diskGB: 1000, memoryGB: 16, syncDays: 7 },
      pruned: { diskGB: 250, memoryGB: 8, syncDays: 2 },
      light: { diskGB: 1, memoryGB: 2, syncDays: 0.1 },
    },
    derivationPath: "m/44'/60'/0'/0/0",
    rpcMethods: {
      getBlockHeight: 'eth_blockNumber',
      getSyncStatus: 'eth_syncing',
      getPeers: 'net_peerCount',
    },
  },
  
  solana: {
    name: 'solana',
    displayName: 'Solana',
    symbol: 'SOL',
    color: '#14F195',
    icon: '◎',
    dockerImages: {
      full: 'solanalabs/solana:latest',
      pruned: 'solanalabs/solana:latest',
      light: 'solanalabs/solana:latest',
    },
    defaultPorts: { rpc: 8899, p2p: 8001, ws: 8900 },
    requirements: {
      full: { diskGB: 2000, memoryGB: 128, syncDays: 1 },
      pruned: { diskGB: 500, memoryGB: 64, syncDays: 0.5 },
      light: { diskGB: 50, memoryGB: 16, syncDays: 0.1 },
    },
    derivationPath: "m/44'/501'/0'/0'",
    rpcMethods: {
      getBlockHeight: 'getSlot',
      getSyncStatus: 'getHealth',
      getPeers: 'getClusterNodes',
    },
  },
  
  monero: {
    name: 'monero',
    displayName: 'Monero',
    symbol: 'XMR',
    color: '#FF6600',
    icon: 'ɱ',
    dockerImages: {
      full: 'sethsimmons/simple-monerod:latest',
      pruned: 'sethsimmons/simple-monerod:latest',
      light: 'sethsimmons/simple-monerod:latest',
    },
    defaultPorts: { rpc: 18081, p2p: 18080 },
    requirements: {
      full: { diskGB: 180, memoryGB: 4, syncDays: 3 },
      pruned: { diskGB: 50, memoryGB: 2, syncDays: 1 },
      light: { diskGB: 5, memoryGB: 1, syncDays: 0.1 },
    },
    derivationPath: "m/44'/128'/0'/0/0",
    rpcMethods: {
      getBlockHeight: 'get_block_count',
      getSyncStatus: 'sync_info',
      getPeers: 'get_connections',
    },
  },
  
  bnb: {
    name: 'bnb',
    displayName: 'BNB Chain',
    symbol: 'BNB',
    color: '#F3BA2F',
    icon: '🔶',
    dockerImages: {
      full: 'ghcr.io/bnb-chain/bsc:latest',
      pruned: 'ghcr.io/bnb-chain/bsc:latest',
      light: 'ghcr.io/bnb-chain/bsc:latest',
    },
    defaultPorts: { rpc: 8545, p2p: 30311, ws: 8546 },
    requirements: {
      full: { diskGB: 2500, memoryGB: 32, syncDays: 14 },
      pruned: { diskGB: 300, memoryGB: 16, syncDays: 3 },
      light: { diskGB: 10, memoryGB: 4, syncDays: 0.1 },
    },
    derivationPath: "m/44'/60'/0'/0/0", // Même que ETH (EVM compatible)
    rpcMethods: {
      getBlockHeight: 'eth_blockNumber',
      getSyncStatus: 'eth_syncing',
      getPeers: 'net_peerCount',
    },
  },
};

// ============================================================
// CONFIGURATION DES PRIX
// ============================================================

export const PRICING_PLANS: Record<SubscriptionPlan, PricingPlan> = {
  free: {
    plan: 'free',
    priceUSD: 0,
    maxNodes: 3,
    features: [
      'Jusqu\'à 3 nodes locaux',
      'Dashboard basique',
      'Wallets HD',
      'Support communauté',
    ],
    cloudHosting: false,
    support: 'community',
  },
  basic: {
    plan: 'basic',
    priceUSD: 9.99,
    maxNodes: 10,
    features: [
      'Jusqu\'à 10 nodes locaux',
      'Dashboard avancé',
      'Wallets HD illimités',
      'Support email',
      'Alertes personnalisées',
    ],
    cloudHosting: false,
    support: 'email',
  },
  premium: {
    plan: 'premium',
    priceUSD: 29.99,
    maxNodes: 50,
    features: [
      'Jusqu\'à 50 nodes',
      'Cloud hosting inclus',
      'API accès complet',
      'Support prioritaire',
      'Plugins premium',
      'Multi-instances',
    ],
    cloudHosting: true,
    support: 'priority',
  },
  enterprise: {
    plan: 'enterprise',
    priceUSD: 99.99,
    maxNodes: Infinity,
    features: [
      'Nodes illimités',
      'Cloud dédié',
      'SLA garanti',
      'Support 24/7',
      'Personnalisation',
      'Formation incluse',
    ],
    cloudHosting: true,
    support: 'priority',
  },
};

// ============================================================
// HELPERS
// ============================================================

/**
 * Obtenir la configuration d'une blockchain
 */
export function getBlockchainConfig(blockchain: BlockchainType): BlockchainConfig {
  return BLOCKCHAIN_CONFIGS[blockchain];
}

/**
 * Obtenir le prochain port disponible pour un type de node
 */
export function getNextAvailablePort(blockchain: BlockchainType, existingPorts: number[]): { rpc: number; p2p: number; ws?: number } {
  const base = BLOCKCHAIN_CONFIGS[blockchain].defaultPorts;
  let offset = 0;
  
  while (existingPorts.includes(base.rpc + offset) || existingPorts.includes(base.p2p + offset)) {
    offset += 100;
  }
  
  return {
    rpc: base.rpc + offset,
    p2p: base.p2p + offset,
    ws: base.ws ? base.ws + offset : undefined,
  };
}

export default config;
