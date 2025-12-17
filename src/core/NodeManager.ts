/**
 * ============================================================
 * NODE ORCHESTRATOR - Node Manager
 * ============================================================
 * Gestionnaire principal des nodes blockchain
 * Supporte: Bitcoin, Ethereum, Solana, Monero, BNB Chain
 */

import Docker from 'dockerode';
import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import { PassThrough } from 'stream';
import axios from 'axios';
import { spawn } from 'child_process';
import {
  NodeConfig,
  NodeState,
  NodeMetrics,
  NodeInfo,
  BlockchainType,
  CreateNodeRequest,
} from '../types';
import { config, getNextAvailablePort } from '../config';
import { blockchainRegistry } from '../config/blockchains';
import { logger, getNodeLogger } from '../utils/logger';
import { generateSecureId } from '../utils/crypto';
import { canRunNode, recommendNodeMode } from '../utils/system';
import { buildNodeBinds } from '../utils/dockerBinds';
import { parseBitcoinLogLine } from '../utils/bitcoinLogParser';
import { buildRpcProbe, computeLocalConnectionInfo, getDockerPublishedHostIp, getRpcAuthFromCustomConfig } from '../utils/nodeConnection';
import { getDockerConnectionAttempts, getPreferredDockerConnection } from '../utils/dockerConnection';
import { 
  validateCreateNodeRequest, 
  validateDockerImage, 
  sanitizeNodeName,
  validateBlockchainType,
  validateNodeMode,
  auditLog 
} from './security';
import { checkDiskSpaceAndRAM, performSystemCheck } from './systemCheck';
import templateManager, { NodeTemplate } from './TemplateManager';
import HealthCheckService from '../services/alerts/HealthCheckService';

// ============================================================
// NODE MANAGER CLASS
// ============================================================

export class NodeManager extends EventEmitter {
  private docker: Docker;
  private dockerAvailable: boolean = false;
  private nodes: Map<string, NodeConfig> = new Map();
  private nodeStates: Map<string, NodeState> = new Map();
  private nodeMetrics: Map<string, NodeMetrics> = new Map();
  private metricsInterval?: NodeJS.Timeout;
  private syncCheckInterval?: NodeJS.Timeout;
  private healthCheckService: HealthCheckService;
  private restartAttempts: Map<string, number> = new Map();
  private startTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private manualStops: Set<string> = new Set();
  private autoStartDockerAttempted: boolean = false;

  private logStreams: Map<string, NodeJS.ReadableStream> = new Map();
  private lastSyncCheckAt: Map<string, number> = new Map();
  private bitcoinLogState: Map<string, {
    peerIds: Set<number>;
    bestHeightFromPeers: number;
    lastEmitAt: number;
    maxPeerIndex?: number;
    rpcPeersSeenAt?: number;
    stage?: 'headers-presync' | 'headers-sync' | 'blocks';
    stageProgress?: number;
    stageHeight?: number;
  }> = new Map();
  private peerNonZeroAt: Map<string, number> = new Map();

  private getNodesFilePath(): string {
    // Canonical location: within the nodes directory (works even if DATA_PATH differs)
    return path.join(config.paths.nodes, 'nodes.json');
  }

  private getContainerName(nodeId: string): string {
    return `orchestrator-${sanitizeNodeName(nodeId)}`;
  }

  private async findContainerByName(name: string): Promise<{ id: string } | null> {
    if (!this.dockerAvailable) return null;
    try {
      const results = await this.docker.listContainers({
        all: true,
        filters: { name: [name] } as any,
      });
      const match = results.find((c: any) => Array.isArray(c.Names) && c.Names.some((n: string) => n === `/${name}`));
      const container = match || results[0];
      return container?.Id ? { id: container.Id } : null;
    } catch {
      return null;
    }
  }

  private async reconcileExistingContainers(): Promise<void> {
    try {
      await this.checkDockerAvailability(true);
      if (!this.dockerAvailable) return;

      const containers = await this.docker.listContainers({
        all: true,
        filters: { label: ['orchestrator.node.id'] } as any,
      }).catch(() => [] as any[]);

      for (const c of containers) {
        const nodeId = c?.Labels?.['orchestrator.node.id'];
        if (!nodeId || !this.nodes.has(nodeId)) continue;
        const state = this.nodeStates.get(nodeId);
        if (!state) continue;
        if (state.containerId) continue; // already known

        state.containerId = c.Id;
        // If container exists, reflect a sensible status. Actual READY is determined by sync check.
        if (c.State === 'running') {
          state.status = 'syncing';
          this.emit('node:status', { nodeId, status: 'syncing' });
        } else {
          state.status = 'stopped';
          this.emit('node:status', { nodeId, status: 'stopped' });
        }
      }
    } catch (err) {
      logger.warn('Reconciliation des containers au démarrage échouée', { error: (err as Error).message });
    }
  }

  private clearStartTimeout(nodeId: string): void {
    const to = this.startTimeouts.get(nodeId);
    if (to) {
      clearTimeout(to);
      this.startTimeouts.delete(nodeId);
    }
  }

  private armStartTimeout(nodeId: string): void {
    // Timeout only applies to container startup / image pull, not full chain sync.
    const nodeLogger = getNodeLogger(nodeId);
    this.clearStartTimeout(nodeId);

    const startTimeout = setTimeout(async () => {
      // Timer fired; drop reference.
      this.startTimeouts.delete(nodeId);
      const state = this.nodeStates.get(nodeId);
      if (!state) return;

      // Never mark a syncing node as error: initial chain sync can take hours.
      if (state.status !== 'starting' && state.status !== 'pulling') {
        return;
      }

      if (state.containerId && this.dockerAvailable) {
        try {
          const container = this.docker.getContainer(state.containerId);
          const inspect = await container.inspect().catch(() => null);
          if (inspect?.State?.Running) {
            state.status = 'syncing';
            this.emit('node:status', { nodeId, status: 'syncing' });
            return;
          }
        } catch {
          // ignore
        }
      }

      state.status = 'error';
      state.lastError = 'Timeout de démarrage dépassé';
      nodeLogger.error('Timeout de démarrage dépassé');
      this.emit('node:status', { nodeId, status: 'error', error: 'Timeout de démarrage dépassé' });
    }, config.node.startTimeoutMs);

    this.startTimeouts.set(nodeId, startTimeout);
  }

  private markManualStop(nodeId: string): void {
    this.manualStops.add(nodeId);
    // Nettoyage automatique après un délai raisonnable pour éviter de bloquer les redémarrages futurs
    setTimeout(() => this.manualStops.delete(nodeId), config.node.autoRestartDelayMs * 2);
  }
  
  constructor() {
    super();

    // Initialiser Docker avec une tentative préférée.
    // (Le check suivant pourra basculer sur une autre tentative si nécessaire.)
    const preferred = getPreferredDockerConnection();
    logger.info(`Docker init: ${preferred.label}`);
    this.docker = new Docker(preferred.opts);
    
    // Vérifier si Docker est disponible (avec retries en arrière-plan)
    void this.checkDockerAvailability(true);
    
    // Créer les dossiers nécessaires
    this.ensureDirectories();
    
    // Charger les nodes existants
    this.loadNodes();

    // Réconcilier l'état avec les containers existants (évite les conflits de nom après redémarrage)
    void this.reconcileExistingContainers();
    
    // Démarrer la collecte des métriques
    this.startMetricsCollection();

    // Démarrer les health checks (seuils configurables)
    this.healthCheckService = new HealthCheckService(this, {
      cpuThreshold: config.alerts.cpuThreshold,
      memThresholdPercent: config.alerts.ramThreshold,
      diskFreeThresholdGB: config.alerts.diskThresholdGB,
      intervalMs: config.alerts.healthcheckIntervalSeconds * 1000,
    });
    this.healthCheckService.start();
    
    logger.info('NodeManager initialisé', { dockerAvailable: this.dockerAvailable });
  }

  /**
   * Reconfigure health checks from current config.
   * Useful when settings are updated at runtime.
   */
  public reconfigureHealthChecks(): void {
    try {
      if (this.healthCheckService) {
        this.healthCheckService.stop();
      }
    } catch {
      // ignore
    }

    this.healthCheckService = new HealthCheckService(this, {
      cpuThreshold: config.alerts.cpuThreshold,
      memThresholdPercent: config.alerts.ramThreshold,
      diskFreeThresholdGB: config.alerts.diskThresholdGB,
      intervalMs: config.alerts.healthcheckIntervalSeconds * 1000,
    });
    this.healthCheckService.start();

    logger.info('Health checks reconfigured', {
      cpuThreshold: config.alerts.cpuThreshold,
      ramThreshold: config.alerts.ramThreshold,
      diskThresholdGB: config.alerts.diskThresholdGB,
      intervalSeconds: config.alerts.healthcheckIntervalSeconds,
    });
  }

