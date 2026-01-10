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
import { nodesRouter, walletsRouter, systemRouter } from './api';
import { WebSocketHandler } from './websocket';
import { nodeManager } from './core/NodeManager';
import { requireAuth } from './utils/auth';
import apiAuthMiddleware from './middleware/apiAuth';
import blockchainsRouter from './routes/blockchains';
import dashboardRouter from './routes/dashboard';
import alertsRouter from './routes/alerts';
import walletsHardwareRouter from './routes/wallets';
import './services/notifications';
import { pruningService } from './services/pruning/PruningService';

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
      // Dev-only relaxations: React/Vite dev tooling may require eval/inline.
      // In production, keep scripts strict.
      scriptSrc: config.isDev
        ? ["'self'", "'unsafe-inline'", "'unsafe-eval'"]
        : ["'self'"],
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

// CORS with strict origin control (dynamic: reflects runtime settings)
// Dev note: Vite may auto-increment ports (5173 -> 5174 -> ...). In dev we allow any localhost port
// unless the user provided an explicit allowlist.
const defaultDevOrigins = ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173'];
const devLocalhostOriginRe = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const getAllowedOrigins = (): string[] => {
  const configured = config.api.allowedOrigins || [];
  if (configured.length > 0) return configured;
  return config.isDev ? defaultDevOrigins : ['http://localhost:3000'];
};

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    const allowed = getAllowedOrigins();
    if (allowed.includes(origin)) {
      callback(null, true);
    } else if (config.isDev && (config.api.allowedOrigins || []).length === 0 && devLocalhostOriginRe.test(origin)) {
      // Dev: allow Vite/devtools regardless of which localhost port they picked.
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
}));

// Rate limiting (dynamic: can be toggled via runtime settings)
// En développement: polling frequent nécessaire pour le dev (App.tsx fait ~36 requêtes/min)
// En production: protection contre abus/DDoS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requêtes par fenêtre
  message: 'Trop de requêtes, veuillez réessayer plus tard',
  skip: () => config.isDev || !config.api.rateLimitEnabled,
});
app.use('/api/', limiter);

// Stricter rate limit for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Only 10 auth attempts per 15 minutes
  message: 'Trop de tentatives, veuillez réessayer plus tard',
  skip: () => config.isDev || !config.api.rateLimitEnabled,
});
app.use('/api/auth', authLimiter);

// Body parser with size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// API-level auth (token/basic/none) applied to all /api routes
app.use('/api', apiAuthMiddleware);

// ============================================================
// ROUTES API
// ============================================================

// Public routes (no auth required)
app.use('/api/system', systemRouter);
app.use('/api/blockchains', blockchainsRouter);
app.use('/api/wallets/hardware', walletsHardwareRouter); // Hardware wallets are public for connection

// Protected routes (authentication required)
app.use('/api/nodes', requireAuth, nodesRouter);
app.use('/api/wallets', requireAuth, walletsRouter);
app.use('/api/dashboard', requireAuth, dashboardRouter);
app.use('/api/alerts', requireAuth, alertsRouter);

