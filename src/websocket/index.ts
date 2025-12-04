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

export class WebSocketHandler {
  private io: SocketServer;
  
  constructor(httpServer: HttpServer) {
    this.io = new SocketServer(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });
    
    this.setupEventHandlers();
    this.setupNodeEvents();
    
    logger.info('WebSocket server initialisé');
  }

  /**
   * Configuration des handlers de connexion
   */
  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      logger.debug(`Client connecté: ${socket.id}`);
      
      // Envoyer l'état actuel des nodes
      socket.emit('nodes:list', nodeManager.getAllNodes());
      
      // Écouter les demandes du client
      socket.on('nodes:subscribe', (nodeId: string) => {
        socket.join(`node:${nodeId}`);
        logger.debug(`Client ${socket.id} abonné au node ${nodeId}`);
      });
      
      socket.on('nodes:unsubscribe', (nodeId: string) => {
        socket.leave(`node:${nodeId}`);
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
      this.io.emit('node:created', config);
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
