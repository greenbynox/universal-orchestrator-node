/**
 * ============================================================
 * TYPES - Définitions pour l'architecture blockchain extensible
 * ============================================================
 */

// ============================================================
// CATÉGORIES DE BLOCKCHAINS
// ============================================================

/** Catégorie principale de la blockchain */
export type BlockchainCategory =
  | 'layer1'        // Blockchains principales (BTC, ETH, SOL...)
  | 'layer2'        // Solutions de scaling (Arbitrum, Optimism, Polygon...)
  | 'evm'           // Chaînes compatibles EVM
  | 'privacy'       // Coins de confidentialité (XMR, ZEC, DASH...)
  | 'defi'          // Tokens DeFi natifs
  | 'meme'          // Meme coins (DOGE, SHIB, PEPE...)
  | 'stablecoin'    // Stablecoins (USDT, USDC, DAI...)
  | 'gaming'        // Gaming/Metaverse (AXS, SAND, MANA...)
  | 'ai'            // AI tokens (FET, AGIX, OCEAN...)
  | 'storage'       // Stockage décentralisé (FIL, AR, STORJ...)
  | 'oracle'        // Oracles (LINK, BAND, API3...)
  | 'exchange'      // Tokens d'exchange (BNB, CRO, FTT...)
  | 'infrastructure'// Infrastructure (DOT, ATOM, AVAX...)
  | 'nft'           // NFT-focused chains
  | 'other';        // Autres

/** Type de chaîne */
export type ChainType =
  | 'utxo'          // Bitcoin-like (BTC, LTC, BCH, DOGE...)
  | 'evm'           // Ethereum Virtual Machine compatible
  | 'solana'        // Solana-based
  | 'cosmos'        // Cosmos SDK based
  | 'substrate'     // Polkadot/Substrate based
  | 'move'          // Move-based (Aptos, Sui)
  | 'cryptonote'    // CryptoNote (Monero)
  | 'dag'           // DAG-based (IOTA, Hedera)
  | 'other';        // Autres

/** Algorithme de consensus */
export type ConsensusType =
  | 'pow'           // Proof of Work
  | 'pos'           // Proof of Stake
  | 'dpos'          // Delegated PoS
  | 'poa'           // Proof of Authority
  | 'pbft'          // Practical Byzantine Fault Tolerance
  | 'dag'           // Directed Acyclic Graph
  | 'hybrid'        // Hybride
  | 'other';

/** Mode de synchronisation du node */
export type NodeSyncMode = 'full' | 'pruned' | 'light' | 'archive';

// ============================================================
// DÉFINITION D'UNE BLOCKCHAIN
// ============================================================

export interface BlockchainDefinition {
  // === Identification ===
  id: string;                     // ID unique (lowercase, no spaces)
  name: string;                   // Nom d'affichage
  symbol: string;                 // Symbole (BTC, ETH, etc.)
  aliases?: string[];             // Alias pour la recherche
  
  // === Catégorisation ===
  category: BlockchainCategory;
  chainType: ChainType;
  consensus: ConsensusType;
  
  // === Visuel ===
  color: string;                  // Couleur principale (hex)
  icon?: string;                  // Emoji ou caractère
  logo?: string;                  // URL du logo
  
  // === Réseau ===
  chainId?: number;               // Chain ID pour EVM
  networkId?: string;             // Network ID
  mainnet: NetworkConfig;
  testnet?: NetworkConfig;
  
  // === Node Docker ===
  docker?: DockerConfig;
  
  // === Wallet ===
  wallet: WalletConfig;
  
  // === Exploration ===
  explorers?: ExplorerConfig[];
  
  // === Metadata ===
  website?: string;
  github?: string;
  documentation?: string;
  coingeckoId?: string;           // ID CoinGecko pour les prix
  coinmarketcapId?: string;       // ID CMC
  
  // === Statut ===
  isActive: boolean;              // Blockchain active
  isTestnet?: boolean;            // Mode testnet seulement
  launchDate?: string;            // Date de lancement
  
  // === Features ===
  features?: BlockchainFeatures;
}

export interface NetworkConfig {
  name: string;
  chainId?: number;             // EVM Chain ID
  rpcUrls?: string[];
  wsUrls?: string[];
  explorerUrls?: string[];      // Block explorer URLs
  nativeCurrency?: {
    name: string;
    symbol: string;
    decimals: number;
  };
  defaultPorts?: {
    rpc: number;
    p2p: number;
    ws?: number;
  };
}

export interface DockerConfig {
  images: Partial<Record<NodeSyncMode, string>>;
  requirements: Partial<Record<NodeSyncMode, ResourceRequirements>>;
  envVars?: Record<string, string>;
  volumes?: string[];
  commands?: Partial<Record<NodeSyncMode, string[]>>;
}

export interface ResourceRequirements {
  diskGB: number;
  memoryGB: number;
  cpuCores?: number;
  syncDays: number;
}

export interface WalletConfig {
  derivationPath: string;
  addressPrefix?: string;
  addressRegex?: string;
  supportsHD: boolean;
  supportsMnemonic: boolean;
  defaultAddressType?: string;
}

export interface ExplorerConfig {
  name: string;
  url: string;
  apiUrl?: string;
  apiKey?: string;
}

export interface BlockchainFeatures {
  smartContracts?: boolean;
  nft?: boolean;
  defi?: boolean;
  staking?: boolean;
  governance?: boolean;
  privacy?: boolean;
  crossChain?: boolean;
  gaming?: boolean;             // Gaming/Metaverse
  storage?: boolean;            // Decentralized storage
  evmCompatible?: boolean;      // EVM compatible chain
  ai?: boolean;                 // AI/ML features
  oracle?: boolean;             // Oracle network
  eip1559?: boolean;            // Pour EVM
  segwit?: boolean;             // Pour UTXO
  taproot?: boolean;            // Pour Bitcoin
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Créer une définition de blockchain EVM compatible
 */
export function createEVMChain(
  config: Omit<BlockchainDefinition, 'chainType' | 'wallet'> & {
    chainId: number;
    derivationPath?: string;
  }
): BlockchainDefinition {
  return {
    ...config,
    chainType: 'evm',
    wallet: {
      derivationPath: config.derivationPath || "m/44'/60'/0'/0/0",
      addressPrefix: '0x',
      addressRegex: '^0x[a-fA-F0-9]{40}$',
      supportsHD: true,
      supportsMnemonic: true,
    },
  };
}

/**
 * Créer une définition de blockchain UTXO (Bitcoin-like)
 */
export function createUTXOChain(
  config: Omit<BlockchainDefinition, 'chainType'> & {
    coinType: number;  // BIP44 coin type
  }
): BlockchainDefinition {
  return {
    ...config,
    chainType: 'utxo',
    wallet: {
      ...config.wallet,
      derivationPath: config.wallet.derivationPath || `m/84'/${config.coinType}'/0'/0/0`,
      supportsHD: true,
      supportsMnemonic: true,
    },
  };
}
