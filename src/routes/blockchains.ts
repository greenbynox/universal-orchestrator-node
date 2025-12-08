/**
 * ============================================================
 * BLOCKCHAIN API ROUTES - API pour le registre de blockchains
 * ============================================================
 */

import { Router, Request, Response } from 'express';
import { blockchainRegistry } from '../config/blockchains';
import { BlockchainCategory } from '../config/blockchains/types';
import { logger } from '../utils/logger';

const router: Router = Router();

// ============================================================
// ROUTES
// ============================================================

/**
 * GET /api/blockchains
 * Retourne toutes les blockchains avec filtrage optionnel
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const { 
      category, 
      chainType, 
      search,
      active,
      limit,
      offset 
    } = req.query;

    let chains = blockchainRegistry.getAll();

    // Filter by category
    if (category && typeof category === 'string') {
      chains = chains.filter(c => c.category === category);
    }

    // Filter by chain type
    if (chainType && typeof chainType === 'string') {
      chains = chains.filter(c => c.chainType === chainType);
    }

    // Filter by search query
    if (search && typeof search === 'string') {
      const query = search.toLowerCase();
      chains = chains.filter(c => 
        c.name.toLowerCase().includes(query) ||
        c.symbol.toLowerCase().includes(query) ||
        c.id.toLowerCase().includes(query)
      );
    }

    // Filter by active status
    if (active === 'true') {
      chains = chains.filter(c => c.isActive);
    } else if (active === 'false') {
      chains = chains.filter(c => !c.isActive);
    }

    // Get total before pagination
    const total = chains.length;

    // Pagination
    const limitNum = limit ? parseInt(limit as string, 10) : undefined;
    const offsetNum = offset ? parseInt(offset as string, 10) : 0;
    
    if (limitNum) {
      chains = chains.slice(offsetNum, offsetNum + limitNum);
    }

    // Simplify response for frontend
    const simplified = chains.map(c => ({
      id: c.id,
      name: c.name,
      symbol: c.symbol,
      category: c.category,
      chainType: c.chainType,
      color: c.color,
      isActive: c.isActive,
      features: c.features,
      website: c.website,
      coingeckoId: c.coingeckoId,
    }));

    res.json({
      success: true,
      total,
      count: simplified.length,
      offset: offsetNum,
      data: simplified,
    });
  } catch (error) {
    logger.error('Error fetching blockchains:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch blockchains',
    });
  }
});

/**
 * GET /api/blockchains/stats
 * Retourne les statistiques du registre
 */
router.get('/stats', (_req: Request, res: Response) => {
  try {
    const chains = blockchainRegistry.getAll();
    
    // Count by category
    const byCategory: Record<string, number> = {};
    const byChainType: Record<string, number> = {};
    let activeCount = 0;
    let evmCount = 0;

    chains.forEach(c => {
      byCategory[c.category] = (byCategory[c.category] || 0) + 1;
      byChainType[c.chainType] = (byChainType[c.chainType] || 0) + 1;
      if (c.isActive) activeCount++;
      if (c.chainType === 'evm') evmCount++;
    });

    res.json({
      success: true,
      data: {
        total: chains.length,
        active: activeCount,
        evmCompatible: evmCount,
        categories: Object.keys(byCategory).length,
        byCategory,
        byChainType,
      },
    });
  } catch (error) {
    logger.error('Error fetching blockchain stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch blockchain stats',
    });
  }
});

/**
 * GET /api/blockchains/categories
 * Retourne les catégories disponibles
 */
router.get('/categories', (_req: Request, res: Response) => {
  try {
    const chains = blockchainRegistry.getAll();
    const categories = [...new Set(chains.map(c => c.category))].sort();
    
    const data = categories.map(cat => ({
      id: cat,
      name: getCategoryDisplayName(cat as BlockchainCategory),
      count: chains.filter(c => c.category === cat).length,
    }));

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories',
    });
  }
});

/**
 * GET /api/blockchains/:id/modes
 * Retourne les modes de synchronisation supportés pour une blockchain
 */
router.get('/:id/modes', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const chain = blockchainRegistry.get(id);

    if (!chain) {
      return res.status(404).json({
        success: false,
        error: `Blockchain '${id}' not found`,
      });
    }

    // Get supported modes from docker config
    const supportedModes = chain.docker?.images ? Object.keys(chain.docker.images) : ['full', 'pruned', 'light'];
    
    // Map to include requirements for each mode
    const modes = supportedModes.map((mode: any) => {
      // Default requirements per mode (proper fallback based on mode)
      const defaultsByMode: Record<string, { diskGB: number; memoryGB: number; cpuCores: number; syncDays: number }> = {
        full: { diskGB: 500, memoryGB: 8, cpuCores: 2, syncDays: 7 },
        pruned: { diskGB: 100, memoryGB: 4, cpuCores: 2, syncDays: 3 },
        light: { diskGB: 10, memoryGB: 2, cpuCores: 1, syncDays: 0 },
        archive: { diskGB: 2000, memoryGB: 16, cpuCores: 4, syncDays: 14 },
      };
      
      const requirements = chain.docker?.requirements?.[mode as any] || defaultsByMode[mode as string] || defaultsByMode.full;

      return {
        id: mode,
        name: mode.charAt(0).toUpperCase() + mode.slice(1),
        supported: true,
        requirements: {
          diskGB: requirements.diskGB,
          memoryGB: requirements.memoryGB,
          cpuCores: requirements.cpuCores || 2,
          syncDays: requirements.syncDays,
        },
      };
    });

    res.json({
      success: true,
      data: {
        chainId: chain.id,
        chainName: chain.name,
        modes: modes,
      },
    });
  } catch (error) {
    logger.error('Error fetching blockchain modes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch blockchain modes',
    });
  }
});

/**
 * GET /api/blockchains/:id
 * Retourne une blockchain spécifique
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const chain = blockchainRegistry.get(id);

    if (!chain) {
      return res.status(404).json({
        success: false,
        error: `Blockchain '${id}' not found`,
      });
    }

    res.json({
      success: true,
      data: chain,
    });
  } catch (error) {
    logger.error('Error fetching blockchain:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch blockchain',
    });
  }
});

/**
 * GET /api/blockchains/search/:query
 * Recherche de blockchains
 */
router.get('/search/:query', (req: Request, res: Response) => {
  try {
    const { query } = req.params;
    const results = blockchainRegistry.search(query);

    const simplified = results.map(c => ({
      id: c.id,
      name: c.name,
      symbol: c.symbol,
      category: c.category,
      chainType: c.chainType,
      color: c.color,
      isActive: c.isActive,
    }));

    res.json({
      success: true,
      count: simplified.length,
      data: simplified,
    });
  } catch (error) {
    logger.error('Error searching blockchains:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search blockchains',
    });
  }
});

// ============================================================
// HELPERS
// ============================================================

function getCategoryDisplayName(category: BlockchainCategory): string {
  const names: Record<BlockchainCategory, string> = {
    layer1: 'Layer 1',
    layer2: 'Layer 2',
    evm: 'EVM Compatible',
    privacy: 'Privacy',
    defi: 'DeFi',
    meme: 'Meme Coins',
    stablecoin: 'Stablecoins',
    gaming: 'Gaming',
    ai: 'AI & ML',
    storage: 'Storage',
    oracle: 'Oracles',
    exchange: 'Exchange',
    infrastructure: 'Infrastructure',
    nft: 'NFT',
    other: 'Other',
  };
  return names[category] || category;
}

export default router;
