import { io, Socket } from 'socket.io-client';
import { useStore } from '../store';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(): void {
    if (this.socket?.connected) return;

    this.socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connecté');
      this.reconnectAttempts = 0;
      useStore.getState().setConnected(true);
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket déconnecté');
      useStore.getState().setConnected(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Erreur de connexion WebSocket:', error);
      this.reconnectAttempts++;
    });

    // Événements des nodes
    this.socket.on('nodes:list', (nodes) => {
      useStore.getState().setNodes(nodes);
    });

    this.socket.on('node:status', (data) => {
      useStore.getState().updateNodeStatus(data.nodeId, data.status, data.error);
    });

    this.socket.on('node:metrics', (metrics) => {
      useStore.getState().updateNodeMetrics(metrics.id, metrics);
    });

    this.socket.on('node:sync', (data) => {
      useStore.getState().updateNodeSync(data.nodeId, data);
    });

    this.socket.on('node:log', (data) => {
      useStore.getState().addNodeLog(data.nodeId, data.message);
    });

    this.socket.on('node:created', (config) => {
      useStore.getState().addNode(config);
    });

    this.socket.on('node:deleted', (nodeId) => {
      useStore.getState().removeNode(nodeId);
    });
  }

  subscribeToNode(nodeId: string): void {
    this.socket?.emit('nodes:subscribe', nodeId);
  }

  unsubscribeFromNode(nodeId: string): void {
    this.socket?.emit('nodes:unsubscribe', nodeId);
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const wsService = new WebSocketService();
export default wsService;