// Route de base
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    name: 'Node Orchestrator API',
    version: '2.2.0',
    status: 'running',
    authenticated: false,
    endpoints: {
      nodes: '/api/nodes',
      wallets: '/api/wallets',
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
  // Determine frontend path - works both for standalone and Electron packaged
  let frontendPath: string;
  
  if (process.env.ELECTRON_RUN_AS_NODE) {
    // Running inside Electron packaged app - use resourcesPath
    const resourcesPath = process.env.RESOURCES_PATH || path.join(__dirname, '..');
    frontendPath = path.join(resourcesPath, 'frontend/dist');
  } else {
    // Standalone Node.js
    frontendPath = path.join(__dirname, '../frontend/dist');
  }
  
  logger.info(`Serving frontend from: ${frontendPath}`);
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
// WAIT FOR DOCKER (if FORCE_DOCKER is enabled)
// ============================================================

async function waitForDocker(): Promise<void> {
  const forceDocker = process.env.FORCE_DOCKER === 'true';
  // If running inside the packaged Electron app, default to skipping Docker checks
  // unless FORCE_DOCKER=true is explicitly set. This allows the desktop EXE to run
  // on machines without Docker by default.
  const defaultSkipForElectron = !!process.env.ELECTRON_RUN_AS_NODE && process.env.FORCE_DOCKER !== 'true';
  const skipDockerCheck = process.env.SKIP_DOCKER_CHECK === 'true' || defaultSkipForElectron;
  const dockerHost = process.env.DOCKER_HOST;
  const { getDockerConnectionAttempts } = require('./utils/dockerConnection');
  const connAttempts = getDockerConnectionAttempts();
  logger.info(
    `Config Docker: FORCE_DOCKER=${forceDocker} DOCKER_HOST=${dockerHost || 'none'} attempts=${connAttempts.map((a: any) => a.label).join(',') || 'none'}`
  );

  // Dev convenience: allow skipping Docker entirely
  if (skipDockerCheck) {
    logger.warn('Docker check skipped (SKIP_DOCKER_CHECK=true)');
    return;
  }

  if (!forceDocker) {
    return; // Skip if not forcing Docker
  }

  logger.info('Attente de la disponibilité de Docker...');
  const maxAttempts = Number.isFinite(config.docker.maxRetries) ? config.docker.maxRetries : 30;
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const Docker = require('dockerode');

      let lastErr: any = null;
      let ok = false;
      for (const a of connAttempts) {
        try {
          const docker = new Docker(a.opts);
          const pingPromise = docker.ping();
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Docker ping timeout')), 5000));
          await Promise.race([pingPromise, timeoutPromise]);
          ok = true;
          break;
        } catch (e) {
          lastErr = e;
        }
      }

      if (!ok) {
        throw lastErr || new Error('Docker indisponible');
      }
      logger.info('✅ Docker est disponible!');
      return;
    } catch (error) {
      attempts++;

      if (attempts % 5 === 0 || attempts === 1) {
        logger.warn(`Docker non disponible (tentative ${attempts}/${maxAttempts}): ${(error as Error).message}`);
      }
      const delay = Number.isFinite(config.docker.retryDelayMs) ? config.docker.retryDelayMs : 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  const guidance = dockerHost && dockerHost.startsWith('tcp://')
    ? (() => {
        const wslIp = (process.env.WSL_DOCKER_IP || '').trim();
        const extra = wslIp
          ? ` ou tcp://${wslIp}:PORT (uniquement si WSL_DOCKER_IP est défini et correspond à l\'IP WSL2)`
          : '';
        return `Connexion Docker via TCP refusée si ce n\'est pas du loopback. Autorisé uniquement: tcp://127.0.0.1:PORT ou tcp://localhost:PORT${extra} (ex: Docker Engine WSL2 exposé en TCP).`;
      })()
    : 'Vérifiez que Docker est démarré (Docker Desktop OU Docker Engine dans WSL2).';
  logger.error(`Docker indisponible après ${maxAttempts} tentatives. ${guidance}`);
  // Do not throw here to avoid crashing the entire app on machines without Docker.
  // Historically we exited, but for a packaged desktop app we prefer to continue
  // in a degraded mode and log a clear warning so users can use the app without Docker.
  logger.warn('Docker requis mais indisponible — démarrage en mode dégradé sans Docker.');
  return;
}

// ============================================================
// DÉMARRAGE DU SERVEUR
// ============================================================

// Wait for Docker before starting server
waitForDocker().then(() => {
  const isLoopbackHost = (host: string): boolean => {
    const h = (host || '').trim().toLowerCase();
    return h === '127.0.0.1' || h === 'localhost' || h === '::1';
  };

  // SECURITY: refuse insecure public binding in production unless explicitly allowed.
  // This prevents accidental exposure of a no-auth local API to the LAN/Internet.
  const allowInsecureRemote = process.env.ALLOW_INSECURE_REMOTE === 'true';
  const isPublicBind = !isLoopbackHost(config.server.host);
  if (!config.isDev && isPublicBind && config.api.authMode === 'none' && !allowInsecureRemote) {
    logger.error(
      'Refus de démarrer: HOST n\'est pas loopback et API_AUTH_MODE=none. ' +
        'Activez une auth (API_AUTH_MODE=token/basic) ou remettez HOST=127.0.0.1. ' +
        'Override (dangereux): ALLOW_INSECURE_REMOTE=true.'
    );
    process.exit(1);
  }

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

    // Start background services
    pruningService.start();
  });
}).catch(error => {
  logger.error('Erreur lors de l\'attente de Docker', { error });
  process.exit(1);
});

// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================

async function shutdown(signal: string): Promise<void> {
  logger.info(`Signal ${signal} reçu. Arrêt en cours...`);
  
  try {
    // Arrêter les managers
    await nodeManager.shutdown();
    
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
