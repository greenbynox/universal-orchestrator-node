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
import { requireAuth } from './utils/auth';
import blockchainsRouter from './routes/blockchains';

// ============================================================
// EXPRESS APP SETUP
// ============================================================

const app: Application = express();
const httpServer = createServer(app);

// Middleware de sécurité avec CSP activé
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Required for React dev
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:", "http://localhost:*", "https://api.coingecko.com"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

// CORS with strict origin control
const allowedOrigins = config.isDev 
  ? ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173']
  : (process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
}));

// Rate limiting - stricter for sensitive endpoints
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requêtes par fenêtre
  message: 'Trop de requêtes, veuillez réessayer plus tard',
});
app.use('/api/', limiter);

// Stricter rate limit for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Only 10 auth attempts per 15 minutes
  message: 'Trop de tentatives, veuillez réessayer plus tard',
});
app.use('/api/auth', authLimiter);

// Body parser with size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ============================================================
// ROUTES API
// ============================================================

// Public routes (no auth required)
app.use('/api/system', systemRouter);
app.use('/api/blockchains', blockchainsRouter);

// Protected routes (authentication required)
app.use('/api/nodes', requireAuth, nodesRouter);
app.use('/api/wallets', requireAuth, walletsRouter);
app.use('/api/payments', requireAuth, paymentsRouter);

// Route de base
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    name: 'Node Orchestrator API',
    version: '1.0.0',
    status: 'running',
    authenticated: false,
    endpoints: {
      nodes: '/api/nodes (auth required)',
      wallets: '/api/wallets (auth required)',
      payments: '/api/payments (auth required)',
      system: '/api/system',
      blockchains: '/api/blockchains',
    },
  });
});

// Health check endpoint (public)
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
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
