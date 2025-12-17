import type { BlockchainType, NodeMode } from '../types';
import { blockchainRegistry } from '../config/blockchains';

/**
 * Canonical list of blockchains that this project can actually run as Dockerized nodes
 * with the current NodeManager implementation.
 *
 * IMPORTANT:
 * - The blockchain registry contains many assets/tokens for UI/catalog purposes.
 * - Node orchestration support is intentionally much narrower.
 */
const NODE_RUNTIME_SUPPORTED_MODES: Record<string, NodeMode[]> = {
  bitcoin: ['full', 'pruned'],
  // Modern geth removed/disabled the legacy "light" sync mode.
  // Keep the runtime truth here so the UI/API never offers a mode we cannot actually run.
  ethereum: ['full', 'pruned'],
  solana: ['full'],
  monero: ['full', 'pruned'],
  bnb: ['full', 'pruned'],
};

export function getNodeSupportedModes(blockchain: BlockchainType): NodeMode[] {
  const id = String(blockchain || '').toLowerCase();
  const declared = NODE_RUNTIME_SUPPORTED_MODES[id] || [];

  const chain = blockchainRegistry.get(id);
  if (!chain?.docker?.images) return [];

  // Only keep modes that have an actual image configured for that chain.
  return declared.filter((m) => !!chain.docker?.images?.[m]);
}

export function isNodeModeSupported(blockchain: BlockchainType, mode: NodeMode): boolean {
  return getNodeSupportedModes(blockchain).includes(mode);
}

export function isNodeSupported(blockchain: BlockchainType): boolean {
  return getNodeSupportedModes(blockchain).length > 0;
}
