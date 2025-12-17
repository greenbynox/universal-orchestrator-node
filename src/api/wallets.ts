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
import { sanitizeInput, validateWalletId, validatePassword, validateSeedPhrase } from '../utils/validation';
import rateLimit from 'express-rate-limit';

const router: RouterType = Router();

// Rate limiter spécifique pour l'export de seed (opération sensible)
const seedExportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 3, // Maximum 3 exports par heure
  message: 'Trop de tentatives d\'export. Réessayez dans 1 heure.',
});

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

// ============================================================
// GET /wallets/:id - Détails d'un wallet
// ============================================================
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const walletId = sanitizeInput(req.params.id);
    if (!validateWalletId(walletId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de wallet invalide',
        timestamp: new Date(),
      });
    }

    const wallet = walletManager.getWallet(walletId);

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
    const { name, blockchain, importSeed, password } = req.body as CreateWalletRequest;
    
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

    // Password required for software wallets
    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Mot de passe requis',
        timestamp: new Date(),
      });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        error: passwordValidation.reason,
        timestamp: new Date(),
      });
    }

    if (importSeed) {
      const ok = validateSeedPhrase(importSeed);
      if (!ok) {
        return res.status(400).json({
          success: false,
          error: 'Seed phrase invalide',
          timestamp: new Date(),
        });
      }
    }
    
    // Créer le wallet
    const wallet = await walletManager.createWallet({
      name,
      blockchain,
      importSeed,
      password,
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
// POST /wallets/:id/seed - Exporter la seed (sensible!)
// ============================================================
router.post('/:id/seed', seedExportLimiter, async (req: Request, res: Response) => {
  try {
    const walletId = sanitizeInput(req.params.id);
    if (!validateWalletId(walletId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de wallet invalide',
        timestamp: new Date(),
      });
    }
    
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Mot de passe requis',
        timestamp: new Date(),
      });
    }
    
    // Valider le mot de passe
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        error: passwordValidation.reason,
        timestamp: new Date(),
      });
    }
    
    const seed = walletManager.exportSeed(walletId, password);
    
    // Attention: cette opération est sensible
    logger.warn(`Seed exportée pour wallet ${walletId}`, { ip: req.ip });
    
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

// Backwards compatible alias
router.post('/:id/export-seed', seedExportLimiter, async (req: Request, res: Response) => {
  try {
    const walletId = sanitizeInput(req.params.id);
    if (!validateWalletId(walletId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de wallet invalide',
        timestamp: new Date(),
      });
    }

    const { password } = req.body;
    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Mot de passe requis',
        timestamp: new Date(),
      });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        error: passwordValidation.reason,
        timestamp: new Date(),
      });
    }

    const seed = walletManager.exportSeed(walletId, password);
    logger.warn(`Seed exportée pour wallet ${walletId} (legacy route)`, { ip: req.ip });

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
// POST /wallets/:id/verify-password - Vérifier le mot de passe (sans export)
// ============================================================
router.post('/:id/verify-password', async (req: Request, res: Response) => {
  try {
    const walletId = sanitizeInput(req.params.id);
    if (!validateWalletId(walletId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de wallet invalide',
        timestamp: new Date(),
      });
    }

    const { password } = req.body as { password?: string };
    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Mot de passe requis',
        timestamp: new Date(),
      });
    }

    const valid = walletManager.verifyPassword(walletId, password);
    res.json({
      success: true,
      data: { valid },
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
export default router;
