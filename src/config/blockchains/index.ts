/**
 * ============================================================
 * BLOCKCHAIN REGISTRY - Architecture Extensible pour 100+ Chains
 * ============================================================
 * 
 * Cette architecture permet d'ajouter facilement de nouvelles blockchains
 * sans modifier le code principal. Chaque blockchain est définie dans
 * un fichier séparé et automatiquement chargée.
 */

import { BlockchainDefinition, BlockchainCategory, ChainType } from './types';

// ============================================================
// REGISTRE CENTRAL DES BLOCKCHAINS
// ============================================================

class BlockchainRegistry {
  private chains: Map<string, BlockchainDefinition> = new Map();
  private byCategory: Map<BlockchainCategory, string[]> = new Map();
  private byChainType: Map<ChainType, string[]> = new Map();

  /**
   * Enregistrer une nouvelle blockchain
   */
  register(chain: BlockchainDefinition): void {
    // Validation
    if (this.chains.has(chain.id)) {
      console.warn(`Blockchain ${chain.id} already registered, skipping...`);
      return;
    }

    // Ajouter au registre principal
    this.chains.set(chain.id, chain);

    // Indexer par catégorie
    const catList = this.byCategory.get(chain.category) || [];
    catList.push(chain.id);
    this.byCategory.set(chain.category, catList);

    // Indexer par type de chain
    const typeList = this.byChainType.get(chain.chainType) || [];
    typeList.push(chain.id);
    this.byChainType.set(chain.chainType, typeList);
  }

  /**
   * Enregistrer plusieurs blockchains
   */
  registerMany(chains: BlockchainDefinition[]): void {
    chains.forEach(chain => this.register(chain));
  }

  /**
   * Obtenir une blockchain par ID
   */
  get(id: string): BlockchainDefinition | undefined {
    return this.chains.get(id);
  }

  /**
   * Obtenir toutes les blockchains
   */
  getAll(): BlockchainDefinition[] {
    return Array.from(this.chains.values());
  }

  /**
   * Obtenir les blockchains par catégorie
   */
  getByCategory(category: BlockchainCategory): BlockchainDefinition[] {
    const ids = this.byCategory.get(category) || [];
    return ids.map(id => this.chains.get(id)!).filter(Boolean);
  }

  /**
   * Obtenir les blockchains par type
   */
  getByChainType(type: ChainType): BlockchainDefinition[] {
    const ids = this.byChainType.get(type) || [];
    return ids.map(id => this.chains.get(id)!).filter(Boolean);
  }

  /**
   * Vérifier si une blockchain est supportée
   */
  isSupported(id: string): boolean {
    return this.chains.has(id);
  }

  /**
   * Obtenir le nombre de blockchains supportées
   */
  count(): number {
    return this.chains.size;
  }

  /**
   * Liste tous les IDs supportés
   */
  listIds(): string[] {
    return Array.from(this.chains.keys());
  }

  /**
   * Rechercher des blockchains
   */
  search(query: string): BlockchainDefinition[] {
    const lowerQuery = query.toLowerCase();
    return this.getAll().filter(chain =>
      chain.id.toLowerCase().includes(lowerQuery) ||
      chain.name.toLowerCase().includes(lowerQuery) ||
      chain.symbol.toLowerCase().includes(lowerQuery) ||
      chain.aliases?.some(a => a.toLowerCase().includes(lowerQuery))
    );
  }
}

// Instance singleton du registre
export const blockchainRegistry = new BlockchainRegistry();

// ============================================================
// IMPORT DES DÉFINITIONS DE BLOCKCHAINS
// ============================================================

// Layer 1 - Principales
import { LAYER1_CHAINS } from './chains/layer1';
import { BITCOIN_VARIANTS } from './chains/bitcoin-variants';
import { EVM_CHAINS } from './chains/evm';
import { ADDITIONAL_EVM_CHAINS } from './chains/additional-evm';
import { LAYER2_CHAINS } from './chains/layer2';
import { PRIVACY_CHAINS } from './chains/privacy';
import { DEFI_CHAINS } from './chains/defi';
import { MEME_CHAINS } from './chains/meme';
import { STABLECOINS } from './chains/stablecoins';
import { GAMING_CHAINS } from './chains/gaming';
import { AI_CHAINS } from './chains/ai';
import { STORAGE_CHAINS } from './chains/storage';
import { ORACLE_CHAINS } from './chains/oracle';
import { EXCHANGE_CHAINS } from './chains/exchange';
import { INFRASTRUCTURE_CHAINS } from './chains/infrastructure';
import { NFT_CHAINS } from './chains/nft';

// Enregistrer toutes les blockchains
blockchainRegistry.registerMany([
  ...LAYER1_CHAINS,
  ...BITCOIN_VARIANTS,
  ...EVM_CHAINS,
  ...ADDITIONAL_EVM_CHAINS,
  ...LAYER2_CHAINS,
  ...PRIVACY_CHAINS,
  ...DEFI_CHAINS,
  ...MEME_CHAINS,
  ...STABLECOINS,
  ...GAMING_CHAINS,
  ...AI_CHAINS,
  ...STORAGE_CHAINS,
  ...ORACLE_CHAINS,
  ...EXCHANGE_CHAINS,
  ...INFRASTRUCTURE_CHAINS,
  ...NFT_CHAINS,
]);

// Export des types
export * from './types';

// Export du nombre total
export const TOTAL_SUPPORTED_CHAINS = blockchainRegistry.count();

console.log(`✅ Blockchain Registry: ${TOTAL_SUPPORTED_CHAINS} chains loaded`);
