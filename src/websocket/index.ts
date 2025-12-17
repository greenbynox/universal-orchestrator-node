/**
 * ============================================================
 * NODE ORCHESTRATOR - WebSocket Handler
 * ============================================================
 * Gestion des événements en temps réel
 */

import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { nodeManager } from '../core/NodeManager';
import { logger } from '../utils/logger';
import { config } from '../config';
import { validateNodeId } from '../utils/validation';
import crypto from 'crypto';

function getAllowedWsOrigins(): string[] {
  const defaultDevOrigins = ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173'];
  return config.api.allowedOrigins.length > 0
    ? config.api.allowedOrigins
    : (config.isDev ? defaultDevOrigins : ['http://localhost:3000']);
}

const devLocalhostOriginRe = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function stripSensitiveNodeInfo(nodeInfo: any): any {
  if (!nodeInfo || typeof nodeInfo !== 'object') return nodeInfo;
  const cfg = nodeInfo.config && typeof nodeInfo.config === 'object' ? nodeInfo.config : undefined;
  if (!cfg) return nodeInfo;
  // Avoid leaking secrets (rpc credentials, tokens) via realtime channel.
  // Connection details are available via authenticated REST endpoints.
  return {
    ...nodeInfo,
    config: {
      ...cfg,
      customConfig: undefined,
    },
  };
}

export class WebSocketHandler {
  private io: SocketServer;
  
  constructor(httpServer: HttpServer) {
    this.io = new SocketServer(httpServer, {
      cors: {
        origin: (origin, callback) => {
          const allowedOrigins = getAllowedWsOrigins();
          // Allow requests with no origin (native apps / same-origin / curl-like)
          if (!origin) return callback(null, true);
          if (allowedOrigins.includes(origin)) return callback(null, true);
          if (config.isDev && config.api.allowedOrigins.length === 0 && devLocalhostOriginRe.test(origin)) {
            return callback(null, true);
          }
          return callback(new Error('Not allowed by CORS'));
        },
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.setupAuth();
    
    this.setupEventHandlers();
    this.setupNodeEvents();
    
    logger.info('WebSocket server initialisé');
  }

  /**
   * Enforce Socket.IO auth when API auth mode is enabled.
   * - token: expects API token via `socket.handshake.auth.token` (recommended)
            or Authorization Bearer / x-api-token header (non-browser clients).
   * - basic: expects `socket.handshake.auth.username/password` (recommended)
            or Authorization Basic header (non-browser clients).
   */
  private setupAuth(): void {
    const rawMode = config.api.authMode || 'none';
    const mode = rawMode.toLowerCase();

    if (mode === 'none') {
      return;
    }

    this.io.use((socket, next) => {
      try {
        if (mode === 'token') {
          if (!config.api.apiToken) {
            logger.error('WebSocket auth misconfigured: API_AUTH_MODE=token but API_TOKEN is empty');
            if (config.isDev) {
              logger.warn('Dev mode: allowing WebSocket connection despite missing API token');
              return next();
            }
            return next(new Error('Server authentication is misconfigured'));
          }

          const authToken = (socket.handshake.auth as any)?.token;
          const headerAuth = socket.handshake.headers?.authorization;
          const headerToken = socket.handshake.headers?.['x-api-token'];

          const token = typeof authToken === 'string'
            ? authToken
            : (typeof headerToken === 'string'
              ? headerToken
              : (typeof headerAuth === 'string' && headerAuth.startsWith('Bearer ')
                ? headerAuth.slice(7)
                : ''));

          if (!token || token !== config.api.apiToken) {
            logger.warn('WebSocket token missing/invalid', { socketId: socket.id });
            return next(new Error('Unauthorized'));
          }
          return next();
        }

        if (mode === 'basic') {
          if (!config.api.basicUser || !config.api.basicPass) {
            logger.error('WebSocket auth misconfigured: API_AUTH_MODE=basic but API_BASIC_USER/API_BASIC_PASS are empty');
            if (config.isDev) {
              logger.warn('Dev mode: allowing WebSocket connection despite missing basic credentials');
              return next();
            }
            return next(new Error('Server authentication is misconfigured'));
          }

          const authUser = (socket.handshake.auth as any)?.username;
          const authPass = (socket.handshake.auth as any)?.password;
          if (typeof authUser === 'string' && typeof authPass === 'string') {
            if (authUser === config.api.basicUser && authPass === config.api.basicPass) {
              return next();
            }
            logger.warn('WebSocket basic auth failed (auth payload)', { socketId: socket.id, user: authUser });
            return next(new Error('Unauthorized'));
          }

          const headerAuth = socket.handshake.headers?.authorization;
          if (typeof headerAuth === 'string' && headerAuth.startsWith('Basic ')) {
            const decoded = Buffer.from(headerAuth.slice(6), 'base64').toString('utf8');
            const [user, pass] = decoded.split(':');

            // Timing-safe compare where possible
            const userOk = user === config.api.basicUser;
            const passOk = (() => {
              const a = Buffer.from(pass || '', 'utf8');
              const b = Buffer.from(config.api.basicPass, 'utf8');
              if (a.length !== b.length) return false;
              return crypto.timingSafeEqual(a, b);
            })();

            if (userOk && passOk) {
              return next();
            }
          }

          logger.warn('WebSocket basic auth missing/invalid', { socketId: socket.id });
          return next(new Error('Unauthorized'));
        }

        logger.error('Unknown API_AUTH_MODE for WebSocket', { mode: rawMode });
        if (config.isDev) {
          logger.warn('Dev mode: allowing WebSocket connection despite unknown API_AUTH_MODE', { mode: rawMode });
          return next();
        }
        return next(new Error('Server authentication is misconfigured'));
      } catch (err) {
        return next(new Error('Unauthorized'));
      }
    });
  }

  /**
   * Configuration des handlers de connexion
   */
  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      logger.debug(`Client connecté: ${socket.id}`);
      
      // Envoyer l'état actuel des nodes
      socket.emit('nodes:list', nodeManager.getAllNodes().map(stripSensitiveNodeInfo));
      
      // Écouter les demandes du client
      socket.on('nodes:subscribe', (nodeId: string) => {
        const id = typeof nodeId === 'string' ? nodeId.trim() : '';
        if (!validateNodeId(id)) {
          logger.warn('WebSocket subscribe rejected (invalid nodeId)', { socketId: socket.id, nodeId });
          return;
        }
        socket.join(`node:${id}`);
        logger.debug(`Client ${socket.id} abonné au node ${id}`);
      });
      
      socket.on('nodes:unsubscribe', (nodeId: string) => {
        const id = typeof nodeId === 'string' ? nodeId.trim() : '';
        if (!validateNodeId(id)) {
          return;
        }
        socket.leave(`node:${id}`);
      });
      
      socket.on('disconnect', () => {
        logger.debug(`Client déconnecté: ${socket.id}`);
      });
    });
  }

