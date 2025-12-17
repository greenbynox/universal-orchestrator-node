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
import { sanitizeInput as secureSanitizeInput, validateCreateNodeRequest } from '../core/security';
import { validateNodeId, parsePositiveInt } from '../utils/validation';

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
// GET /nodes/:id/connection - Endpoints de connexion (RPC/WS/P2P)
// ============================================================
router.get('/:id/connection', async (req: Request, res: Response) => {
  try {
    const nodeId = secureSanitizeInput(req.params.id);
    if (!validateNodeId(nodeId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de node invalide',
        timestamp: new Date(),
      });
    }

    const info = nodeManager.getNodeConnectionInfo(nodeId);
    res.json({ success: true, data: info, timestamp: new Date() });
  } catch (error) {
    const message = (error as Error).message;
    const status = (/^Node non trouvé:/i.test(message) || /node non trouvé/i.test(message)) ? 404 : 500;
    res.status(status).json({ success: false, error: message, timestamp: new Date() });
  }
});

// ============================================================
// GET /nodes/:id/rpc-test - Tester si le RPC répond
// ============================================================
router.get('/:id/rpc-test', async (req: Request, res: Response) => {
  try {
    const nodeId = secureSanitizeInput(req.params.id);
    if (!validateNodeId(nodeId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de node invalide',
        timestamp: new Date(),
      });
    }

    const result = await nodeManager.testNodeRpc(nodeId);
    res.json({ success: true, data: result, timestamp: new Date() });
  } catch (error) {
    const message = (error as Error).message;
    const status = (/^Node non trouvé:/i.test(message) || /node non trouvé/i.test(message)) ? 404 : 500;
    res.status(status).json({ success: false, error: message, timestamp: new Date() });
  }
});

// ============================================================
// GET /nodes/:id - Détails d'un node
// ============================================================
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const nodeId = secureSanitizeInput(req.params.id);
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
    
    // Sanitization & validation (sécurité renforcée)
    try {
      validateCreateNodeRequest({
        name: name ? secureSanitizeInput(name) : undefined,
        blockchain: secureSanitizeInput(blockchain as string),
        mode: mode ? secureSanitizeInput(mode as string) : undefined,
      });
    } catch (validationError) {
      return res.status(400).json({
        success: false,
        error: (validationError as Error).message,
        timestamp: new Date(),
      });
    }

    // Créer le node
    const node = await nodeManager.createNode({
      name: name ? secureSanitizeInput(name) : undefined,
      blockchain: secureSanitizeInput(blockchain as string) as BlockchainType,
      mode: mode ? (secureSanitizeInput(mode as string) as NodeMode) : undefined,
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
    const nodeId = secureSanitizeInput(req.params.id);
    if (!validateNodeId(nodeId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de node invalide',
        timestamp: new Date(),
      });
    }

    await nodeManager.startNode(nodeId);
    
    res.json({
      success: true,
      message: 'Node démarré',
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error(`Erreur démarrage node ${req.params.id}`, { error });
    const message = (error as Error).message;
    
    // Déterminer le code de statut approprié
    let status = 500;
    if (/^Node non trouvé:/i.test(message) || /node non trouvé/i.test(message)) {
      status = 404;
    } else if (/déjà en cours d'exécution|déjà en cours d\s*exécution|already running|already.*execution/i.test(message)) {
      // Idempotent start: treat as success.
      return res.status(200).json({
        success: true,
        message: 'Node déjà en cours d\'exécution',
        timestamp: new Date(),
      });
    } else if (/already in use|Conflict|\(HTTP code 409\)/i.test(message)) {
      status = 409;
    }
    if (/ressources insuffisantes|docker|disponible/i.test(message)) {
      status = 503; // Service Unavailable - Docker/ressources manquantes
    } else if (/ressources insuffisantes/i.test(message)) {
      status = 400; // Bad Request
    }
    
    res.status(status).json({
      success: false,
      error: message,
      timestamp: new Date(),
    });
  }
});

// ============================================================
// POST /nodes/:id/stop - Arrêter un node
// ============================================================
router.post('/:id/stop', async (req: Request, res: Response) => {
  try {
    const nodeId = secureSanitizeInput(req.params.id);
    if (!validateNodeId(nodeId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de node invalide',
        timestamp: new Date(),
      });
    }

    await nodeManager.stopNode(nodeId);
    
    res.json({
      success: true,
      message: 'Node arrêté',
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error(`Erreur arrêt node ${req.params.id}`, { error });
    const message = (error as Error).message;
    const status = (/^Node non trouvé:/i.test(message) || /node non trouvé/i.test(message)) ? 404 : 500;
    res.status(status).json({
      success: false,
      error: message,
      timestamp: new Date(),
    });
  }
});

// ============================================================
// POST /nodes/:id/restart - Redémarrer un node
// ============================================================
router.post('/:id/restart', async (req: Request, res: Response) => {
  try {
    const nodeId = secureSanitizeInput(req.params.id);
    if (!validateNodeId(nodeId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de node invalide',
        timestamp: new Date(),
      });
    }

    await nodeManager.restartNode(nodeId);
    
    res.json({
      success: true,
      message: 'Node redémarré',
      timestamp: new Date(),
    });
  } catch (error) {
    const message = (error as Error).message;
    let status = 500;
    if (/^Node non trouvé:/i.test(message) || /node non trouvé/i.test(message)) {
      status = 404;
    } else if (/already in use|Conflict|\(HTTP code 409\)/i.test(message)) {
      status = 409;
    }
    res.status(status).json({
      success: false,
      error: message,
      timestamp: new Date(),
    });
  }
});

// ============================================================
// DELETE /nodes/:id - Supprimer un node
// ============================================================
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const nodeId = secureSanitizeInput(req.params.id);
    if (!validateNodeId(nodeId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de node invalide',
        timestamp: new Date(),
      });
    }

    await nodeManager.deleteNode(nodeId);
    
    res.json({
      success: true,
      message: 'Node supprimé',
      timestamp: new Date(),
    });
  } catch (error) {
    const message = (error as Error).message;
    const status = (/^Node non trouvé:/i.test(message) || /node non trouvé/i.test(message)) ? 404 : 500;
    res.status(status).json({
      success: false,
      error: message,
      timestamp: new Date(),
    });
  }
});

// ============================================================
// GET /nodes/:id/logs - Logs d'un node
// ============================================================
router.get('/:id/logs', async (req: Request, res: Response) => {
  try {
    const nodeId = secureSanitizeInput(req.params.id);
    if (!validateNodeId(nodeId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de node invalide',
        timestamp: new Date(),
      });
    }

    const lines = parsePositiveInt(req.query.lines, 100) || 100;
    const logs = await nodeManager.getNodeLogs(nodeId, lines);
    
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
    const nodeId = secureSanitizeInput(req.params.id);
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
