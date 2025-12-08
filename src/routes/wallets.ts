import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import { logger } from '../utils/logger';
import alertManager from '../core/AlertManager';
import ledgerWalletService from '../services/wallets/LedgerWalletService';
import trezorWalletService from '../services/wallets/TrezorWalletService';

const router: ExpressRouter = Router();

// ============================================================
// HARDWARE WALLET ROUTES
// Mounted at /api/wallets/hardware
// ============================================================

/**
 * GET /api/wallets/hardware/ledger/connect
 * Connexion à un hardware wallet Ledger
 */
router.get('/ledger/connect', async (req: Request, res: Response) => {
  try {
    await ledgerWalletService.connect();
    logger.info('Ledger wallet connected');
    res.json({
      success: true,
      message: 'Ledger wallet connecté avec succès',
      device: 'ledger',
    });
  } catch (error) {
    logger.error('Ledger connection failed', error);
    await alertManager.trigger({
      type: 'CUSTOM',
      severity: 'CRITICAL',
      message: `Erreur de connexion Ledger: ${(error as Error).message}`,
      timestamp: new Date(),
    });
    res.status(503).json({
      success: false,
      error: (error as Error).message,
      device: 'ledger',
    });
  }
});

/**
 * GET /api/wallets/hardware/ledger/disconnect
 * Déconnexion du hardware wallet Ledger
 */
router.get('/ledger/disconnect', async (req: Request, res: Response) => {
  try {
    await ledgerWalletService.disconnect();
    logger.info('Ledger wallet disconnected');
    res.json({
      success: true,
      message: 'Ledger wallet déconnecté',
      device: 'ledger',
    });
  } catch (error) {
    logger.error('Ledger disconnection failed', error);
    res.status(503).json({
      success: false,
      error: (error as Error).message,
      device: 'ledger',
    });
  }
});

/**
 * POST /api/wallets/hardware/ledger/address
 * Récupérer une adresse d'un Ledger
 * Body: { blockchain: 'bitcoin' | 'ethereum' | 'solana' | 'cosmos', derivationPath: string }
 */
router.post('/ledger/address', async (req: Request, res: Response) => {
  try {
    const { blockchain, derivationPath } = req.body;

    if (!blockchain || !derivationPath) {
      return res.status(400).json({
        success: false,
        error: 'blockchain et derivationPath sont requis',
      });
    }

    const address = await ledgerWalletService.getAddress(blockchain, derivationPath);
    logger.info(`Retrieved address from Ledger for ${blockchain}`);

    res.json({
      success: true,
      address,
      blockchain,
      derivationPath,
      device: 'ledger',
    });
  } catch (error) {
    logger.error('Failed to get address from Ledger', error);
    res.status(503).json({
      success: false,
      error: (error as Error).message,
      device: 'ledger',
    });
  }
});

/**
 * POST /api/wallets/hardware/trezor/connect
 * Connexion à un hardware wallet Trezor
 */
router.post('/trezor/connect', async (_req: Request, res: Response) => {
  try {
    await trezorWalletService.connect();
    logger.info('Trezor wallet connected');
    res.json({
      success: true,
      message: 'Trezor wallet connecté avec succès',
      device: 'trezor',
    });
  } catch (error) {
    logger.error('Trezor connection failed', error);
    await alertManager.trigger({
      type: 'CUSTOM',
      severity: 'CRITICAL',
      message: `Erreur de connexion Trezor: ${(error as Error).message}`,
      timestamp: new Date(),
    });
    res.status(503).json({
      success: false,
      error: (error as Error).message,
      device: 'trezor',
    });
  }
});

/**
 * GET /api/wallets/hardware/trezor/disconnect
 * Déconnexion du hardware wallet Trezor
 */
router.get('/trezor/disconnect', async (_req: Request, res: Response) => {
  try {
    await trezorWalletService.disconnect();
    logger.info('Trezor wallet disconnected');
    res.json({
      success: true,
      message: 'Trezor wallet déconnecté',
      device: 'trezor',
    });
  } catch (error) {
    logger.error('Trezor disconnection failed', error);
    res.status(503).json({
      success: false,
      error: (error as Error).message,
      device: 'trezor',
    });
  }
});

/**
 * POST /api/wallets/hardware/trezor/address
 * Récupérer une adresse d'un Trezor
 * Body: { blockchain: 'bitcoin' | 'ethereum' | 'solana' | 'cosmos', derivationPath: string }
 */
router.post('/trezor/address', async (req: Request, res: Response) => {
  try {
    const { blockchain, derivationPath } = req.body;

    if (!blockchain || !derivationPath) {
      return res.status(400).json({
        success: false,
        error: 'blockchain et derivationPath sont requis',
      });
    }

    const address = await trezorWalletService.getAddress(blockchain, derivationPath);
    logger.info(`Retrieved address from Trezor for ${blockchain}`);

    res.json({
      success: true,
      address,
      blockchain,
      derivationPath,
      device: 'trezor',
    });
  } catch (error) {
    logger.error('Failed to get address from Trezor', error);
    res.status(503).json({
      success: false,
      error: (error as Error).message,
      device: 'trezor',
    });
  }
});

/**
 * POST /api/wallets/hardware/sign
 * Signer une transaction avec un hardware wallet
 * Body: { device: 'ledger' | 'trezor', transaction: any }
 */
router.post('/sign', async (req: Request, res: Response) => {
  try {
    const { device, transaction } = req.body;

    if (!device || !transaction) {
      return res.status(400).json({
        success: false,
        error: 'device et transaction sont requis',
      });
    }

    let signature: string;

    if (device === 'ledger') {
      signature = await ledgerWalletService.signTransaction(transaction);
    } else if (device === 'trezor') {
      signature = await trezorWalletService.signTransaction(transaction);
    } else {
      return res.status(400).json({
        success: false,
        error: `Device non supporté: ${device}`,
      });
    }

    logger.info(`Transaction signed with ${device}`);

    res.json({
      success: true,
      signature,
      device,
    });
  } catch (error) {
    logger.error('Failed to sign transaction', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

export default router;
