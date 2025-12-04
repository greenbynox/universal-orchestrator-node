/**
 * ============================================================
 * NODE ORCHESTRATOR - Node Manager
 * ============================================================
 * Gestionnaire principal des nodes blockchain
 * Supporte: Bitcoin, Ethereum, Solana, Monero, BNB Chain
 */

import Docker from 'dockerode';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import {
  NodeConfig,
  NodeState,
  NodeMetrics,
  NodeInfo,
  NodeStatus,
  BlockchainType,
  NodeMode,
  CreateNodeRequest,
} from '../types';
import { config, BLOCKCHAIN_CONFIGS, getNextAvailablePort } from '../config';
import { logger, getNodeLogger } from '../utils/logger';
import { generateSecureId } from '../utils/crypto';
import { canRunNode, recommendNodeMode } from '../utils/system';

// ============================================================
// NODE MANAGER CLASS
// ============================================================

export class NodeManager extends EventEmitter {
  private docker: Docker;
  private nodes: Map<string, NodeConfig> = new Map();
  private nodeStates: Map<string, NodeState> = new Map();
  private nodeMetrics: Map<string, NodeMetrics> = new Map();
  private metricsInterval?: NodeJS.Timeout;
  private syncCheckInterval?: NodeJS.Timeout;
  
  constructor() {
    super();
    
    // Initialiser Docker
    this.docker = new Docker({
      socketPath: config.docker.socketPath,
    });
    
    // Créer les dossiers nécessaires
    this.ensureDirectories();
    
    // Charger les nodes existants
    this.loadNodes();
    
    // Démarrer la collecte des métriques
    this.startMetricsCollection();
    
    logger.info('NodeManager initialisé');
  }

  // ============================================================
  // INITIALISATION
  // ============================================================