  // ============================================================
  // DOCKER AVAILABILITY CHECK
  // ============================================================

  /**
   * Vérifier si Docker est disponible
   */
  private async checkDockerAvailability(withRetry = false): Promise<void> {
    const skipDockerCheck = process.env.SKIP_DOCKER_CHECK === 'true';
    const forceDocker = process.env.FORCE_DOCKER === 'true';

    // In dev, allow skipping Docker completely to avoid blocking the app
    if (skipDockerCheck && !forceDocker) {
      this.dockerAvailable = false;
      logger.warn('Docker check skipped (SKIP_DOCKER_CHECK=true, FORCE_DOCKER=false)');
      return;
    }

    const maxAttempts = withRetry ? config.docker.maxRetries : 1;
    const delayMs = config.docker.retryDelayMs;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        // Avant de conclure que Docker est indisponible, on tente plusieurs transports possibles.
        // Utile sur Windows quand on utilise Docker Engine dans WSL2 (tcp loopback) au lieu de Docker Desktop (npipe).
        const attempts = getDockerConnectionAttempts();
        let lastErr: any = null;
        let ok = false;
        for (const a of attempts) {
          try {
            const d = new Docker(a.opts);
            const pingPromise = d.ping();
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Docker ping timeout')), 2500));
            await Promise.race([pingPromise, timeoutPromise]);
            this.docker = d;
            ok = true;
            logger.info(`Docker disponible via ${a.label}`);
            break;
          } catch (e) {
            lastErr = e;
          }
        }

        if (!ok) {
          throw lastErr || new Error('Docker indisponible');
        }
        this.dockerAvailable = true;
        logger.info('Docker est disponible');
        return;
      } catch (error) {
        this.dockerAvailable = false;
        const isDev = process.env.NODE_ENV === 'development';
        const message = isDev 
          ? 'Mode développement: Docker non disponible (mode mock activé)'
          : 'Docker n\'est pas disponible';
        logger.warn(message, { error: (error as Error).message, attempt: attempt + 1, maxAttempts });

        // Best-effort: auto-start Docker in dev if enabled
        if (withRetry && attempt === 0) {
          await this.tryAutoStartDocker();
        }

        if (attempt < maxAttempts - 1) {
          await this.delay(delayMs);
        }
      }
    }
  }

  private async tryAutoStartDocker(): Promise<void> {
    if (!config.isDev) return;
    if (!config.docker.autoStart) return;
    if (this.autoStartDockerAttempted) return;
    this.autoStartDockerAttempted = true;

    if (process.platform !== 'win32') {
      logger.debug('Auto-start Docker skipped (non-windows platform)');
      return;
    }

    const scriptPath = path.resolve(process.cwd(), 'scripts', 'start-docker.ps1');
    if (!fs.existsSync(scriptPath)) {
      logger.warn('Auto-start Docker enabled but scripts/start-docker.ps1 not found', { scriptPath });
      return;
    }

    logger.warn('Auto-start Docker: tentative de démarrage via scripts/start-docker.ps1');

    await new Promise<void>((resolve) => {
      try {
        const child = spawn('powershell.exe', ['-ExecutionPolicy', 'Bypass', '-File', scriptPath], {
          cwd: process.cwd(),
          stdio: 'ignore',
          windowsHide: true,
        });

        const timeout = setTimeout(() => {
          try { child.kill(); } catch { /* ignore */ }
          resolve();
        }, 60_000);

        child.on('exit', () => {
          clearTimeout(timeout);
          resolve();
        });

        child.on('error', () => {
          clearTimeout(timeout);
          resolve();
        });
      } catch {
        resolve();
      }
    });

    // Give a moment for the daemon to bind
    await this.delay(1500);
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Vérifier si Docker est actuellement disponible
   */
  public isDockerAvailable(): boolean {
    return this.dockerAvailable;
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
    const canonical = this.getNodesFilePath();
    const possiblePaths = [
      canonical,
      path.join(config.paths.data, 'nodes.json'),
      path.join(process.cwd(), 'data', 'nodes.json'),
      path.join(process.cwd(), 'data', 'nodes', 'nodes.json'),
    ];

    const nodesFile = possiblePaths.find(p => fs.existsSync(p));
    if (!nodesFile) {
      logger.info(`${this.nodes.size} node(s) chargé(s)`);
      return;
    }

    try {
      const fileContent = fs.readFileSync(nodesFile, 'utf-8');
      const data = JSON.parse(fileContent);
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

        // Ensure metrics are initialized for previously saved nodes
        this.nodeMetrics.set(node.id, {
          id: node.id,
          cpuUsage: 0,
          memoryUsage: 0,
          memoryLimit: 0,
          diskUsage: 0,
          networkIn: 0,
          networkOut: 0,
          timestamp: new Date(),
        });
      });

      // If loaded from a legacy path, write back to canonical to keep UI/backend consistent.
      if (nodesFile !== canonical) {
        try {
          this.saveNodes();
          logger.info('Nodes migrés vers le chemin canonique', { from: nodesFile, to: canonical });
        } catch (writeErr) {
          logger.warn('Impossible de migrer nodes.json vers le chemin canonique', { from: nodesFile, to: canonical, error: (writeErr as Error).message });
        }
      }

      logger.info(`${this.nodes.size} node(s) chargé(s)`);
    } catch (error) {
      logger.error('Erreur lors du chargement des nodes', { error });
    }
  }

  /**
   * Sauvegarder les nodes
   */
  private saveNodes(): void {
    const nodesFile = this.getNodesFilePath();
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
    // SÉCURITÉ: Valider et nettoyer toutes les entrées
    // - On valide la blockchain d'abord pour pouvoir faire une recommandation de mode si besoin.
    const blockchain = validateBlockchainType(String(request.blockchain || ''));

    // Déterminer le mode (auto-détection si non spécifié)
    const providedMode = request.mode ? validateNodeMode(String(request.mode)) : undefined;
    const recommendedMode = !providedMode ? (await recommendNodeMode(blockchain)).recommendedMode : undefined;

    const validatedRequest = validateCreateNodeRequest({
      name: request.name,
      blockchain,
      mode: (providedMode || recommendedMode) as any,
    });

    const chain = blockchainRegistry.get(validatedRequest.blockchain);
    if (!chain) {
      throw new Error(`Blockchain non supportée: ${validatedRequest.blockchain}`);
    }

    const mode = validatedRequest.mode;
    if (!providedMode) {
      logger.info(`Mode auto-détecté pour ${validatedRequest.blockchain}: ${mode}`);
    }

    // Vérifier les ressources
    const resourceCheck = await canRunNode(validatedRequest.blockchain, mode);
    if (!resourceCheck.canRun) {
      throw new Error(resourceCheck.reason);
    }
    
    // Log le warning si présent (mais continue la création)
    if (resourceCheck.warning) {
      logger.warn(resourceCheck.warning);
    }

    // Générer les ports
    const existingPorts = Array.from(this.nodes.values())
      .filter(n => n.blockchain === validatedRequest.blockchain)
      .flatMap(n => [n.rpcPort, n.p2pPort, n.wsPort].filter(Boolean)) as number[];
    
    const ports = getNextAvailablePort(validatedRequest.blockchain, existingPorts, chain);

    // Créer la configuration
    const nodeId = `${validatedRequest.blockchain}-${generateSecureId().slice(0, 8)}`;
    const nodeConfig: NodeConfig = {
      id: nodeId,
      name: validatedRequest.name || `${chain.name} Node`,
      blockchain: validatedRequest.blockchain,
      mode,
      dataPath: path.join(config.paths.nodes, nodeId),
      rpcPort: ports.rpc,
      p2pPort: ports.p2p,
      wsPort: ports.ws,
      customConfig: request.customConfig,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Provide sane, local-only RPC defaults for end users.
    // - Bitcoin RPC requires authentication for host access.
    // - We keep secrets in node config for now (local app); UI can choose to reveal/copy them.
    if (blockchain === 'bitcoin') {
      const existingAuth = getRpcAuthFromCustomConfig(nodeConfig.customConfig);
      if (!existingAuth) {
        const username = `rpc_${generateSecureId().slice(0, 8)}`;
        const password = generateSecureId();
        nodeConfig.customConfig = {
          ...(nodeConfig.customConfig ?? {}),
          rpcAuth: { username, password },
        };
      }
    }

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

    const nodeInfo: NodeInfo = {
      config: nodeConfig,
      state: nodeState,
      metrics: nodeMetrics,
    };

    logger.info(`Node créé: ${nodeId}`, { blockchain, mode });
    // Emit full node info to keep frontend store consistent.
    this.emit('node:created', nodeInfo);

    return nodeInfo;
  }

  /**
   * Démarrer un node
   */
  async startNode(nodeId: string): Promise<void> {
    const nodeConfig = this.nodes.get(nodeId);
    if (!nodeConfig) {
      throw new Error(`Node non trouvé: ${nodeId}`);
    }

    // Ensure node data directory exists (it may be removed manually or by cleanup tools)
    try {
      fs.mkdirSync(nodeConfig.dataPath, { recursive: true });
    } catch {
      // Best effort; Docker will surface a clear error later if this truly fails.
    }

    const nodeState = this.nodeStates.get(nodeId)!;
    // Idempotent start: if already starting/pulling/syncing/ready, do not error.
    if (nodeState.status === 'ready' || nodeState.status === 'syncing' || nodeState.status === 'starting' || nodeState.status === 'pulling') {
      return;
    }

    // Limite de nodes simultanés
    const runningCount = Array.from(this.nodeStates.values()).filter(s => s.status === 'ready' || s.status === 'syncing' || s.status === 'starting').length;
    if (runningCount >= config.node.maxConcurrent) {
      throw new Error(`Limite de nodes simultanés atteinte (${config.node.maxConcurrent}). Arrêtez un node avant d'en démarrer un autre.`);
    }

    const nodeLogger = getNodeLogger(nodeId);
    const chain = blockchainRegistry.get(nodeConfig.blockchain);
    
    if (!chain) {
      logger.error(`Blockchain definition not found for ${nodeConfig.blockchain}`);
      throw new Error(`Blockchain non supportée: ${nodeConfig.blockchain}`);
    }

    let requirements = chain.docker?.requirements?.[nodeConfig.mode];

    if (!requirements) {
      logger.error(`Missing requirements for ${nodeConfig.blockchain} in mode ${nodeConfig.mode}`, {
        hasDocker: !!chain.docker,
        hasRequirements: !!chain.docker?.requirements,
        availableModes: chain.docker?.requirements ? Object.keys(chain.docker.requirements) : []
      });
      
      // Fallback to default requirements if missing (Safety net)
      if (chain.chainType === 'evm') {
        logger.warn(`Using fallback requirements for ${nodeConfig.blockchain} (EVM)`);
        requirements = { diskGB: 50, memoryGB: 4, syncDays: 1 };
      } else if (chain.chainType === 'solana') {
        logger.warn(`Using fallback requirements for ${nodeConfig.blockchain} (Solana)`);
        requirements = { diskGB: 500, memoryGB: 16, syncDays: 1 };
      } else if (chain.chainType === 'cosmos') {
        logger.warn(`Using fallback requirements for ${nodeConfig.blockchain} (Cosmos)`);
        requirements = { diskGB: 100, memoryGB: 8, syncDays: 1 };
      } else {
        throw new Error(`Requirements non trouves pour ${nodeConfig.blockchain} mode ${nodeConfig.mode}`);
      }
    }
    
    // const requirements = chain.docker.requirements[nodeConfig.mode]!; // Removed as we handle it above
    const template = templateManager.getTemplate(nodeConfig.blockchain, nodeConfig.mode);
    if (template) {
      nodeLogger.info('Template YAML détecté pour ce node', { template: template.id });
    }

    // Vérification rapide disque/RAM avant de poursuivre
    try {
      await checkDiskSpaceAndRAM(requirements.diskGB, requirements.memoryGB);
    } catch (error) {
      const message = (error as Error).message || 'Ressources insuffisantes pour démarrer le node';
      nodeLogger.error(message);
      auditLog('NODE_START_BLOCKED', {
        nodeId,
        blockchain: nodeConfig.blockchain,
        mode: nodeConfig.mode,
        reason: message,
      });
      throw new Error(message);
    }

    // SÉCURITÉ: Vérifier les ressources système avant le démarrage
    nodeLogger.info('Vérification des ressources système...');
    const systemCheck = await performSystemCheck(nodeConfig.blockchain, nodeConfig.mode);
    
    if (!systemCheck.passed) {
      const errorMessage = systemCheck.errors.join('\n');
      nodeLogger.error('Ressources insuffisantes', { errors: systemCheck.errors });
      auditLog('NODE_START_BLOCKED', { 
        nodeId, 
        blockchain: nodeConfig.blockchain, 
        mode: nodeConfig.mode,
        reason: errorMessage 
      });
      throw new Error(`Impossible de démarrer le node: ${errorMessage}`);
    }
    
    // Log les warnings s'il y en a
    if (systemCheck.warnings.length > 0) {
      systemCheck.warnings.forEach(w => nodeLogger.warn(w));
    }

    // Rafraîchir l'état Docker avec retries configurables
    await this.checkDockerAvailability(true);

    // Mettre à jour le statut
    nodeState.status = 'starting';
    this.emit('node:status', { nodeId, status: 'starting' });
    nodeLogger.info('Démarrage du node...');

    // Startup timeout applies only to starting/pulling (not syncing).
    this.armStartTimeout(nodeId);

    // Mode développement: si Docker n'est pas disponible, simuler le démarrage
    // SAUF si FORCE_DOCKER=true (on veut du Docker reel)
    const forceDocker = process.env.FORCE_DOCKER === 'true';
    if (!this.dockerAvailable && process.env.NODE_ENV === 'development' && !forceDocker) {
      nodeLogger.warn('[MODE DEV] Docker non disponible - simulation du démarrage');
      nodeState.containerId = 'mock_' + generateSecureId();
      nodeState.status = 'syncing';
      nodeState.uptime = 0;
      nodeLogger.info(`Container simulé: ${nodeState.containerId}`);
      this.emit('node:status', { nodeId, status: 'syncing' });
      this.clearStartTimeout(nodeId);
      return;
    }

    try {
      // Vérifier que Docker est disponible
      if (!this.dockerAvailable) {
        throw new Error(`Docker non disponible après ${config.docker.maxRetries} tentative(s). Vérifiez que Docker Desktop est lancé.`);
      }

      const applySafetyVolumes = (cfg: Docker.ContainerCreateOptions): void => {
        // Safety: always declare /data as a volume (bind mount will override it)
        (cfg as any).Volumes = { ...(cfg as any).Volumes, '/data': {} };
      };

      const isPortAllocationError = (err: any): boolean => {
        const msg = String(err?.message || '');
        const body = String(err?.body || '');
        const combined = `${msg} ${body}`.toLowerCase();
        return (
          combined.includes('port is already allocated') ||
          combined.includes('address already in use') ||
          combined.includes('bind: address already in use') ||
          combined.includes('failed to bind')
        );
      };

      const bumpNodePorts = (): void => {
        const usedPorts = Array.from(this.nodes.values())
          .flatMap(n => [n.rpcPort, n.p2pPort, n.wsPort].filter(Boolean)) as number[];

        const chainForPorts = blockchainRegistry.get(nodeConfig.blockchain);
        const next = getNextAvailablePort(nodeConfig.blockchain, usedPorts, chainForPorts);

        const prev = { rpcPort: nodeConfig.rpcPort, p2pPort: nodeConfig.p2pPort, wsPort: nodeConfig.wsPort };
        nodeConfig.rpcPort = next.rpc;
        nodeConfig.p2pPort = next.p2p;
        nodeConfig.wsPort = next.ws;
        nodeConfig.updatedAt = new Date();
        this.nodes.set(nodeId, nodeConfig);
        this.saveNodes();

        nodeLogger.warn('Ports déjà utilisés: réattribution automatique', {
          nodeId,
          from: prev,
          to: { rpcPort: nodeConfig.rpcPort, p2pPort: nodeConfig.p2pPort, wsPort: nodeConfig.wsPort },
        });
      };

      // Construire la configuration Docker
      let containerConfig = this.buildContainerConfig(nodeConfig, template);
      applySafetyVolumes(containerConfig);

      // Si un container existe déjà pour ce node (ex: tentative précédente, crash, etc.), le réutiliser.
      const desiredName = (containerConfig.name as string) || this.getContainerName(nodeId);
      const existingBeforeCreate = await this.findContainerByName(desiredName);
      if (existingBeforeCreate) {
        const existing = this.docker.getContainer(existingBeforeCreate.id);
        nodeLogger.warn('Container déjà existant détecté, tentative de réutilisation', {
          containerName: desiredName,
          containerId: existingBeforeCreate.id.slice(0, 12),
        });

        const inspect = await existing.inspect().catch(() => null);
        const hasDataMount =
          !!inspect?.Mounts?.some((m: any) => m?.Destination === '/data') ||
          !!inspect?.HostConfig?.Binds?.some((b: string) => /:\/data(:|$)/.test(b));

        const normalizeHostIp = (ip: unknown): string => {
          const s = String(ip || '').trim();
          return s || '0.0.0.0';
        };

        const hasMatchingPortBindings = (desired: any, actual: any): boolean => {
          const desiredPB = desired?.HostConfig?.PortBindings || {};
          const actualPB = actual?.HostConfig?.PortBindings || {};
          for (const key of Object.keys(desiredPB)) {
            const desiredArr = Array.isArray(desiredPB[key]) ? desiredPB[key] : [];
            const actualArr = Array.isArray(actualPB[key]) ? actualPB[key] : [];
            // Only validate bindings where we explicitly set HostIp (RPC/WS). P2P can be wildcard.
            const desiredWithIp = desiredArr.filter((b: any) => typeof b?.HostIp === 'string' && b.HostIp.length > 0);
            if (desiredWithIp.length === 0) continue;

            for (const d of desiredWithIp) {
              const wantPort = String(d?.HostPort ?? '');
              const wantIp = normalizeHostIp(d?.HostIp);
              const ok = actualArr.some((a: any) => {
                const gotPort = String(a?.HostPort ?? '');
                const gotIp = normalizeHostIp(a?.HostIp);
                return gotPort === wantPort && gotIp === wantIp;
              });
              if (!ok) return false;
            }
          }
          return true;
        };

        // If the container exists but has no /data mount, it will crash immediately.
        // Or if port bindings don't match current expected config (ex: WSL2 bind change),
        // remove it and recreate with the correct config.
        const portBindingsMatch = inspect ? hasMatchingPortBindings(containerConfig, inspect) : false;
        if (!hasDataMount || !portBindingsMatch) {
          nodeLogger.warn('Container existant sans montage /data, suppression et recréation', {
            containerName: desiredName,
            containerId: existingBeforeCreate.id.slice(0, 12),
            reason: !hasDataMount ? 'missing-data-mount' : 'port-bindings-mismatch',
          });
          try {
            if (inspect?.State?.Running) {
              await existing.stop({ t: 10 }).catch(() => undefined);
            }
            await existing.remove({ force: true }).catch(() => undefined);
          } catch {
            // ignore
          }
        } else {
          const running = !!inspect?.State?.Running;
          if (!running) {
            await existing.start();
          }

          nodeState.containerId = existingBeforeCreate.id;
          nodeState.status = 'syncing';
          nodeState.uptime = 0;
          this.emit('node:status', { nodeId, status: 'syncing' });
          this.restartAttempts.delete(nodeId);

          this.armStartTimeout(nodeId);

          this.attachContainerLogs(existing, nodeId);
          return;
        }
      }

      // ============================================================
      // PULL L'IMAGE DOCKER SI NÉCESSAIRE
      // ============================================================
      const imageName = containerConfig.Image as string;
      nodeLogger.info(`Vérification de l'image Docker: ${imageName}`);
      
      try {
        // Essayer de trouver l'image localement
        const image = this.docker.getImage(imageName);
        const imageInspect = await image.inspect().catch(() => null);
        
        if (!imageInspect) {
          // Image non trouvée localement, la pull
          nodeLogger.info(`Image non trouvée localement, téléchargement: ${imageName}`);
          this.emit('node:status', { nodeId, status: 'pulling', message: `Téléchargement de l'image ${imageName}...` });
          this.armStartTimeout(nodeId);
          
          await new Promise<void>((resolve, reject) => {
            this.docker.pull(imageName, (err: any, stream: any) => {
              if (err) {
                nodeLogger.error(`Erreur lors du pull de l'image`, { imageName, error: err.message });
                reject(err);
                return;
              }

              let pullOutput = '';
              stream.on('data', (chunk: Buffer) => {
                pullOutput += chunk.toString();
                // Parser les lignes JSON pour suivre la progression
                const lines = pullOutput.split('\n').filter(l => l.trim());
                const lastLine = lines[lines.length - 1];
                if (lastLine) {
                  try {
                    const status = JSON.parse(lastLine);
                    if (status.status) {
                      nodeLogger.debug(`Pull progress: ${status.status}`, { id: status.id });
                    }
                  } catch {
                    // Ignorer les lignes qui ne sont pas du JSON valide
                  }
                }
              });

              stream.on('error', (err: Error) => {
                nodeLogger.error(`Erreur stream pull`, { imageName, error: err.message });
                reject(err);
              });

              stream.on('end', () => {
                nodeLogger.info(`Image téléchargée avec succès: ${imageName}`);
                resolve();
              });
            });
          });
        } else {
          nodeLogger.info(`Image trouvée localement: ${imageName}`);
        }
      } catch (pullErr) {
        nodeLogger.error(`Erreur lors de la gestion de l'image`, { imageName, error: (pullErr as Error).message });
        throw new Error(`Impossible de télécharger l'image ${imageName}: ${(pullErr as Error).message}`);
      }

      let container: Docker.Container | null = null;
      let lastError: any = null;
      const maxAttempts = Math.max(1, config.docker.maxRetries || 1);
      let portBumpAttempts = 0;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          nodeLogger.info('Création du container', { image: containerConfig.Image, binds: containerConfig.HostConfig?.Binds });
          container = await this.docker.createContainer(containerConfig);
          nodeLogger.info('Container créé, démarrage...', { containerId: container.id });
          await container.start();
          break;
        } catch (err: any) {
          lastError = err;

          // If ports are already taken on the Docker host, automatically pick a new port range and retry.
          if (isPortAllocationError(err)) {
            portBumpAttempts++;
            if (portBumpAttempts > 5) {
              nodeLogger.error('Trop de collisions de ports, abandon', { nodeId, portBumpAttempts, message: err?.message });
              break;
            }
            bumpNodePorts();
            containerConfig = this.buildContainerConfig(nodeConfig, template);
            applySafetyVolumes(containerConfig);
            // Retry immediately (no delay): this is a deterministic config problem.
            continue;
          }

          // Docker 409: le nom de container est déjà utilisé. On tente de réutiliser / nettoyer puis retenter.
          const statusCode = err?.statusCode;
          const message = String(err?.message || '');
          if (statusCode === 409 || /already in use|Conflict/i.test(message)) {
            const containerName = (containerConfig.name as string) || this.getContainerName(nodeId);
            const existing = await this.findContainerByName(containerName);
            if (existing) {
              nodeLogger.warn('Conflit de nom (409) détecté, réutilisation du container existant', {
                containerName,
                containerId: existing.id.slice(0, 12),
              });
              const existingContainer = this.docker.getContainer(existing.id);
              const inspect = await existingContainer.inspect().catch(() => null);
              const hasDataMount =
                !!inspect?.Mounts?.some((m: any) => m?.Destination === '/data') ||
                !!inspect?.HostConfig?.Binds?.some((b: string) => /:\/data(:|$)/.test(b));

              const normalizeHostIp = (ip: unknown): string => {
                const s = String(ip || '').trim();
                return s || '0.0.0.0';
              };

              const hasMatchingPortBindings = (desired: any, actual: any): boolean => {
                const desiredPB = desired?.HostConfig?.PortBindings || {};
                const actualPB = actual?.HostConfig?.PortBindings || {};
                for (const key of Object.keys(desiredPB)) {
                  const desiredArr = Array.isArray(desiredPB[key]) ? desiredPB[key] : [];
                  const actualArr = Array.isArray(actualPB[key]) ? actualPB[key] : [];
                  const desiredWithIp = desiredArr.filter((b: any) => typeof b?.HostIp === 'string' && b.HostIp.length > 0);
                  if (desiredWithIp.length === 0) continue;

                  for (const d of desiredWithIp) {
                    const wantPort = String(d?.HostPort ?? '');
                    const wantIp = normalizeHostIp(d?.HostIp);
                    const ok = actualArr.some((a: any) => {
                      const gotPort = String(a?.HostPort ?? '');
                      const gotIp = normalizeHostIp(a?.HostIp);
                      return gotPort === wantPort && gotIp === wantIp;
                    });
                    if (!ok) return false;
                  }
                }
                return true;
              };

              const portBindingsMatch = inspect ? hasMatchingPortBindings(containerConfig, inspect) : false;
              if (!hasDataMount || !portBindingsMatch) {
                nodeLogger.warn('Container en conflit à recréer (config invalide)', {
                  containerName,
                  containerId: existing.id.slice(0, 12),
                  reason: !hasDataMount ? 'missing-data-mount' : 'port-bindings-mismatch',
                });
                try {
                  if (inspect?.State?.Running) {
                    await existingContainer.stop({ t: 10 }).catch(() => undefined);
                  }
                  await existingContainer.remove({ force: true }).catch(() => undefined);
                } catch {
                  // ignore
                }
                // Continue loop and retry createContainer with correct bind mount.
                continue;
              }
              const running = !!inspect?.State?.Running;
              if (!running) {
                await existingContainer.start();
              }
              nodeState.containerId = existing.id;
              container = existingContainer;
              break;
            }
          }

          nodeLogger.error('Docker error', { 
            attempt: attempt + 1, 
            maxAttempts,
            message: err?.message,
            statusCode: err?.statusCode,
            body: err?.body,
            statusMessage: err?.statusMessage,
            fullError: JSON.stringify(err, null, 2)
          });
          if (attempt < maxAttempts - 1) {
            await this.delay(config.docker.retryDelayMs);
          }
        }
      }

      if (!container) {
        throw lastError || new Error('Docker non disponible');
      }

      // Sauvegarder l'ID du container
      nodeState.containerId = (container as any).id || nodeState.containerId || undefined;
      nodeState.status = 'syncing';
      nodeState.uptime = 0;

      nodeLogger.info(`Container démarré: ${container.id.slice(0, 12)}`);
      auditLog('NODE_STARTED', { nodeId, containerId: container.id.slice(0, 12) });
      this.emit('node:status', { nodeId, status: 'syncing' });
      this.restartAttempts.delete(nodeId);

      this.armStartTimeout(nodeId);

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
    if (!nodeState) {
      throw new Error(`Node non trouvé: ${nodeId}`);
    }

    // Marquer que l'arrêt est manuel pour éviter un auto-restart immédiat
    this.markManualStop(nodeId);

    // Si aucun containerId, tenter de trouver/supprimer un éventuel container résiduel par son nom.
    if (!nodeState.containerId) {
      const nodeLogger = getNodeLogger(nodeId);
      const containerName = this.getContainerName(nodeId);
      const existing = await this.findContainerByName(containerName);
      if (existing) {
        try {
          const container = this.docker.getContainer(existing.id);
          await container.stop({ t: 30 }).catch(() => undefined);
          await container.remove({ force: true }).catch(() => undefined);
          nodeLogger.info('Container résiduel supprimé', { containerId: existing.id.slice(0, 12), containerName });
        } catch (err) {
          nodeLogger.warn('Impossible de supprimer le container résiduel', { containerName, error: (err as Error).message });
        }
      }

      nodeState.status = 'stopped';
      nodeState.uptime = 0;
      this.emit('node:status', { nodeId, status: 'stopped' });
      this.clearStartTimeout(nodeId);
      this.detachContainerLogs(nodeId);
      return;
    }

    const nodeLogger = getNodeLogger(nodeId);
    nodeState.status = 'stopping';
    this.emit('node:status', { nodeId, status: 'stopping' });
    nodeLogger.info('Arrêt du node...');

    try {
      const container = this.docker.getContainer(nodeState.containerId);
      await container.stop({ t: 30 }).catch(() => undefined); // 30 secondes de timeout
      await container.remove({ force: true });

      nodeState.status = 'stopped';
      nodeState.containerId = undefined;
      nodeState.uptime = 0;
      this.clearStartTimeout(nodeId);
      this.detachContainerLogs(nodeId);

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

    // Arrêter/supprimer le container si présent (même si containerId est manquant)
    if (nodeState) {
      try {
        await this.stopNode(nodeId);
      } catch (err) {
        logger.warn('Suppression: stopNode a échoué, tentative de nettoyage forcé', { nodeId, error: (err as Error).message });
        const containerName = this.getContainerName(nodeId);
        const existing = await this.findContainerByName(containerName);
        if (existing) {
          const container = this.docker.getContainer(existing.id);
          await container.remove({ force: true }).catch(() => undefined);
        }
      }
    }

    // Supprimer les données
    if (fs.existsSync(nodeConfig.dataPath)) {
      fs.rmSync(nodeConfig.dataPath, { recursive: true, force: true });
    }

    // Nettoyer les maps
    this.nodes.delete(nodeId);
    this.nodeStates.delete(nodeId);
    this.nodeMetrics.delete(nodeId);
    this.clearStartTimeout(nodeId);
    this.detachContainerLogs(nodeId);
    this.restartAttempts.delete(nodeId);
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

  /**
   * Planifier un redémarrage automatique si activé
   */
  public scheduleAutoRestart(nodeId: string, reason?: string): void {
    if (!config.node.autoRestart) {
      return;
    }

    // Ne pas redémarrer automatiquement si un arrêt manuel vient d'être demandé
    if (this.manualStops.has(nodeId)) {
      logger.warn('Auto-restart ignoré: arrêt manuel en cours', { nodeId, reason });
      return;
    }

    const attempts = this.restartAttempts.get(nodeId) || 0;
    if (attempts >= config.node.autoRestartMaxAttempts) {
      logger.warn('Auto-restart ignoré: nombre max atteint', { nodeId, attempts });
      return;
    }

    const delayMs = config.node.autoRestartDelayMs;
    this.restartAttempts.set(nodeId, attempts + 1);
    logger.warn('Planification auto-restart', { nodeId, attempt: attempts + 1, delayMs, reason });

    setTimeout(async () => {
      const state = this.nodeStates.get(nodeId);
      if (state && (state.status === 'ready' || state.status === 'syncing')) {
        // Déjà reparti entre-temps
        return;
      }
      try {
        await this.startNode(nodeId);
      } catch (error) {
        logger.error('Auto-restart échoué', { nodeId, error: (error as Error).message });
      }
    }, delayMs);
  }

  // ============================================================
  // CONFIGURATION DOCKER
  // ============================================================

  /**
   * Construire la configuration du container Docker
   */
  private buildContainerConfig(nodeConfig: NodeConfig, template?: NodeTemplate): Docker.ContainerCreateOptions {
    const chain = blockchainRegistry.get(nodeConfig.blockchain);
    if (!chain?.docker) {
      throw new Error(`Blockchain ${nodeConfig.blockchain} n'a pas de config Docker`);
    }
    const image = template?.docker?.image || chain.docker.images[nodeConfig.mode as keyof typeof chain.docker.images];
    if (!image) {
      throw new Error(`Pas d'image Docker trouvée pour ${nodeConfig.blockchain} mode ${nodeConfig.mode}`);
    }

    // SÉCURITÉ: Valider que l'image est dans la whitelist si connue
    try {
      validateDockerImage(image);
    } catch (err) {
      logger.warn('Docker image not in whitelist, proceeding because template provided', { image, template: template?.id });
    }
    auditLog('DOCKER_IMAGE_VALIDATED', { 
      nodeId: nodeConfig.id, 
      blockchain: nodeConfig.blockchain, 
      mode: nodeConfig.mode, 
      image,
      template: template?.id,
    });

    // Container-side ports (used for both bindings and process args)
    const rpcContainerPort = template?.docker?.ports?.rpc || chain.mainnet.defaultPorts?.rpc || 8545;
    const p2pContainerPort = template?.docker?.ports?.p2p || chain.mainnet.defaultPorts?.p2p || 30303;
    const wsContainerPort = template?.docker?.ports?.ws || chain.mainnet.defaultPorts?.ws || 8546;

    // Configuration de base
    const containerConfig: Docker.ContainerCreateOptions = {
      name: `orchestrator-${sanitizeNodeName(nodeConfig.id)}`,
      Image: image,
      Env: this.buildEnvVars(nodeConfig, { rpc: rpcContainerPort, p2p: p2pContainerPort, ws: wsContainerPort }),
      ExposedPorts: {},
      HostConfig: {
        Binds: this.buildBinds(nodeConfig, template),
        PortBindings: {},
        RestartPolicy: { Name: 'unless-stopped' },
        Memory: this.getMemoryLimit(nodeConfig, template),
        CpuShares: this.getCpuShares(template),
        CpuPeriod: 100000,
        CapDrop: ['ALL'],
        SecurityOpt: ['no-new-privileges'],
      },
      Labels: {
        'orchestrator.node.id': nodeConfig.id,
        'orchestrator.blockchain': nodeConfig.blockchain,
        'orchestrator.mode': nodeConfig.mode,
        ...(template?.id ? { 'orchestrator.template.id': template.id } : {}),
      },
    };

    // Configuration des ports
    const portBindings: { [key: string]: { HostPort: string }[] } = {};

    // SECURITY: bind RPC and WS only on localhost by default.
    // Windows+WSL2 exception: Docker runs inside the WSL VM, so 127.0.0.1 binding
    // would be unreachable from Windows. In that case we bind to the WSL VM IP.
    // P2P remains on all interfaces to allow inbound/outbound peer connections.
    const publishedHostIp = getDockerPublishedHostIp();
    portBindings[`${rpcContainerPort}/tcp`] = [{ HostIp: publishedHostIp, HostPort: String(nodeConfig.rpcPort) }] as any;
    portBindings[`${p2pContainerPort}/tcp`] = [{ HostPort: String(nodeConfig.p2pPort) }];

    if (wsContainerPort && nodeConfig.wsPort) {
      portBindings[`${wsContainerPort}/tcp`] = [{ HostIp: publishedHostIp, HostPort: String(nodeConfig.wsPort) }] as any;
    }

    containerConfig.HostConfig!.PortBindings = portBindings;

    // Healthcheck depuis le template
    if (template?.health_check?.endpoint) {
      containerConfig.Healthcheck = {
        Test: ['CMD-SHELL', `curl -f http://localhost${template.health_check.endpoint} || exit 1`],
        Interval: (template.health_check.interval || 60) * 1_000_000_000, // ns
        Timeout: 10 * 1_000_000_000,
        Retries: 3,
      };
    }

    // Commandes spécifiques
    containerConfig.Cmd = this.buildStartCommand(nodeConfig, { rpc: rpcContainerPort, p2p: p2pContainerPort, ws: wsContainerPort });

    // Some images use an ENTRYPOINT wrapper. If our Cmd starts with the binary name,
    // force a clean Entrypoint so args are parsed as intended.
    const binaries: Record<string, string> = {
      bitcoin: 'bitcoind',
      ethereum: 'geth',
      bnb: 'geth',
      solana: 'solana-validator',
      monero: 'monerod',
    };
    const bin = binaries[nodeConfig.blockchain];
    if (bin && Array.isArray(containerConfig.Cmd) && containerConfig.Cmd[0] === bin) {
      (containerConfig as any).Entrypoint = [bin];
      containerConfig.Cmd = containerConfig.Cmd.slice(1);
    }

    return containerConfig;
  }

  /**
   * Construire les variables d'environnement
   */
  private buildEnvVars(nodeConfig: NodeConfig, ports?: { rpc: number; p2p: number; ws?: number }): string[] {
    const env: string[] = [];

    switch (nodeConfig.blockchain) {
      case 'bitcoin':
        env.push(
          'BITCOIN_DATA=/data',
          `BITCOIN_RPCPORT=${ports?.rpc ?? 8332}`,
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
          `MONERO_RPC_PORT=${ports?.rpc ?? nodeConfig.rpcPort}`,
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
  private buildStartCommand(nodeConfig: NodeConfig, ports?: { rpc: number; p2p: number; ws?: number }): string[] {
    const cmd: string[] = [];

    switch (nodeConfig.blockchain) {
      case 'bitcoin':
        {
          const auth = getRpcAuthFromCustomConfig(nodeConfig.customConfig);
          cmd.push(
            'bitcoind',
            '-server',
            // Must listen on container interface for Docker port publishing to work.
            '-rpcbind=0.0.0.0',
            // Host ports are bound to 127.0.0.1, so allowing all RPC IPs here is acceptable.
            // (Auth is still required.)
            '-rpcallowip=0.0.0.0/0',
            `-rpcport=${ports?.rpc ?? 8332}`,
            '-datadir=/data',
          );
          if (auth) {
            cmd.push(`-rpcuser=${auth.username}`, `-rpcpassword=${auth.password}`);
          }
        }
        if (nodeConfig.mode === 'pruned') {
          cmd.push('-prune=550');
        }
        break;

      case 'ethereum':
        cmd.push(
          'geth',
          '--http',
          // Must listen on container interface for Docker port publishing to work.
          '--http.addr=0.0.0.0',
          `--http.port=${ports?.rpc ?? 8545}`,
          // When accessing via WSL IP (or any non-localhost host header), Geth may reject requests
          // unless the host is whitelisted. Since we bind published ports locally on the host side,
          // allowing all vhosts here keeps UX smooth without meaningfully increasing exposure.
          '--http.vhosts=*',
          // IPC uses a unix domain socket; this can fail when /data is a bind mount on filesystems
          // that don't support unix sockets (common with Windows/WSL setups). We only need HTTP/WS.
          '--ipcdisable',
          '--datadir=/data',
        );
        if (ports?.ws) {
          cmd.push(
            '--ws',
            '--ws.addr=0.0.0.0',
            `--ws.port=${ports.ws}`,
            '--ws.origins=*',
          );
        }
        if (ports?.p2p) {
          cmd.push(`--port=${ports.p2p}`);
        }
        // Modern Geth removed/disabled the legacy "light" sync mode.
        // If the user requested "light", fall back to "snap" (closest UX: fast sync, less disk than full).
        if (nodeConfig.mode === 'light') {
          cmd.push('--syncmode=snap');
          const nodeLogger = getNodeLogger(nodeConfig.id);
          nodeLogger.warn('Mode "light" non supporté par geth; fallback automatique en "snap"');
        } else if (nodeConfig.mode === 'pruned') {
          cmd.push('--syncmode=snap');
        }
        break;

      case 'solana':
        cmd.push(
          'solana-validator',
          '--ledger=/data',
          `--rpc-port=${ports?.rpc ?? nodeConfig.rpcPort}`,
          '--no-voting',
          '--enable-rpc-transaction-history',
        );
        break;

      case 'monero':
        cmd.push(
          'monerod',
          '--data-dir=/data',
          // Must listen on container interface for Docker port publishing to work.
          '--rpc-bind-ip=0.0.0.0',
          `--rpc-bind-port=${ports?.rpc ?? nodeConfig.rpcPort}`,
        );
        if (nodeConfig.mode === 'pruned') {
          cmd.push('--prune-blockchain');
        }
        break;

      case 'bnb':
        cmd.push(
          'geth',
          '--http',
          // Must listen on container interface for Docker port publishing to work.
          '--http.addr=0.0.0.0',
          `--http.port=${ports?.rpc ?? nodeConfig.rpcPort}`,
          '--http.vhosts=*',
          '--ipcdisable',
          '--datadir=/data',
          '--config=/config/config.toml',
        );
        if (ports?.ws) {
          cmd.push(
            '--ws',
            '--ws.addr=0.0.0.0',
            `--ws.port=${ports.ws}`,
            '--ws.origins=*',
          );
        }
        break;
    }

    return cmd;
  }

  /**
   * Obtenir la limite mémoire pour un container
   */
  private getMemoryLimit(nodeConfig: NodeConfig, template?: NodeTemplate): number {
    if (template?.resources?.ram) {
      const parsed = this.parseMemory(template.resources.ram);
      if (parsed) return parsed;
    }

    const chainData = blockchainRegistry.get(nodeConfig.blockchain);
    const requirements = chainData?.docker?.requirements?.[nodeConfig.mode];
    if (!requirements) {
      // Fallback defaults by mode
      const defaults = { full: { memoryGB: 8 }, pruned: { memoryGB: 4 }, light: { memoryGB: 2 } };
      const defaultMem = (defaults[nodeConfig.mode as keyof typeof defaults]?.memoryGB || 4) * 1024 * 1024 * 1024;
      return defaultMem;
    }
    // Convertir GB en bytes
    return requirements.memoryGB! * 1024 * 1024 * 1024;
  }

  private getCpuShares(template?: NodeTemplate): number {
    if (template?.resources?.cpu) {
      const cpu = parseFloat(template.resources.cpu);
      if (!isNaN(cpu) && cpu > 0) {
        return Math.max(2, Math.round(cpu * 1024));
      }
    }
    return 512;
  }

  private parseMemory(value: string | undefined): number | null {
    if (!value) return null;
    const match = value.trim().toUpperCase().match(/([0-9.]+)\s*(GB|G|MB|M)/);
    if (!match) return null;
    const num = parseFloat(match[1]);
    const unit = match[2];
    if (unit === 'GB' || unit === 'G') {
      return Math.round(num * 1024 * 1024 * 1024);
    }
    if (unit === 'MB' || unit === 'M') {
      return Math.round(num * 1024 * 1024);
    }
    return null;
  }

  private buildBinds(nodeConfig: NodeConfig, template?: NodeTemplate): string[] {
    return buildNodeBinds(nodeConfig, template, process.platform);
  }

  /**
   * Attacher les logs du container
   */
  private async attachContainerLogs(container: Docker.Container, nodeId: string): Promise<void> {
    const nodeLogger = getNodeLogger(nodeId);

    // Ensure we don't keep multiple log streams per node.
    this.detachContainerLogs(nodeId);

    try {
      const logStream = await container.logs({
        follow: true,
        stdout: true,
        stderr: true,
        tail: 100,
      });

      this.logStreams.set(nodeId, logStream as unknown as NodeJS.ReadableStream);

      logStream.on('data', (chunk: Buffer) => {
        const text = chunk.toString('utf8');
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        for (const logLine of lines) {
          nodeLogger.info(logLine);
          this.emit('node:log', { nodeId, message: logLine });
          this.handleBitcoinLogLine(nodeId, logLine);
        }
      });

      logStream.on('error', (err: Error) => {
        nodeLogger.error('Erreur du stream de logs', { error: err.message });
      });

    } catch (error) {
      nodeLogger.error('Impossible d\'attacher les logs', { error });
    }
  }

  private detachContainerLogs(nodeId: string): void {
    const stream = this.logStreams.get(nodeId);
    if (stream) {
      try {
        (stream as any).destroy?.();
      } catch {
        // ignore
      }
      this.logStreams.delete(nodeId);
    }
    this.bitcoinLogState.delete(nodeId);
  }

  private handleBitcoinLogLine(nodeId: string, logLine: string): void {
    const nodeConfig = this.nodes.get(nodeId);
    if (!nodeConfig || nodeConfig.blockchain !== 'bitcoin') return;

    const signals = parseBitcoinLogLine(logLine);
    const hasPeerSignals = typeof signals.peerIndex === 'number' || typeof signals.peerBestHeight === 'number';
    const hasStageSignals = !!signals.stage || typeof signals.stageHeight === 'number' || typeof signals.stageProgressPercent === 'number' || typeof signals.tipHeight === 'number';
    if (!hasPeerSignals && !hasStageSignals) {
      return;
    }

    const state = this.nodeStates.get(nodeId);
    if (!state || state.status === 'stopped') return;

    const st = this.bitcoinLogState.get(nodeId) ?? { peerIds: new Set<number>(), bestHeightFromPeers: 0, lastEmitAt: 0 };
    let changed = false;

    const prevStage = st.stage;

    if (typeof signals.peerIndex === 'number') {
      // NOTE: Bitcoin logs include a peer *id* (peer=15) that is not the peer count.
      // In practice, IDs are assigned incrementally starting at 0, so (maxPeerId + 1)
      // is a good UX approximation early on (until RPC becomes available).
      if (!st.peerIds.has(signals.peerIndex)) {
        st.peerIds.add(signals.peerIndex);
        st.maxPeerIndex = Math.max(st.maxPeerIndex ?? -1, signals.peerIndex);
        changed = true;
      }

      // Once we have a recent non-zero RPC value, prefer it over the peer-id heuristic.
      const now = Date.now();
      const rpcFresh = (st.rpcPeersSeenAt ?? 0) > 0 && (now - (st.rpcPeersSeenAt ?? 0)) < 60_000;
      if (!(rpcFresh && (state.peers ?? 0) > 0)) {
        const approxPeers = Math.max(0, (st.maxPeerIndex ?? -1) + 1);
        const newPeers = Math.max(state.peers ?? 0, approxPeers);
        if (newPeers !== state.peers) {
          state.peers = newPeers;
          this.peerNonZeroAt.set(nodeId, now);
          changed = true;
        }
      }
    }

    if (typeof signals.peerBestHeight === 'number' && Number.isFinite(signals.peerBestHeight)) {
      if (signals.peerBestHeight > st.bestHeightFromPeers) {
        st.bestHeightFromPeers = signals.peerBestHeight;
      }
      const nextLatest = Math.max(state.latestBlock ?? 0, st.bestHeightFromPeers);
      if (nextLatest !== state.latestBlock) {
        state.latestBlock = nextLatest;
        changed = true;
      }
    }

    // Stage tracking: lets us present a stable overall progress and clear stage info.
    if (signals.stage && signals.stage !== st.stage) {
      st.stage = signals.stage;
      changed = true;
    }
    if (typeof signals.stageHeight === 'number' && Number.isFinite(signals.stageHeight)) {
      const nextStageHeight = Math.max(st.stageHeight ?? 0, signals.stageHeight);
      if (nextStageHeight !== st.stageHeight) {
        st.stageHeight = nextStageHeight;
        changed = true;
      }
    }
    if (typeof signals.stageProgressPercent === 'number' && Number.isFinite(signals.stageProgressPercent)) {
      const p = Math.max(0, Math.min(100, signals.stageProgressPercent));
      const nextStageProgress = Math.max(st.stageProgress ?? 0, p);
      if (nextStageProgress !== st.stageProgress) {
        st.stageProgress = nextStageProgress;
        changed = true;
      }
    }

    // Local chain height (blocks) only from UpdateTip. Avoid mixing header heights into blockHeight.
    if (typeof signals.tipHeight === 'number' && Number.isFinite(signals.tipHeight)) {
      const nextTip = Math.max(state.blockHeight ?? 0, signals.tipHeight);
      if (nextTip !== state.blockHeight) {
        state.blockHeight = nextTip;
        changed = true;
      }
      // Once blocks are progressing, treat stage as blocks.
      if (st.stage !== 'blocks') {
        st.stage = 'blocks';
        changed = true;
      }
    }

    // Expose stage info to the UI (optional fields).
    (state as any).syncStage = st.stage;
    (state as any).syncStageProgress = st.stageProgress;
    (state as any).syncStageHeight = st.stageHeight;
    (state as any).syncStageTargetHeight = st.bestHeightFromPeers || state.latestBlock || 0;

    // Compute per-stage progress for display. Regressions are only allowed when the stage changes.
    const stageChanged = st.stage !== prevStage;

    if (st.stage === 'blocks') {
      // Derive blocks sync % from local tip vs best-known height.
      const tip = Math.max(0, state.blockHeight ?? 0);
      const best = Math.max(0, state.latestBlock ?? 0, st.bestHeightFromPeers ?? 0);
      if (tip > 0 && best > 0) {
        const pct = Math.max(0, Math.min(100, (tip / best) * 100));
        st.stageProgress = stageChanged ? pct : Math.max(st.stageProgress ?? 0, pct);
      }
    }

    if (typeof st.stageProgress === 'number' && Number.isFinite(st.stageProgress)) {
      const p = Math.max(0, Math.min(100, st.stageProgress));
      const prev = Math.max(0, Math.min(100, state.syncProgress ?? 0));
      const next = stageChanged ? p : Math.max(prev, p);
      if (next !== prev) {
        state.syncProgress = next;
        changed = true;
      }
    }

    // Ensure the UI sees an active state.
    if (state.status === 'starting' || state.status === 'pulling' || state.status === 'error') {
      state.status = 'syncing';
      this.emit('node:status', { nodeId, status: 'syncing' });
      changed = true;
    }

    const now = Date.now();
    if (changed && now - st.lastEmitAt > 750) {
      st.lastEmitAt = now;
      this.emit('node:sync', {
        nodeId,
        syncing: true,
        progress: state.syncProgress ?? 0,
        currentBlock: state.blockHeight ?? 0,
        highestBlock: state.latestBlock ?? 0,
        peers: state.peers ?? 0,
        stage: st.stage,
        stageProgress: st.stageProgress,
        stageHeight: st.stageHeight,
        stageTargetHeight: st.bestHeightFromPeers || state.latestBlock || 0,
        timestamp: new Date(),
        source: 'logs',
      });
    }

    this.bitcoinLogState.set(nodeId, st);
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

    // Vérifier la sync fréquemment pour une UX réactive.
    // Le throttling se fait par node dans checkAllSyncStatus.
    this.syncCheckInterval = setInterval(() => {
      this.checkAllSyncStatus();
    }, 5000);
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
      if (state.status === 'syncing' || state.status === 'ready' || state.status === 'starting' || state.status === 'pulling') {
        try {
          const nodeConfig = this.nodes.get(nodeId)!;

          // Throttle per node to avoid spamming expensive calls.
          const now = Date.now();
          const last = this.lastSyncCheckAt.get(nodeId) || 0;
          const desiredMs = nodeConfig.blockchain === 'bitcoin' ? 5000 : 30000;
          if (now - last < desiredMs) {
            continue;
          }
          this.lastSyncCheckAt.set(nodeId, now);

          const syncStatus = await this.getSyncStatus(nodeId, nodeConfig);

          // Avoid regressing progress/height (prevents flicker with partial data).
          state.syncProgress = Math.max(state.syncProgress ?? 0, syncStatus.progress);
          state.blockHeight = Math.max(state.blockHeight ?? 0, syncStatus.currentBlock);
          state.latestBlock = Math.max(state.latestBlock ?? 0, syncStatus.highestBlock);

          // Avoid peers: 9 -> 0 due to transient failures / early startup.
          const prevPeers = state.peers ?? 0;
          const peers = syncStatus.peers;
          const lastNonZero = this.peerNonZeroAt.get(nodeId) || 0;
          if (peers > 0) {
            this.peerNonZeroAt.set(nodeId, now);
            state.peers = peers;

            if (nodeConfig.blockchain === 'bitcoin') {
              const st = this.bitcoinLogState.get(nodeId) ?? { peerIds: new Set<number>(), bestHeightFromPeers: 0, lastEmitAt: 0 };
              st.rpcPeersSeenAt = now;
              this.bitcoinLogState.set(nodeId, st);
            }
          } else if (!(prevPeers > 0 && (now - lastNonZero) < 30_000)) {
            state.peers = peers;
          }

          if (syncStatus.progress >= 100 && state.status !== 'ready') {
            state.status = 'ready';
            this.clearStartTimeout(nodeId);
            this.emit('node:status', { nodeId, status: 'ready' });
            getNodeLogger(nodeId).info('Synchronisation terminée!');
          }

          this.emit('node:sync', { nodeId, ...syncStatus, timestamp: new Date() });

        } catch (error) {
          logger.debug(`Impossible de vérifier la sync pour ${nodeId}`);
        }
      }
    }
  }

  /**
   * Obtenir le statut de synchronisation d'un node
   */
  private async execInContainer(containerId: string, cmd: string[]): Promise<{ stdout: string; stderr: string; exitCode?: number }> {
    const container = this.docker.getContainer(containerId);
    const exec = await container.exec({
      Cmd: cmd,
      AttachStdout: true,
      AttachStderr: true,
    });

    const stream = await exec.start({ hijack: true, stdin: false });
    const stdoutStream = new PassThrough();
    const stderrStream = new PassThrough();
    // dockerode multiplexes stdout/stderr into the same stream.
    (this.docker as any).modem.demuxStream(stream, stdoutStream, stderrStream);

    const collect = (s: PassThrough) => new Promise<string>((resolve) => {
      let out = '';
      s.on('data', (chunk: Buffer) => (out += chunk.toString('utf8')));
      s.on('end', () => resolve(out));
      s.on('error', () => resolve(out));
    });

    const done = new Promise<void>((resolve) => {
      stream.on('end', resolve);
      stream.on('error', resolve);
    });

    await done;
    // Ensure our PassThrough streams end so collectors resolve even if demux doesn't.
    try { stdoutStream.end(); } catch { /* ignore */ }
    try { stderrStream.end(); } catch { /* ignore */ }

    const [stdout, stderr] = await Promise.all([collect(stdoutStream), collect(stderrStream)]);

    const inspect = await exec.inspect().catch(() => null);
    return { stdout, stderr, exitCode: (inspect as any)?.ExitCode };
  }

  private async getSyncStatus(nodeId: string, nodeConfig: NodeConfig): Promise<{
    syncing: boolean;
    progress: number;
    currentBlock: number;
    highestBlock: number;
    peers: number;
  }> {
    const state = this.nodeStates.get(nodeId);
    const containerId = state?.containerId;
    if (!containerId) {
      throw new Error('Container non disponible');
    }

    // Bitcoin: use bitcoin-cli inside the container to fetch real sync + peers.
    if (nodeConfig.blockchain === 'bitcoin') {
      const parseJsonLoose = (text: string) => {
        const trimmed = String(text || '').trim();
        const start = trimmed.indexOf('{');
        const end = trimmed.lastIndexOf('}');
        if (start >= 0 && end > start) {
          return JSON.parse(trimmed.slice(start, end + 1));
        }
        return JSON.parse(trimmed);
      };

      const blockchainInfo = await this.execInContainer(containerId, [
        'bitcoin-cli',
        '-datadir=/data',
        'getblockchaininfo',
      ]);
      if (blockchainInfo.exitCode && blockchainInfo.exitCode !== 0) {
        throw new Error(blockchainInfo.stderr || blockchainInfo.stdout || 'bitcoin-cli getblockchaininfo failed');
      }

      const networkInfo = await this.execInContainer(containerId, [
        'bitcoin-cli',
        '-datadir=/data',
        'getnetworkinfo',
      ]);
      if (networkInfo.exitCode && networkInfo.exitCode !== 0) {
        throw new Error(networkInfo.stderr || networkInfo.stdout || 'bitcoin-cli getnetworkinfo failed');
      }

      const bc = parseJsonLoose(blockchainInfo.stdout);
      const net = parseJsonLoose(networkInfo.stdout);

      const verificationProgress = Number(bc?.verificationprogress ?? 0);
      const progress = Math.max(0, Math.min(100, Math.round(verificationProgress * 10000) / 100));

      const currentBlock = Number(bc?.blocks ?? 0);
      const highestBlock = Number(bc?.headers ?? currentBlock);
      const peers = Number(net?.connections ?? 0);
      const syncing = Boolean(bc?.initialblockdownload) || progress < 100;

      return { syncing, progress, currentBlock, highestBlock, peers };
    }

    // Other chains: not implemented yet. Avoid returning fake data.
    throw new Error('Sync status not implemented');
  }

  // ============================================================
  // GETTERS
  // ============================================================

  /**
   * Obtenir tous les nodes
   */
  getAllNodes(): NodeInfo[] {
    return Array.from(this.nodes.values()).map(config => {
      const fallbackState: NodeState = {
        id: config.id,
        status: 'stopped',
        syncProgress: 0,
        blockHeight: 0,
        latestBlock: 0,
        peers: 0,
        uptime: 0,
      };

      const fallbackMetrics: NodeMetrics = {
        id: config.id,
        cpuUsage: 0,
        memoryUsage: 0,
        memoryLimit: 0,
        diskUsage: 0,
        networkIn: 0,
        networkOut: 0,
        timestamp: new Date(),
      };

      return {
        config,
        state: this.nodeStates.get(config.id) || fallbackState,
        metrics: this.nodeMetrics.get(config.id) || fallbackMetrics,
      };
    });
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
   * Connection info for end users (what to do after Start).
   */
  getNodeConnectionInfo(nodeId: string): { nodeId: string; blockchain: string } & ReturnType<typeof computeLocalConnectionInfo> {
    const cfg = this.nodes.get(nodeId);
    if (!cfg) {
      throw new Error(`Node non trouvé: ${nodeId}`);
    }
    const info = computeLocalConnectionInfo(cfg);
    return { nodeId, blockchain: cfg.blockchain, ...info };
  }

  /**
   * Actively probe the node's RPC endpoint from the host.
   */
  async testNodeRpc(nodeId: string): Promise<{ ok: boolean; rpcUrl?: string; latencyMs?: number; error?: string } > {
    const cfg = this.nodes.get(nodeId);
    const st = this.nodeStates.get(nodeId);
    if (!cfg || !st) {
      throw new Error(`Node non trouvé: ${nodeId}`);
    }
    const { rpcUrl } = computeLocalConnectionInfo(cfg);
    if (st.status === 'stopped') {
      return { ok: false, rpcUrl, error: 'Node arrêté' };
    }

    // Bitcoin requires auth for host access.
    if (cfg.blockchain === 'bitcoin' && !getRpcAuthFromCustomConfig(cfg.customConfig)) {
      return {
        ok: false,
        rpcUrl,
        error: "RPC non configuré (node créé avec une ancienne version). Recréez le node pour activer l'accès RPC local.",
      };
    }

    const probe = buildRpcProbe(cfg);
    const started = Date.now();
    try {
      const resp = await axios.request({
        url: probe.url,
        method: probe.method,
        data: probe.data,
        headers: probe.headers,
        auth: probe.auth,
        timeout: 2500,
        validateStatus: () => true,
      });

      const ms = Date.now() - started;
      // Success heuristics: HTTP 200 and a JSON-RPC result.
      const ok = resp.status >= 200 && resp.status < 300 && (resp.data?.result !== undefined || resp.data?.status === 'ok');
      if (!ok) {
        const err = typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data);
        return { ok: false, rpcUrl, latencyMs: ms, error: `RPC répond mais invalide (${resp.status}): ${err}` };
      }
      return { ok: true, rpcUrl, latencyMs: ms };
    } catch (e) {
      const ms = Date.now() - started;
      const msg = (e as any)?.message || 'RPC unreachable';
      return { ok: false, rpcUrl, latencyMs: ms, error: msg };
    }
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

    if (this.healthCheckService) {
      this.healthCheckService.stop();
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
