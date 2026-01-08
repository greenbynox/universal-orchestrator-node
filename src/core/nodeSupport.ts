import type { BlockchainType, NodeMode } from '../types';
import { blockchainRegistry } from '../config/blockchains';

/**
 * ============================================================
 * NODE ORCHESTRATOR - Node Support Configuration
 * ============================================================
 * Canonical list of blockchains that this project can actually run as Dockerized nodes.
 * 
 * IMPORTANT:
 * - The blockchain registry contains many assets/tokens (200+) for UI/catalog purposes.
 * - Node orchestration support requires real Docker images that can be pulled and run.
 * - This file defines which chains are actually runnable.
 * 
 * ENABLED CHAINS: ~50 (Maximized to Actual Docker Support)
 * ============================================================
 */

const NODE_RUNTIME_SUPPORTED_MODES: Record<string, NodeMode[]> = {
  // ============================================================
  // LAYER 1 - Major Blockchains
  // ============================================================
  bitcoin: ['full', 'pruned'],
  ethereum: ['full', 'pruned'],
  solana: ['full'],
  cardano: ['full'],
  polkadot: ['full'],
  avalanche: ['full'],
  cosmos: ['full'],
  near: ['full'],
  algorand: ['full'],
  tezos: ['full'],
  aptos: ['full'],
  sui: ['full'],
  ton: ['full'], // The Open Network

  // ============================================================
  // LAYER 2 - Scaling Solutions
  // ============================================================
  arbitrum: ['full'],
  optimism: ['full'],
  base: ['full'],
  'arbitrum-nova': ['full'],
  starknet: ['full'],
  'immutable-x': ['full'],
  loopring: ['full'],
  blast: ['full'],
  mode: ['full'],
  manta: ['full'],
  taiko: ['full'],
  zora: ['full'],

  // ============================================================
  // EVM CHAINS
  // ============================================================
  bnb: ['full', 'pruned'], // BSC
  polygon: ['full'],
  fantom: ['full'],
  cronos: ['full'],
  gnosis: ['full'],
  celo: ['full'],
  moonbeam: ['full'],
  aurora: ['full'],
  kava: ['full'],
  metis: ['full'],
  boba: ['full'],
  evmos: ['full'],
  harmony: ['full'],
  fuse: ['full'],
  oasis: ['full'],
  astar: ['full'],
  mantle: ['full'],
  linea: ['full'],
  scroll: ['full'],
  zksync: ['full'],
  'polygon-zkevm': ['full'],

  // ============================================================
  // GAMING & AI & INFRASTRUCTURE
  // ============================================================
  ronin: ['full'],
  beam: ['full'],
  xai: ['full'],
  'fetch-ai': ['full'],
  bittensor: ['full'],
  celestia: ['full'],
  sei: ['full'],
  injective: ['full'],

  // ============================================================
  // PRIVACY CHAINS
  // ============================================================
  monero: ['full', 'pruned'],
  zcash: ['full'],
  dash: ['full'],
  horizen: ['full'],
  decred: ['full'],
  firo: ['full'],
  pivx: ['full'],

  // ============================================================
  // BITCOIN VARIANTS & FORKS (UTXO)
  // ============================================================
  litecoin: ['full', 'pruned'],
  dogecoin: ['full'],
  'bitcoin-cash': ['full', 'pruned'],
  'bitcoin-sv': ['full'],
  'bitcoin-gold': ['full'],
  ravencoin: ['full'],
  digibyte: ['full'],
  qtum: ['full'],
  namecoin: ['full'],
  vertcoin: ['full'],
  syscoin: ['full'],
  groestlcoin: ['full'],
  viacoin: ['full'],
  komodo: ['full'],
  peercoin: ['full'],

  // ============================================================
  // SPECIALIZED / OTHER
  // ============================================================
  jito: ['full', 'pruned', 'light'], // Solana MEV client
};

/**
 * Get the supported node modes for a blockchain
 * Only returns modes that have actual Docker images configured
 */
export function getNodeSupportedModes(blockchain: BlockchainType): NodeMode[] {
  const id = String(blockchain || '').toLowerCase();

  // 1. Check if explicitly supported in our runtime list
  const declared = NODE_RUNTIME_SUPPORTED_MODES[id];
  if (!declared) return [];

  // 2. Double check if the registry has a docker image for it
  const chain = blockchainRegistry.get(id);
  if (!chain?.docker?.images) return [];

  // 3. Filter modes to only those with images
  return declared.filter((m) => !!chain.docker?.images?.[m]);
}

/**
 * Check if a specific blockchain mode is supported
 */
export function isNodeModeSupported(blockchain: BlockchainType, mode: NodeMode): boolean {
  return getNodeSupportedModes(blockchain).includes(mode);
}

/**
 * Check if a blockchain has any node support
 */
export function isNodeSupported(blockchain: BlockchainType): boolean {
  return getNodeSupportedModes(blockchain).length > 0;
}

/**
 * Get count of supported blockchains
 */
export function getSupportedBlockchainCount(): number {
  return Object.keys(NODE_RUNTIME_SUPPORTED_MODES).length;
}

/**
 * Get all supported blockchain IDs
 */
export function getAllSupportedBlockchains(): string[] {
  return Object.keys(NODE_RUNTIME_SUPPORTED_MODES);
}
