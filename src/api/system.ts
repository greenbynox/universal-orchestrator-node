/**
 * ============================================================
 * NODE ORCHESTRATOR - System API Routes
 * ============================================================
 * Routes API pour les informations système
 */

import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { getSystemResources, getCurrentMetrics, getAllRecommendations } from '../utils/system';
import { BLOCKCHAIN_CONFIGS } from '../config';

const router: RouterType = Router();

// ============================================================
// GET /system/resources - Ressources système
// ============================================================
router.get('/resources', async (_req: Request, res: Response) => {
  try {
    const resources = await getSystemResources();
    
    res.json({
      success: true,
      data: resources,
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
// GET /system/metrics - Métriques en temps réel
// ============================================================
router.get('/metrics', async (_req: Request, res: Response) => {
  try {
    const metrics = await getCurrentMetrics();
    
    res.json({
      success: true,
      data: metrics,
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
// GET /system/blockchains - Liste des blockchains supportées
// ============================================================
router.get('/blockchains', async (_req: Request, res: Response) => {
  try {
    const blockchains = Object.values(BLOCKCHAIN_CONFIGS).map(config => ({
      name: config.name,
      displayName: config.displayName,
      symbol: config.symbol,
      color: config.color,
      icon: config.icon,
      requirements: config.requirements,
    }));
    
    res.json({
      success: true,
      data: blockchains,
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
// GET /system/recommendations - Toutes les recommandations
// ============================================================
router.get('/recommendations', async (_req: Request, res: Response) => {
  try {
    const recommendations = await getAllRecommendations();
    
    res.json({
      success: true,
      data: recommendations,
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
// GET /system/health - Health check
// ============================================================
router.get('/health', async (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      uptime: process.uptime(),
      version: '1.0.3',
    },
    timestamp: new Date(),
  });
});

export default router;