  /**
   * Écouter les événements du NodeManager
   */
  private setupNodeEvents(): void {
    // Statut du node
    nodeManager.on('node:status', (data: { nodeId: string; status: string; error?: string }) => {
      this.io.to(`node:${data.nodeId}`).emit('node:status', data);
      this.io.emit('node:status', data); // Broadcast global aussi
    });
    
    // Métriques
    nodeManager.on('node:metrics', (metrics: unknown) => {
      const nodeId = (metrics as { id: string }).id;
      this.io.to(`node:${nodeId}`).emit('node:metrics', metrics);
      this.io.emit('node:metrics', metrics);
    });
    
    // Logs
    nodeManager.on('node:log', (data: { nodeId: string; message: string }) => {
      this.io.to(`node:${data.nodeId}`).emit('node:log', data);
    });
    
    // Sync
    nodeManager.on('node:sync', (data: unknown) => {
      const nodeId = (data as { nodeId: string }).nodeId;
      this.io.to(`node:${nodeId}`).emit('node:sync', data);
      this.io.emit('node:sync', data);
    });
    
    // Node créé/supprimé
    nodeManager.on('node:created', (config: unknown) => {
      this.io.emit('node:created', stripSensitiveNodeInfo(config as any));
    });
    
    nodeManager.on('node:deleted', (nodeId: string) => {
      this.io.emit('node:deleted', nodeId);
    });
  }

  /**
   * Émettre un événement global
   */
  broadcast(event: string, data: unknown): void {
    this.io.emit(event, data);
  }

  /**
   * Émettre un événement à un node spécifique
   */
  emitToNode(nodeId: string, event: string, data: unknown): void {
    this.io.to(`node:${nodeId}`).emit(event, data);
  }
}

export default WebSocketHandler;
