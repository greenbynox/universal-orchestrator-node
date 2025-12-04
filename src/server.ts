/**
 * ============================================================
 * NODE ORCHESTRATOR - Main Server
 * ============================================================
 * Point d'entrée principal de l'application
 */

import express, { Request, Response, Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import path from 'path';

import { config } from './config';
import { logger } from './utils/logger';
import { nodesRouter, walletsRouter, paymentsRouter, systemRouter } from './api';
import { WebSocketHandler } from './websocket';
import { nodeManager } from './core/NodeManager';
import { paymentManager } from './core/PaymentManager';

// ============================================================
// EXPRESS APP SETUP
// ============================================================

const app: Application = express();
const httpServer = createServer(app);

// Middleware de sécurité
app.use(helmet({
  contentSecurityPolicy: false, // Désactivé pour permettre le frontend
}));

// CORS
app.use(cors({
  origin: config.isDev ? '*' : ['http://localhost:3000', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requêtes par fenêtre
  message: 'Trop de requêtes, veuillez réessayer plus tard',
});
app.use('/api/', limiter);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================
// ROUTES API
// ============================================================

app.use('/api/nodes', nodesRouter);
app.use('/api/wallets', walletsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/system', systemRouter);

// Route de base
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    name: 'Node Orchestrator API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      nodes: '/api/nodes',
      wallets: '/api/wallets',
      payments: '/api/payments',
      system: '/api/system',
    },
  });
});

// ============================================================
// FRONTEND STATIC (Production)
// ============================================================

if (!config.isDev) {
  const frontendPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(frontendPath));
  
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// ============================================================
// ERROR HANDLING
// ============================================================

// 404
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint non trouvé',
    timestamp: new Date(),
  });
});

// Error handler global
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Erreur non gérée', { error: err.message, stack: err.stack });
  
  res.status(500).json({
    success: false,
    error: config.isDev ? err.message : 'Erreur interne du serveur',
    timestamp: new Date(),
  });
});

// ============================================================
// WEBSOCKET
// ============================================================

const wsHandler = new WebSocketHandler(httpServer);

// ============================================================
// DÉMARRAGE DU SERVEUR
// ============================================================

httpServer.listen(config.server.port, config.server.host, () => {
  logger.info(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║     🚀 NODE ORCHESTRATOR - MVP                             ║
║                                                            ║
║     Server:    http://${config.server.host}:${config.server.port}                     ║
║     API:       http://${config.server.host}:${config.server.port}/api                 ║
║     WebSocket: ws://${config.server.host}:${config.server.port}                       ║
║     Mode:      ${config.env.toUpperCase().padEnd(42)}║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================

async function shutdown(signal: string): Promise<void> {
  logger.info(`Signal ${signal} reçu. Arrêt en cours...`);
  
  try {
    // Arrêter les managers
    await nodeManager.shutdown();
    paymentManager.shutdown();
    
    // Fermer le serveur HTTP
    httpServer.close(() => {
      logger.info('Serveur HTTP fermé');
      process.exit(0);
    });
    
    // Force exit après 30 secondes
    setTimeout(() => {
      logger.warn('Arrêt forcé après timeout');
      process.exit(1);
    }, 30000);
    
  } catch (error) {
    logger.error('Erreur lors de l\'arrêt', { error });
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export { app, httpServer, wsHandler };
