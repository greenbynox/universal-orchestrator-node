/**
 * ============================================================
 * NODE ORCHESTRATOR - Wallets API Routes
 * ============================================================
 * Routes API pour la gestion des wallets
 */

import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { walletManager } from '../core/WalletManager';
import { BlockchainType, CreateWalletRequest } from '../types';
import { logger } from '../utils/logger';

const router: RouterType = Router();

// ============================================================
// GET /wallets - Liste tous les wallets
// ============================================================
router.get('/', async (_req: Request, res: Response) => {
  try {
    const wallets = walletManager.getAllWallets();
    
    res.json({
      success: true,
      data: wallets,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Erreur GET /wallets', { error });
    res.status(500).json({
      success: false,
      error: (error as Error).message,
      timestamp: new Date(),
    });
  }
});

// ============================================================
// GET /wallets/:id - Détails d'un wallet
// ============================================================
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const wallet = walletManager.getWallet(req.params.id);
    
    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'Wallet non trouvé',
        timestamp: new Date(),
      });
    }
    
    res.json({
      success: true,
      data: wallet,
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
      timestamp: new Date(),
    });
  }
});

// ============================================================
// POST /wallets - Créer un nouveau wallet
// ============================================================
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, blockchain, importSeed } = req.body as CreateWalletRequest;
    
    // Validation
    if (!blockchain) {
      return res.status(400).json({
        success: false,
        error: 'Blockchain requise',
        timestamp: new Date(),
      });
    }
    
    const validBlockchains: BlockchainType[] = ['bitcoin', 'ethereum', 'solana', 'monero', 'bnb'];
    if (!validBlockchains.includes(blockchain)) {
      return res.status(400).json({
        success: false,
        error: `Blockchain invalide. Valeurs acceptées: ${validBlockchains.join(', ')}`,
        timestamp: new Date(),
      });
    }
    
    // Créer le wallet
    const wallet = await walletManager.createWallet({
      name,
      blockchain,
      importSeed,
    });
    
    res.status(201).json({
      success: true,
      data: wallet,
      message: 'Wallet créé avec succès',
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Erreur POST /wallets', { error });
    res.status(500).json({
      success: false,
      error: (error as Error).message,
      timestamp: new Date(),
    });
  }
});

// ============================================================
// GET /wallets/:id/address - Adresse d'un wallet
// ============================================================
router.get('/:id/address', async (req: Request, res: Response) => {
  try {
    const address = walletManager.getAddress(req.params.id);
    
    res.json({
      success: true,
      data: { address },
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
      timestamp: new Date(),
    });
  }
});

// ============================================================
// GET /wallets/:id/balance - Solde d'un wallet
// ============================================================
router.get('/:id/balance', async (req: Request, res: Response) => {
  try {
    const balance = await walletManager.getBalance(req.params.id);
    
    res.json({
      success: true,
      data: { balance },
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
      timestamp: new Date(),
    });
  }
});

// ============================================================
// POST /wallets/:id/export-seed - Exporter la seed (sensible!)
// ============================================================
router.post('/:id/export-seed', async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Mot de passe requis',
        timestamp: new Date(),
      });
    }
    
    const seed = walletManager.exportSeed(req.params.id, password);
    
    // Attention: cette opération est sensible
    logger.warn(`Seed exportée pour wallet ${req.params.id}`);
    
    res.json({
      success: true,
      data: {
        seed,
        warning: 'Ne partagez JAMAIS cette seed phrase. Quiconque la possède peut accéder à vos fonds.',
      },
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
      timestamp: new Date(),
    });
  }
});

// ============================================================
// PATCH /wallets/:id - Renommer un wallet
// ============================================================
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Nouveau nom requis',
        timestamp: new Date(),
      });
    }
    
    const wallet = walletManager.renameWallet(req.params.id, name);
    
    res.json({
      success: true,
      data: wallet,
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
      timestamp: new Date(),
    });
  }
});

// ============================================================
// DELETE /wallets/:id - Supprimer un wallet
// ============================================================
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    walletManager.deleteWallet(req.params.id);
    
    res.json({
      success: true,
      message: 'Wallet supprimé',
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
      timestamp: new Date(),
    });
  }
});

// ============================================================
// GET /wallets/blockchain/:blockchain - Wallets par blockchain
// ============================================================
router.get('/blockchain/:blockchain', async (req: Request, res: Response) => {
  try {
    const blockchain = req.params.blockchain as BlockchainType;
    const wallets = walletManager.getWalletsByBlockchain(blockchain);
    
    res.json({
      success: true,
      data: wallets,
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
      timestamp: new Date(),
    });
  }
});

export default router;
