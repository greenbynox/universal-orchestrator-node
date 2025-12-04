/**
 * ============================================================
 * NODE ORCHESTRATOR - Payments API Routes
 * ============================================================
 * Routes API pour les paiements et abonnements
 */

import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { paymentManager } from '../core/PaymentManager';
import { PaymentCurrency, SubscriptionPlan } from '../types';
import { logger } from '../utils/logger';

const router: RouterType = Router();

// ============================================================
// GET /payments/plans - Liste des plans disponibles
// ============================================================
router.get('/plans', async (_req: Request, res: Response) => {
  try {
    const plans = paymentManager.getAvailablePlans();
    
    res.json({
      success: true,
      data: plans,
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
// GET /payments/currencies - Devises supportées
// ============================================================
router.get('/currencies', async (_req: Request, res: Response) => {
  try {
    const currencies = paymentManager.getSupportedCurrencies();
    
    res.json({
      success: true,
      data: currencies,
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
// POST /payments - Créer un paiement
// ============================================================
router.post('/', async (req: Request, res: Response) => {
  try {
    const { userId, plan, currency } = req.body;
    
    // Validation
    if (!userId || !plan || !currency) {
      return res.status(400).json({
        success: false,
        error: 'userId, plan et currency sont requis',
        timestamp: new Date(),
      });
    }
    
    const validPlans: SubscriptionPlan[] = ['basic', 'premium', 'enterprise'];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({
        success: false,
        error: `Plan invalide. Valeurs acceptées: ${validPlans.join(', ')}`,
        timestamp: new Date(),
      });
    }
    
    const validCurrencies: PaymentCurrency[] = ['BTC', 'ETH', 'USDC', 'SOL', 'BNB'];
    if (!validCurrencies.includes(currency)) {
      return res.status(400).json({
        success: false,
        error: `Devise invalide. Valeurs acceptées: ${validCurrencies.join(', ')}`,
        timestamp: new Date(),
      });
    }
    
    // Créer le paiement
    const payment = await paymentManager.createPayment(userId, plan, currency);
    
    res.status(201).json({
      success: true,
      data: payment,
      message: 'Paiement créé. Envoyez le montant à l\'adresse indiquée.',
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Erreur POST /payments', { error });
    res.status(500).json({
      success: false,
      error: (error as Error).message,
      timestamp: new Date(),
    });
  }
});

// ============================================================
// GET /payments/:id - Détails d'un paiement
// ============================================================
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const payment = paymentManager.getPayment(req.params.id);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Paiement non trouvé',
        timestamp: new Date(),
      });
    }
    
    res.json({
      success: true,
      data: payment,
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
// GET /payments/user/:userId - Historique des paiements d'un utilisateur
// ============================================================
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const payments = paymentManager.getPaymentHistory(req.params.userId);
    
    res.json({
      success: true,
      data: payments,
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
// GET /payments/subscription/:userId - Abonnement d'un utilisateur
// ============================================================
router.get('/subscription/:userId', async (req: Request, res: Response) => {
  try {
    const subscription = paymentManager.getSubscription(req.params.userId);
    const limits = paymentManager.getUserLimits(req.params.userId);
    
    res.json({
      success: true,
      data: {
        subscription,
        limits,
        hasPremiumAccess: paymentManager.hasPremiumAccess(req.params.userId),
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
// POST /payments/:id/simulate - Simuler une confirmation (DEV ONLY)
// ============================================================
router.post('/:id/simulate', async (req: Request, res: Response) => {
  try {
    // Seulement en développement
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        error: 'Non disponible en production',
        timestamp: new Date(),
      });
    }
    
    await paymentManager.simulatePaymentConfirmation(req.params.id);
    
    res.json({
      success: true,
      message: 'Paiement simulé comme confirmé',
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
