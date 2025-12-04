/**
 * ============================================================
 * NODE ORCHESTRATOR - Nodes API Routes
 * ============================================================
 * Routes API pour la gestion des nodes
 */

import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { nodeManager } from '../core/NodeManager';
import { BlockchainType, NodeMode, CreateNodeRequest, ApiResponse } from '../types';
import { logger } from '../utils/logger';
import { recommendNodeMode, getSystemResources, getAllRecommendations } from '../utils/system';
import { sanitizeInput, validateNodeId } from '../utils/validation';

const router: RouterType = Router();

// ============================================================
// GET /nodes - Liste tous les nodes
// ============================================================
router.get('/', async (_req: Request, res: Response) => {
  try {
    const nodes = nodeManager.getAllNodes();
    
    const response: ApiResponse = {
      success: true,
      data: nodes,
      timestamp: new Date(),
    };
    
    res.json(response);
  } catch (error) {
    logger.error('Erreur GET /nodes', { error });
    res.status(500).json({
      success: false,
      error: (error as Error).message,
      timestamp: new Date(),
    });
  }
});

// ============================================================
// GET /nodes/recommendations - Recommandations basées sur le système
// ============================================================
router.get('/recommendations', async (_req: Request, res: Response) => {
  try {
    const recommendations = await getAllRecommendations();
    const systemResources = await getSystemResources();
    
    res.json({
      success: true,
      data: {
        system: systemResources,
        recommendations,
      },
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Erreur GET /nodes/recommendations', { error });
    res.status(500).json({
      success: false,
      error: (error as Error).message,
      timestamp: new Date(),
    });
  }
});

// ============================================================
// GET /nodes/counts - Nombre de nodes par blockchain
// ============================================================
router.get('/counts', async (_req: Request, res: Response) => {
  try {
    const counts = nodeManager.getNodeCounts();
    
    res.json({
      success: true,
      data: counts,
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
// GET /nodes/:id - Détails d'un node
// ============================================================
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const nodeId = sanitizeInput(req.params.id);
    if (!validateNodeId(nodeId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de node invalide',
        timestamp: new Date(),
      });
    }
    
    const node = nodeManager.getNode(nodeId);
    
    if (!node) {
      return res.status(404).json({
        success: false,
        error: 'Node non trouvé',
        timestamp: new Date(),
      });
    }
    
    res.json({
      success: true,
      data: node,
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
// POST /nodes - Créer un nouveau node
// ============================================================
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, blockchain, mode, customConfig } = req.body as CreateNodeRequest;
    
    // Sanitize inputs
    const sanitizedName = name ? sanitizeInput(name, 100) : undefined;
    
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
    
    // Créer le node
    const node = await nodeManager.createNode({
      name: sanitizedName,
      blockchain,
      mode: mode as NodeMode,
      customConfig,
    });
    
    res.status(201).json({
      success: true,
      data: node,
      message: 'Node créé avec succès',
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Erreur POST /nodes', { error });
    res.status(500).json({
      success: false,
      error: (error as Error).message,
      timestamp: new Date(),
    });
  }
});

// ============================================================
// POST /nodes/:id/start - Démarrer un node
// ============================================================
router.post('/:id/start', async (req: Request, res: Response) => {
  try {
    await nodeManager.startNode(req.params.id);
    
    res.json({
      success: true,
      message: 'Node démarré',
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error(`Erreur démarrage node ${req.params.id}`, { error });
    res.status(500).json({
      success: false,
      error: (error as Error).message,
      timestamp: new Date(),
    });
  }
});

// ============================================================
// POST /nodes/:id/stop - Arrêter un node
// ============================================================
router.post('/:id/stop', async (req: Request, res: Response) => {
  try {
    await nodeManager.stopNode(req.params.id);
    
    res.json({
      success: true,
      message: 'Node arrêté',
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error(`Erreur arrêt node ${req.params.id}`, { error });
    res.status(500).json({
      success: false,
      error: (error as Error).message,
      timestamp: new Date(),
    });
  }
});

// ============================================================
// POST /nodes/:id/restart - Redémarrer un node
// ============================================================
router.post('/:id/restart', async (req: Request, res: Response) => {
  try {
    await nodeManager.restartNode(req.params.id);
    
    res.json({
      success: true,
      message: 'Node redémarré',
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
// DELETE /nodes/:id - Supprimer un node
// ============================================================
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await nodeManager.deleteNode(req.params.id);
    
    res.json({
      success: true,
      message: 'Node supprimé',
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
// GET /nodes/:id/logs - Logs d'un node
// ============================================================
router.get('/:id/logs', async (req: Request, res: Response) => {
  try {
    const lines = parseInt(req.query.lines as string) || 100;
    const logs = await nodeManager.getNodeLogs(req.params.id, lines);
    
    res.json({
      success: true,
      data: logs,
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
// GET /nodes/:id/recommend-mode - Recommandation de mode pour un node
// ============================================================
router.get('/:id/recommend-mode', async (req: Request, res: Response) => {
  try {
    const node = nodeManager.getNode(req.params.id);
    if (!node) {
      return res.status(404).json({
        success: false,
        error: 'Node non trouvé',
        timestamp: new Date(),
      });
    }
    
    const recommendation = await recommendNodeMode(node.config.blockchain);
    
    res.json({
      success: true,
      data: recommendation,
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