  /**
   * S'assurer que les dossiers nécessaires existent
   */
  private ensureDirectories(): void {
    const dirs = [
      config.paths.data,
      config.paths.nodes,
      config.paths.wallets,
      config.paths.logs,
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        logger.debug(`Dossier créé: ${dir}`);
      }
    });
  }

  /**
   * Charger les nodes depuis le stockage
   */
  private loadNodes(): void {
    const nodesFile = path.join(config.paths.data, 'nodes.json');
    
    if (fs.existsSync(nodesFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(nodesFile, 'utf-8'));
        data.forEach((node: NodeConfig) => {
          this.nodes.set(node.id, node);
          this.nodeStates.set(node.id, {
            id: node.id,
            status: 'stopped',
            syncProgress: 0,
            blockHeight: 0,
            latestBlock: 0,
            peers: 0,
            uptime: 0,
          });
        });
        logger.info(`${this.nodes.size} node(s) chargé(s)`);
      } catch (error) {
        logger.error('Erreur lors du chargement des nodes', { error });
      }
    }
  }

  /**
   * Sauvegarder les nodes
   */
  private saveNodes(): void {
    const nodesFile = path.join(config.paths.data, 'nodes.json');
    const data = Array.from(this.nodes.values());
    fs.writeFileSync(nodesFile, JSON.stringify(data, null, 2));
    logger.debug('Nodes sauvegardés');
  }

  // ============================================================
  // GESTION DES NODES
  // ============================================================

  /**
   * Créer un nouveau node
   */
  async createNode(request: CreateNodeRequest): Promise<NodeInfo> {
    const blockchain = request.blockchain;
    const blockchainConfig = BLOCKCHAIN_CONFIGS[blockchain];
    
    // Déterminer le mode (auto-détection si non spécifié)
    let mode = request.mode;
    if (!mode) {
      const recommendation = await recommendNodeMode(blockchain);
      mode = recommendation.recommendedMode;
      logger.info(`Mode auto-détecté pour ${blockchain}: ${mode}`);
    }

    // Vérifier les ressources
    const resourceCheck = await canRunNode(blockchain, mode);
    if (!resourceCheck.canRun) {
      throw new Error(resourceCheck.reason);
    }
    
    // Log le warning si présent (mais continue la création)
    if (resourceCheck.warning) {
      logger.warn(resourceCheck.warning);
    }

    // Générer les ports
    const existingPorts = Array.from(this.nodes.values())
      .filter(n => n.blockchain === blockchain)
      .flatMap(n => [n.rpcPort, n.p2pPort, n.wsPort].filter(Boolean)) as number[];
    
    const ports = getNextAvailablePort(blockchain, existingPorts);

    // Créer la configuration
    const nodeId = `${blockchain}-${generateSecureId().slice(0, 8)}`;
    const nodeConfig: NodeConfig = {
      id: nodeId,
      name: request.name || `${blockchainConfig.displayName} Node`,
      blockchain,
      mode,
      dataPath: path.join(config.paths.nodes, nodeId),
      rpcPort: ports.rpc,
      p2pPort: ports.p2p,
      wsPort: ports.ws,
      customConfig: request.customConfig,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Créer le dossier de données
    fs.mkdirSync(nodeConfig.dataPath, { recursive: true });

    // Sauvegarder
    this.nodes.set(nodeId, nodeConfig);
    this.saveNodes();

    // Initialiser l'état
    const nodeState: NodeState = {
      id: nodeId,
      status: 'stopped',
      syncProgress: 0,
      blockHeight: 0,
      latestBlock: 0,
      peers: 0,
      uptime: 0,
    };
    this.nodeStates.set(nodeId, nodeState);

    // Initialiser les métriques
    const nodeMetrics: NodeMetrics = {
      id: nodeId,
      cpuUsage: 0,
      memoryUsage: 0,
      memoryLimit: 0,
      diskUsage: 0,
      networkIn: 0,
      networkOut: 0,
      timestamp: new Date(),
    };
    this.nodeMetrics.set(nodeId, nodeMetrics);

    logger.info(`Node créé: ${nodeId}`, { blockchain, mode });
    this.emit('node:created', nodeConfig);

    return {
      config: nodeConfig,
      state: nodeState,
      metrics: nodeMetrics,
    };
  }

  /**
   * Démarrer un node
   */
  async startNode(nodeId: string): Promise<void> {
    const nodeConfig = this.nodes.get(nodeId);
    if (!nodeConfig) {
      throw new Error(`Node non trouvé: ${nodeId}`);
    }

    const nodeState = this.nodeStates.get(nodeId)!;
    if (nodeState.status === 'ready' || nodeState.status === 'syncing') {
      throw new Error('Le node est déjà en cours d\'exécution');
    }

    const nodeLogger = getNodeLogger(nodeId);
    const blockchainConfig = BLOCKCHAIN_CONFIGS[nodeConfig.blockchain];

    // Mettre à jour le statut
    nodeState.status = 'starting';
    this.emit('node:status', { nodeId, status: 'starting' });
    nodeLogger.info('Démarrage du node...');

    try {
      // Construire la configuration Docker
      const containerConfig = this.buildContainerConfig(nodeConfig);

      // Créer et démarrer le container
      const container = await this.docker.createContainer(containerConfig);
      await container.start();

      // Sauvegarder l'ID du container
      nodeState.containerId = container.id;
      nodeState.status = 'syncing';
      nodeState.uptime = 0;

      nodeLogger.info(`Container démarré: ${container.id.slice(0, 12)}`);
      this.emit('node:status', { nodeId, status: 'syncing' });

      // Attacher les logs
      this.attachContainerLogs(container, nodeId);

    } catch (error) {
      nodeState.status = 'error';
      nodeState.lastError = (error as Error).message;
      nodeLogger.error('Erreur au démarrage', { error });
      this.emit('node:status', { nodeId, status: 'error', error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Arrêter un node
   */
  async stopNode(nodeId: string): Promise<void> {
    const nodeState = this.nodeStates.get(nodeId);
    if (!nodeState || !nodeState.containerId) {
      throw new Error(`Node non trouvé ou non démarré: ${nodeId}`);
    }

    const nodeLogger = getNodeLogger(nodeId);
    nodeState.status = 'stopping';
    this.emit('node:status', { nodeId, status: 'stopping' });
    nodeLogger.info('Arrêt du node...');

    try {
      const container = this.docker.getContainer(nodeState.containerId);
      await container.stop({ t: 30 }); // 30 secondes de timeout
      await container.remove();

      nodeState.status = 'stopped';
      nodeState.containerId = undefined;
      nodeState.uptime = 0;

      nodeLogger.info('Node arrêté');
      this.emit('node:status', { nodeId, status: 'stopped' });

    } catch (error) {
      nodeLogger.error('Erreur lors de l\'arrêt', { error });
      throw error;
    }
  }

  /**
   * Supprimer un node
   */
  async deleteNode(nodeId: string): Promise<void> {
    const nodeConfig = this.nodes.get(nodeId);
    if (!nodeConfig) {
      throw new Error(`Node non trouvé: ${nodeId}`);
    }

    const nodeState = this.nodeStates.get(nodeId);
    
    // Arrêter le node s'il est en cours d'exécution
    if (nodeState && nodeState.containerId) {
      await this.stopNode(nodeId);
    }

    // Supprimer les données
    if (fs.existsSync(nodeConfig.dataPath)) {
      fs.rmSync(nodeConfig.dataPath, { recursive: true, force: true });
    }

    // Nettoyer les maps
    this.nodes.delete(nodeId);
    this.nodeStates.delete(nodeId);
    this.nodeMetrics.delete(nodeId);
    this.saveNodes();

    logger.info(`Node supprimé: ${nodeId}`);
    this.emit('node:deleted', nodeId);
  }

  /**
   * Redémarrer un node
   */
  async restartNode(nodeId: string): Promise<void> {
    await this.stopNode(nodeId);
    await this.startNode(nodeId);
  }

  // ============================================================
  // CONFIGURATION DOCKER
  // ============================================================

  /**
   * Construire la configuration du container Docker
   */
  private buildContainerConfig(nodeConfig: NodeConfig): Docker.ContainerCreateOptions {
    const blockchainConfig = BLOCKCHAIN_CONFIGS[nodeConfig.blockchain];
    const image = blockchainConfig.dockerImages[nodeConfig.mode];

    // Configuration de base
    const containerConfig: Docker.ContainerCreateOptions = {
      name: `orchestrator-${nodeConfig.id}`,
      Image: image,
      Env: this.buildEnvVars(nodeConfig),
      ExposedPorts: {},
      HostConfig: {
        Binds: [
          `${nodeConfig.dataPath}:/data:rw`,
        ],
        PortBindings: {},
        RestartPolicy: { Name: 'unless-stopped' },
        Memory: this.getMemoryLimit(nodeConfig),
        CpuShares: 512,
        CpuPeriod: 100000,
        CapDrop: ['ALL'],
        SecurityOpt: ['no-new-privileges'],
      },
      Labels: {
        'orchestrator.node.id': nodeConfig.id,
        'orchestrator.blockchain': nodeConfig.blockchain,
        'orchestrator.mode': nodeConfig.mode,
      },
    };

    // Configuration des ports
    const portBindings: { [key: string]: { HostPort: string }[] } = {};
    
    portBindings[`${blockchainConfig.defaultPorts.rpc}/tcp`] = [{ HostPort: String(nodeConfig.rpcPort) }];
    portBindings[`${blockchainConfig.defaultPorts.p2p}/tcp`] = [{ HostPort: String(nodeConfig.p2pPort) }];
    
    if (blockchainConfig.defaultPorts.ws && nodeConfig.wsPort) {
      portBindings[`${blockchainConfig.defaultPorts.ws}/tcp`] = [{ HostPort: String(nodeConfig.wsPort) }];
    }

    containerConfig.HostConfig!.PortBindings = portBindings;

    // Ajouter les commandes spécifiques selon la blockchain
    containerConfig.Cmd = this.buildStartCommand(nodeConfig);

    return containerConfig;
  }

  /**
   * Construire les variables d'environnement
   */
  private buildEnvVars(nodeConfig: NodeConfig): string[] {
    const env: string[] = [];

    switch (nodeConfig.blockchain) {
      case 'bitcoin':
        env.push(
          'BITCOIN_DATA=/data',
          `BITCOIN_RPCPORT=${nodeConfig.rpcPort}`,
        );
        if (nodeConfig.mode === 'pruned') {
          env.push('BITCOIN_PRUNE=550');
        }
        break;

      case 'ethereum':
        env.push('GETH_DATADIR=/data');
        break;

      case 'solana':
        env.push('SOLANA_LEDGER=/data');
        break;

      case 'monero':
        env.push(
          'MONERO_DATA_DIR=/data',
          `MONERO_RPC_PORT=${nodeConfig.rpcPort}`,
        );
        break;

      case 'bnb':
        env.push('BSC_DATADIR=/data');
        break;
    }

    return env;
  }

  /**
   * Construire la commande de démarrage
   */
  private buildStartCommand(nodeConfig: NodeConfig): string[] {
    const cmd: string[] = [];

    switch (nodeConfig.blockchain) {
      case 'bitcoin':
        cmd.push(
          'bitcoind',
          '-server',
          '-rpcbind=127.0.0.1',
          `-rpcport=${nodeConfig.rpcPort}`,
          '-datadir=/data',
        );
        if (nodeConfig.mode === 'pruned') {
          cmd.push('-prune=550');
        }
        break;

      case 'ethereum':
        cmd.push(
          'geth',
          '--http',
          '--http.addr=127.0.0.1',
          `--http.port=${nodeConfig.rpcPort}`,
          '--datadir=/data',
        );
        if (nodeConfig.mode === 'light') {
          cmd.push('--syncmode=light');
        } else if (nodeConfig.mode === 'pruned') {
          cmd.push('--syncmode=snap');
        }
        break;

      case 'solana':
        cmd.push(
          'solana-validator',
          '--ledger=/data',
          `--rpc-port=${nodeConfig.rpcPort}`,
          '--no-voting',
          '--enable-rpc-transaction-history',
        );
        break;

      case 'monero':
        cmd.push(
          'monerod',
          '--data-dir=/data',
          '--rpc-bind-ip=127.0.0.1',
          `--rpc-bind-port=${nodeConfig.rpcPort}`,
        );
        if (nodeConfig.mode === 'pruned') {
          cmd.push('--prune-blockchain');
        }
        break;

      case 'bnb':
        cmd.push(
          'geth',
          '--http',
          '--http.addr=127.0.0.1',
          `--http.port=${nodeConfig.rpcPort}`,
          '--datadir=/data',
          '--config=/config/config.toml',
        );
        break;
    }

    return cmd;
  }

  /**
   * Obtenir la limite mémoire pour un container
   */
  private getMemoryLimit(nodeConfig: NodeConfig): number {
    const requirements = BLOCKCHAIN_CONFIGS[nodeConfig.blockchain].requirements[nodeConfig.mode];
    // Convertir GB en bytes
    return requirements.memoryGB * 1024 * 1024 * 1024;
  }

  /**
   * Attacher les logs du container
   */
  private async attachContainerLogs(container: Docker.Container, nodeId: string): Promise<void> {
    const nodeLogger = getNodeLogger(nodeId);

    try {
      const logStream = await container.logs({
        follow: true,
        stdout: true,
        stderr: true,
        tail: 100,
      });

      logStream.on('data', (chunk: Buffer) => {
        const logLine = chunk.toString('utf8').trim();
        if (logLine) {
          nodeLogger.info(logLine);
          this.emit('node:log', { nodeId, message: logLine });
        }
      });

      logStream.on('error', (err: Error) => {
        nodeLogger.error('Erreur du stream de logs', { error: err.message });
      });

    } catch (error) {
      nodeLogger.error('Impossible d\'attacher les logs', { error });
    }
  }

  // ============================================================
  // MÉTRIQUES & MONITORING
  // ============================================================

  /**
   * Démarrer la collecte périodique des métriques
   */
  private startMetricsCollection(): void {
    // Collecter les métriques toutes les 10 secondes
    this.metricsInterval = setInterval(() => {
      this.collectAllMetrics();
    }, 10000);

    // Vérifier la sync toutes les 30 secondes
    this.syncCheckInterval = setInterval(() => {
      this.checkAllSyncStatus();
    }, 30000);
  }

  /**
   * Collecter les métriques de tous les nodes
   */
  private async collectAllMetrics(): Promise<void> {
    for (const [nodeId, state] of this.nodeStates) {
      if (state.containerId) {
        try {
          const container = this.docker.getContainer(state.containerId);
          const stats = await container.stats({ stream: false });

          const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
          const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
          const cpuUsage = (cpuDelta / systemDelta) * stats.cpu_stats.online_cpus * 100;

          const memoryUsage = stats.memory_stats.usage / (1024 * 1024);
          const memoryLimit = stats.memory_stats.limit / (1024 * 1024);

          const metrics: NodeMetrics = {
            id: nodeId,
            cpuUsage: Math.round(cpuUsage * 100) / 100,
            memoryUsage: Math.round(memoryUsage * 100) / 100,
            memoryLimit: Math.round(memoryLimit * 100) / 100,
            diskUsage: 0, // TODO: calculer depuis le volume
            networkIn: (stats.networks?.eth0?.rx_bytes || 0) / (1024 * 1024),
            networkOut: (stats.networks?.eth0?.tx_bytes || 0) / (1024 * 1024),
            timestamp: new Date(),
          };

          this.nodeMetrics.set(nodeId, metrics);
          this.emit('node:metrics', metrics);

          // Mettre à jour l'uptime
          state.uptime += 10;

        } catch (error) {
          // Container probablement arrêté
          logger.debug(`Impossible de collecter les métriques pour ${nodeId}`);
        }
      }
    }
  }

  /**
   * Vérifier le statut de synchronisation de tous les nodes
   */
  private async checkAllSyncStatus(): Promise<void> {
    for (const [nodeId, state] of this.nodeStates) {
      if (state.status === 'syncing' || state.status === 'ready') {
        try {
          const nodeConfig = this.nodes.get(nodeId)!;
          const syncStatus = await this.getSyncStatus(nodeConfig);
          
          state.syncProgress = syncStatus.progress;
          state.blockHeight = syncStatus.currentBlock;
          state.latestBlock = syncStatus.highestBlock;
          state.peers = syncStatus.peers;

          if (syncStatus.progress >= 100 && state.status !== 'ready') {
            state.status = 'ready';
            this.emit('node:status', { nodeId, status: 'ready' });
            getNodeLogger(nodeId).info('Synchronisation terminée!');
          }

          this.emit('node:sync', { nodeId, ...syncStatus });

        } catch (error) {
          logger.debug(`Impossible de vérifier la sync pour ${nodeId}`);
        }
      }
    }
  }

  /**
   * Obtenir le statut de synchronisation d'un node
   */
  private async getSyncStatus(nodeConfig: NodeConfig): Promise<{
    syncing: boolean;
    progress: number;
    currentBlock: number;
    highestBlock: number;
    peers: number;
  }> {
    // TODO: Implémenter les appels RPC pour chaque blockchain
    // Pour le MVP, on retourne des valeurs simulées
    return {
      syncing: true,
      progress: 75,
      currentBlock: 800000,
      highestBlock: 820000,
      peers: 8,
    };
  }

  // ============================================================
  // GETTERS
  // ============================================================

  /**
   * Obtenir tous les nodes
   */
  getAllNodes(): NodeInfo[] {
    return Array.from(this.nodes.values()).map(config => ({
      config,
      state: this.nodeStates.get(config.id)!,
      metrics: this.nodeMetrics.get(config.id)!,
    }));
  }

  /**
   * Obtenir un node par ID
   */
  getNode(nodeId: string): NodeInfo | null {
    const config = this.nodes.get(nodeId);
    if (!config) return null;

    return {
      config,
      state: this.nodeStates.get(nodeId)!,
      metrics: this.nodeMetrics.get(nodeId)!,
    };
  }

  /**
   * Obtenir les logs d'un node
   */
  async getNodeLogs(nodeId: string, lines: number = 100): Promise<string[]> {
    const state = this.nodeStates.get(nodeId);
    
    if (state?.containerId) {
      try {
        const container = this.docker.getContainer(state.containerId);
        const logs = await container.logs({
          stdout: true,
          stderr: true,
          tail: lines,
        });
        return logs.toString().split('\n').filter(Boolean);
      } catch {
        // Fallback aux fichiers de logs
      }
    }

    // Lire depuis les fichiers
    const { getNodeLogs } = await import('../utils/logger');
    return getNodeLogs(nodeId, lines);
  }

  /**
   * Obtenir le nombre de nodes par blockchain
   */
  getNodeCounts(): Record<BlockchainType, number> {
    const counts: Record<BlockchainType, number> = {
      bitcoin: 0,
      ethereum: 0,
      solana: 0,
      monero: 0,
      bnb: 0,
    };

    for (const node of this.nodes.values()) {
      counts[node.blockchain]++;
    }

    return counts;
  }

  // ============================================================
  // CLEANUP
  // ============================================================

  /**
   * Arrêter proprement le manager
   */
  async shutdown(): Promise<void> {
    logger.info('Arrêt du NodeManager...');

    // Arrêter les intervalles
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    if (this.syncCheckInterval) {
      clearInterval(this.syncCheckInterval);
    }

    // Arrêter tous les nodes
    for (const [nodeId, state] of this.nodeStates) {
      if (state.containerId) {
        try {
          await this.stopNode(nodeId);
        } catch (error) {
          logger.error(`Erreur lors de l'arrêt du node ${nodeId}`, { error });
        }
      }
    }

    logger.info('NodeManager arrêté');
  }
}

// Singleton
export const nodeManager = new NodeManager();
export default nodeManager;
