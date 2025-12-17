import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useStore } from '../store';
import { nodesApi } from './api';

const SETTINGS_STORAGE_KEY = 'orchestratorSettings';

function readDetailedLogNotificationsEnabled(): boolean {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { detailedLogNotifications?: boolean };
    return !!parsed?.detailedLogNotifications;
  } catch {
    return false;
  }
}

let cachedDetailedLogsEnabled = false;
let lastSettingsReadAt = 0;

function isDetailedLogNotificationsEnabled(): boolean {
  const now = Date.now();
  if ((now - lastSettingsReadAt) > 1000) {
    lastSettingsReadAt = now;
    cachedDetailedLogsEnabled = readDetailedLogNotificationsEnabled();
  }
  return cachedDetailedLogsEnabled;
}

const TOAST_THROTTLE_PER_NODE_MS = 2500;
const lastToastByNodeId = new Map<string, { at: number; msg: string }>();

function maybeNotifyNodeLog(nodeId: string, message: string): void {
  if (!isDetailedLogNotificationsEnabled()) return;

  const now = Date.now();
  const prev = lastToastByNodeId.get(nodeId);
  if (prev && (now - prev.at) < TOAST_THROTTLE_PER_NODE_MS) return;
  if (prev && prev.msg === message) return;

  const state = useStore.getState();
  const node = state.nodes.find((n) => n?.config?.id === nodeId);
  const nodeName = node?.config?.name || node?.config?.blockchain || nodeId;

  state.addLogNotification({
    nodeId,
    nodeName,
    message,
    timestamp: now,
  });

  lastToastByNodeId.set(nodeId, { at: now, msg: message });
  toast(`${nodeName}: ${message}`);
}

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  private getSocketServerUrl(): string {
    const env = (import.meta as any).env || {};
    const host = String(env.VITE_BACKEND_HOST || '127.0.0.1');
    const port = Number(env.VITE_BACKEND_PORT || env.PORT || 3001);

    // In dev, bypass Vite's WS proxy entirely: it is noisy during reloads and backend restarts.
    // Also do the same when the UI is loaded from file:// (Electron builds).
    try {
      const protocol = typeof window !== 'undefined' ? window.location.protocol : undefined;
      if (env.DEV || protocol === 'file:') {
        return `http://${host}:${port}`;
      }
    } catch {
      // ignore
    }

    return window.location.origin;
  }

  connect(): void {
    if (this.socket?.connected) return;

    const authMode = (import.meta as any).env?.VITE_API_AUTH_MODE?.toLowerCase?.() as string | undefined;
    const token = (import.meta as any).env?.VITE_API_TOKEN as string | undefined;
    const basicUser = (import.meta as any).env?.VITE_API_BASIC_USER as string | undefined;
    const basicPass = (import.meta as any).env?.VITE_API_BASIC_PASS as string | undefined;

    const authPayload = authMode === 'token' && token
      ? { token }
      : (authMode === 'basic' && basicUser && basicPass
        ? { username: basicUser, password: basicPass }
        : undefined);

    this.socket = io(this.getSocketServerUrl(), {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      auth: authPayload,
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
      maybeNotifyNodeLog(data.nodeId, data.message);
    });

    this.socket.on('node:created', (config) => {
      // Backend should emit NodeInfo; keep a fallback for legacy payloads.
      if (config && (config as any).config) {
        useStore.getState().addNode(config);
        return;
      }

      const id = (config as any)?.id;
      if (!id) return;

      nodesApi.getById(id)
        .then((node) => useStore.getState().addNode(node))
        .catch(() => undefined);
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
