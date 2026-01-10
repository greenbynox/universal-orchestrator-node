"use strict";
/**
 * ============================================================
 * NODE ORCHESTRATOR - Configuration
 * ============================================================
 * 100% FREE & OPEN SOURCE - NO LIMITS
 * Gestion centralisée de la configuration
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BLOCKCHAIN_CONFIGS = exports.config = void 0;
exports.getBlockchainConfig = getBlockchainConfig;
exports.getNextAvailablePort = getNextAvailablePort;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Charger les variables d'environnement
dotenv_1.default.config();
// ============================================================
// RUNTIME SETTINGS (persisted JSON) -> process.env overrides
// ============================================================
// NOTE: this runs BEFORE building the exported `config` object so that
// all downstream modules (including NodeManager) see the effective values.
const computeDataPath = () => {
    const explicit = process.env.DATA_PATH;
    if (explicit)
        return path_1.default.resolve(explicit);
    const nodesPath = process.env.NODES_DATA_PATH ? path_1.default.resolve(process.env.NODES_DATA_PATH) : '';
    if (nodesPath && path_1.default.basename(nodesPath).toLowerCase() === 'nodes') {
        return path_1.default.dirname(nodesPath);
    }
    if (nodesPath)
        return nodesPath;
    return path_1.default.resolve('./data');
};
const runtimeSettingsFile = path_1.default.join(computeDataPath(), 'settings.json');
const setEnvBool = (key, value) => {
    if (typeof value === 'boolean')
        process.env[key] = value ? 'true' : 'false';
    if (typeof value === 'string') {
        const s = value.trim().toLowerCase();
        if (s === 'true' || s === 'false')
            process.env[key] = s;
    }
};
const setEnvNum = (key, value) => {
    const n = typeof value === 'number' ? value : (typeof value === 'string' ? Number(value) : NaN);
    if (Number.isFinite(n))
        process.env[key] = String(n);
};
const setEnvStr = (key, value) => {
    if (typeof value === 'string')
        process.env[key] = value;
};
try {
    if (fs_1.default.existsSync(runtimeSettingsFile)) {
        const raw = fs_1.default.readFileSync(runtimeSettingsFile, 'utf8');
        const parsed = JSON.parse(raw);
        // Docker / infra
        setEnvBool('DOCKER_AUTO_START', parsed.dockerAutoStart);
        setEnvBool('SKIP_DOCKER_CHECK', parsed.skipDockerCheck);
        setEnvNum('DOCKER_MAX_RETRIES', parsed.dockerMaxRetries);
        setEnvNum('DOCKER_RETRY_DELAY_MS', parsed.dockerRetryDelayMs);
        // Nodes
        setEnvNum('NODE_MAX_CONCURRENT', parsed.nodeMaxConcurrent);
        setEnvBool('NODE_AUTO_RESTART', parsed.nodeAutoRestart);
        setEnvNum('NODE_START_TIMEOUT_MS', parsed.nodeStartTimeoutMs);
        // Alerts / health
        setEnvNum('ALERT_CPU_THRESHOLD', parsed.alertCpuThreshold);
        setEnvNum('ALERT_RAM_THRESHOLD', parsed.alertRamThreshold);
        setEnvNum('ALERT_DISK_THRESHOLD_GB', parsed.alertDiskThresholdGB);
        setEnvNum('HEALTHCHECK_INTERVAL_SECONDS', parsed.healthcheckIntervalSeconds);
        setEnvStr('ALERT_MIN_SEVERITY', parsed.alertMinSeverity);
        // API
        setEnvBool('API_RATE_LIMIT_ENABLED', parsed.apiRateLimitEnabled);
        setEnvStr('API_TOKEN', parsed.apiToken);
        setEnvStr('API_BASIC_USER', parsed.apiBasicUser);
        setEnvStr('API_BASIC_PASS', parsed.apiBasicPass);
        setEnvStr('ALLOWED_ORIGINS', parsed.allowedOrigins);
        // Apply auth mode last, and guard against invalid combinations in dev.
        const isDev = process.env.NODE_ENV !== 'production';
        const mode = typeof parsed.apiAuthMode === 'string' ? parsed.apiAuthMode.trim().toLowerCase() : '';
        const token = typeof parsed.apiToken === 'string' ? parsed.apiToken.trim() : (process.env.API_TOKEN || '').trim();
        const user = typeof parsed.apiBasicUser === 'string' ? parsed.apiBasicUser.trim() : (process.env.API_BASIC_USER || '').trim();
        const pass = typeof parsed.apiBasicPass === 'string' ? parsed.apiBasicPass.trim() : (process.env.API_BASIC_PASS || '').trim();
        if (mode === 'token' && !token && isDev) {
            setEnvStr('API_AUTH_MODE', 'none');
        }
        else if (mode === 'basic' && (!user || !pass) && isDev) {
            setEnvStr('API_AUTH_MODE', 'none');
        }
        else {
            setEnvStr('API_AUTH_MODE', parsed.apiAuthMode);
        }
        // Integrations
        setEnvStr('DISCORD_WEBHOOK_URL', parsed.discordWebhookUrl);
        setEnvStr('TELEGRAM_BOT_TOKEN', parsed.telegramBotToken);
        setEnvStr('TELEGRAM_CHAT_ID', parsed.telegramChatId);
        // Logs
        setEnvStr('LOG_LEVEL', parsed.logLevel);
        setEnvBool('LOG_TO_FILE', parsed.logToFile);
        setEnvStr('LOG_FILE_PATH', parsed.logFilePath);
    }
}
catch {
    // ignore invalid settings.json (falls back to .env/defaults)
}
// ============================================================
// CONFIGURATION GÉNÉRALE (100% GRATUIT - AUCUNE LIMITE)
// ============================================================
exports.config = {
    // Environnement
    env: process.env.NODE_ENV || 'development',
    isDev: process.env.NODE_ENV !== 'production',
    // Serveur
    server: {
        port: parseInt(process.env.PORT || '3001'),
        host: (() => {
            const raw = (process.env.HOST || '127.0.0.1').trim();
            const isDev = process.env.NODE_ENV !== 'production';
            const devBindRemote = (process.env.DEV_BIND_REMOTE || '').trim().toLowerCase() === 'true';
            // In dev, default to loopback to avoid firewall/Vite proxy/WebSocket issues.
            // Opt-out: DEV_BIND_REMOTE=true
            if (isDev && !devBindRemote) {
                return '127.0.0.1';
            }
            return raw || '127.0.0.1';
        })(),
    },
    // Sécurité - CRITICAL: These MUST be set in production
    security: {
        jwtSecret: (() => {
            const secret = process.env.JWT_SECRET;
                if (!secret && process.env.NODE_ENV === 'production') {
                    // Warn but do not crash: auto-generate ephemeral secret to allow packaged apps/CI to start.
                    // Operators should provide a persistent JWT_SECRET in production environments.
                    console.error('CRITICAL: JWT_SECRET not set in production. Auto-generating an ephemeral secret — set JWT_SECRET to a persistent secret to secure tokens.');
                }
                return secret || 'dev-secret-change-me-' + require('crypto').randomBytes(16).toString('hex');
        })(),
        encryptionKey: (() => {
            const key = process.env.ENCRYPTION_KEY;
            if (!key && process.env.NODE_ENV === 'production') {
                // Warn but do not crash: auto-generate ephemeral key to allow packaged apps/CI to start.
                // Operators should provide a persistent ENCRYPTION_KEY (32 chars) in production environments.
                console.error('CRITICAL: ENCRYPTION_KEY not set in production. Auto-generating an ephemeral key — set ENCRYPTION_KEY to a persistent 32-character secret to secure stored wallets.');
            }
            // Key must be exactly 32 characters for AES-256
            if (key && key.length !== 32) {
                throw new Error('ENCRYPTION_KEY must be exactly 32 characters');
            }
            return key || require('crypto').randomBytes(16).toString('hex');
        })(),
    },
    // Chemins
    paths: {
        // DATA_PATH (base) + NODES_DATA_PATH (dossier nodes) peuvent être configurés séparément.
        // Compat: si NODES_DATA_PATH pointe vers "./data/nodes", on déduit data="./data".
        data: (() => {
            const explicit = process.env.DATA_PATH;
            if (explicit)
                return path_1.default.resolve(explicit);
            const nodesPath = process.env.NODES_DATA_PATH ? path_1.default.resolve(process.env.NODES_DATA_PATH) : '';
            if (nodesPath && path_1.default.basename(nodesPath).toLowerCase() === 'nodes') {
                return path_1.default.dirname(nodesPath);
            }
            // Ancien comportement: si NODES_DATA_PATH était un dossier racine, on le considère comme data.
            if (nodesPath)
                return nodesPath;
            return path_1.default.resolve('./data');
        })(),
        nodes: path_1.default.resolve(process.env.NODES_DATA_PATH || './data/nodes'),
        wallets: path_1.default.resolve(process.env.WALLETS_DATA_PATH || './data/wallets'),
        logs: path_1.default.resolve(process.env.LOGS_PATH || './data/logs'),
    },
    // Docker
    docker: {
        // Par défaut: sockets locaux (named pipe Windows / unix socket ailleurs).
        // Sécurité: DOCKER_HOST=tcp://... n'est autorisé QUE si loopback (localhost/127.0.0.1/::1).
        // (Utile pour Docker Engine dans WSL2 exposé en localhost:2375)
        socketPath: (() => {
            const socketOverride = process.env.DOCKER_SOCKET;
            if (socketOverride)
                return socketOverride;
            const dockerHost = process.env.DOCKER_HOST;
            if (dockerHost && !dockerHost.startsWith('tcp://')) {
                if (dockerHost.startsWith('unix://'))
                    return dockerHost.slice('unix://'.length);
                if (dockerHost.startsWith('npipe://'))
                    return dockerHost.replace(/^npipe:\/\//, '');
                // Treat anything else as a socket path.
                return dockerHost;
            }
            return process.platform === 'win32' ? '//./pipe/docker_engine' : '/var/run/docker.sock';
        })(),
        networkName: 'node-orchestrator-network',
        autoStart: process.env.DOCKER_AUTO_START !== 'false',
        maxRetries: parseInt(process.env.DOCKER_MAX_RETRIES || '30'),
        retryDelayMs: parseInt(process.env.DOCKER_RETRY_DELAY_MS || '4000'),
    },
    // API / sécurité HTTP
    api: {
        authMode: (process.env.API_AUTH_MODE || 'none').toLowerCase(), // none | basic | token
        apiToken: process.env.API_TOKEN || '',
        basicUser: process.env.API_BASIC_USER || '',
        basicPass: process.env.API_BASIC_PASS || '',
        allowedOrigins: (process.env.ALLOWED_ORIGINS || '')
            .split(',')
            .map(o => o.trim())
            .filter(Boolean),
        rateLimitEnabled: process.env.API_RATE_LIMIT_ENABLED !== 'false',
    },
    // Redémarrage auto des nodes
    node: {
        autoRestart: process.env.NODE_AUTO_RESTART !== 'false',
        autoRestartMaxAttempts: parseInt(process.env.NODE_AUTO_RESTART_MAX_ATTEMPTS || '3'),
        autoRestartDelayMs: parseInt(process.env.NODE_AUTO_RESTART_DELAY_MS || '10000'),
        maxConcurrent: parseInt(process.env.NODE_MAX_CONCURRENT || '3'),
        // Pull + démarrage + début de sync peuvent dépasser 60s: on étend le timeout par défaut
        startTimeoutMs: parseInt(process.env.NODE_START_TIMEOUT_MS || '180000'),
    },
    // Seuils d'alertes système
    alerts: {
        cpuThreshold: parseInt(process.env.ALERT_CPU_THRESHOLD || '85'),
        ramThreshold: parseInt(process.env.ALERT_RAM_THRESHOLD || '85'),
        diskThresholdGB: parseInt(process.env.ALERT_DISK_THRESHOLD_GB || '20'),
        healthcheckIntervalSeconds: parseInt(process.env.HEALTHCHECK_INTERVAL_SECONDS || '30'),
        minSeverity: (process.env.ALERT_MIN_SEVERITY || 'warning').toLowerCase(),
    },
    // APIs externes (optionnel)
    external: {
        infuraProjectId: process.env.INFURA_PROJECT_ID || '',
        alchemyApiKey: process.env.ALCHEMY_API_KEY || '',
    },
};
exports.BLOCKCHAIN_CONFIGS = {
    bitcoin: {
        name: 'bitcoin',
        displayName: 'Bitcoin',
        symbol: 'BTC',
        color: '#F7931A',
        icon: '₿',
        dockerImages: {
            full: 'kylemanna/bitcoind:latest',
            pruned: 'kylemanna/bitcoind:latest',
            light: 'lncm/neutrino:latest',
        },
        defaultPorts: { rpc: 8332, p2p: 8333 },
        requirements: {
            full: { diskGB: 600, memoryGB: 4, syncDays: 7 },
            pruned: { diskGB: 10, memoryGB: 2, syncDays: 3 },
            light: { diskGB: 1, memoryGB: 1, syncDays: 0.1 },
        },
        derivationPath: "m/84'/0'/0'/0/0",
        rpcMethods: {
            getBlockHeight: 'getblockcount',
            getSyncStatus: 'getblockchaininfo',
            getPeers: 'getpeerinfo',
        },
    },
    ethereum: {
        name: 'ethereum',
        displayName: 'Ethereum',
        symbol: 'ETH',
        color: '#627EEA',
        icon: 'Ξ',
        dockerImages: {
            full: 'ethereum/client-go:latest',
            pruned: 'ethereum/client-go:latest',
            light: 'ethereum/client-go:latest',
        },
        defaultPorts: { rpc: 8545, p2p: 30303, ws: 8546 },
        requirements: {
            full: { diskGB: 1000, memoryGB: 16, syncDays: 7 },
            pruned: { diskGB: 250, memoryGB: 8, syncDays: 2 },
            light: { diskGB: 1, memoryGB: 2, syncDays: 0.1 },
        },
        derivationPath: "m/44'/60'/0'/0/0",
        rpcMethods: {
            getBlockHeight: 'eth_blockNumber',
            getSyncStatus: 'eth_syncing',
            getPeers: 'net_peerCount',
        },
    },
    solana: {
        name: 'solana',
        displayName: 'Solana',
        symbol: 'SOL',
        color: '#14F195',
        icon: '◎',
        dockerImages: {
            full: 'solanalabs/solana:latest',
            pruned: 'solanalabs/solana:latest',
            light: 'solanalabs/solana:latest',
        },
        defaultPorts: { rpc: 8899, p2p: 8001, ws: 8900 },
        requirements: {
            full: { diskGB: 2000, memoryGB: 128, syncDays: 1 },
            pruned: { diskGB: 500, memoryGB: 64, syncDays: 0.5 },
            light: { diskGB: 50, memoryGB: 16, syncDays: 0.1 },
        },
        derivationPath: "m/44'/501'/0'/0'",
        rpcMethods: {
            getBlockHeight: 'getSlot',
            getSyncStatus: 'getHealth',
            getPeers: 'getClusterNodes',
        },
    },
    monero: {
        name: 'monero',
        displayName: 'Monero',
        symbol: 'XMR',
        color: '#FF6600',
        icon: 'ɱ',
        dockerImages: {
            full: 'sethsimmons/simple-monerod:latest',
            pruned: 'sethsimmons/simple-monerod:latest',
            light: 'sethsimmons/simple-monerod:latest',
        },
        defaultPorts: { rpc: 18081, p2p: 18080 },
        requirements: {
            full: { diskGB: 180, memoryGB: 4, syncDays: 3 },
            pruned: { diskGB: 50, memoryGB: 2, syncDays: 1 },
            light: { diskGB: 5, memoryGB: 1, syncDays: 0.1 },
        },
        derivationPath: "m/44'/128'/0'/0/0",
        rpcMethods: {
            getBlockHeight: 'get_block_count',
            getSyncStatus: 'sync_info',
            getPeers: 'get_connections',
        },
    },
    bnb: {
        name: 'bnb',
        displayName: 'BNB Chain',
        symbol: 'BNB',
        color: '#F3BA2F',
        icon: '🔶',
        dockerImages: {
            full: 'ghcr.io/bnb-chain/bsc:latest',
            pruned: 'ghcr.io/bnb-chain/bsc:latest',
            light: 'ghcr.io/bnb-chain/bsc:latest',
        },
        defaultPorts: { rpc: 8545, p2p: 30311, ws: 8546 },
        requirements: {
            full: { diskGB: 2500, memoryGB: 32, syncDays: 14 },
            pruned: { diskGB: 300, memoryGB: 16, syncDays: 3 },
            light: { diskGB: 10, memoryGB: 4, syncDays: 0.1 },
        },
        derivationPath: "m/44'/60'/0'/0/0", // Même que ETH (EVM compatible)
        rpcMethods: {
            getBlockHeight: 'eth_blockNumber',
            getSyncStatus: 'eth_syncing',
            getPeers: 'net_peerCount',
        },
    },
};
// ============================================================
// HELPERS
// ============================================================
/**
 * Obtenir la configuration d'une blockchain
 */
function getBlockchainConfig(blockchain) {
    return exports.BLOCKCHAIN_CONFIGS[blockchain];
}
/**
 * Obtenir le prochain port disponible pour un type de node
 */
function getNextAvailablePort(blockchain, existingPorts, blockchainDef // Optional BlockchainDefinition to avoid circular imports
) {
    let defaultPorts;
    // Utiliser blockchainRegistry si fourni, sinon utiliser BLOCKCHAIN_CONFIGS
    if (blockchainDef) {
        defaultPorts = blockchainDef.mainnet?.defaultPorts;
        // Certains enregistrements n'ont pas de ports par défaut définis
        if (!defaultPorts) {
            switch (blockchainDef.chainType) {
                case 'cosmos':
                    defaultPorts = { rpc: 26657, p2p: 26656, ws: 26657 };
                    break;
                case 'evm':
                    defaultPorts = { rpc: 8545, p2p: 30303, ws: 8546 };
                    break;
                case 'bitcoin':
                    defaultPorts = { rpc: 8332, p2p: 8333 };
                    break;
                case 'solana':
                    defaultPorts = { rpc: 8899, p2p: 8001, ws: 8900 };
                    break;
                default:
                    defaultPorts = { rpc: 8545, p2p: 30303, ws: 8546 };
            }
        }
    }
    else {
        // Fallback à BLOCKCHAIN_CONFIGS
        const config = exports.BLOCKCHAIN_CONFIGS[blockchain];
        defaultPorts = config ? config.defaultPorts : { rpc: 8545, p2p: 30303, ws: 8546 };
    }
    let offset = 0;
    while (existingPorts.includes(defaultPorts.rpc + offset) || existingPorts.includes(defaultPorts.p2p + offset)) {
        offset += 100;
    }
    return {
        rpc: defaultPorts.rpc + offset,
        p2p: defaultPorts.p2p + offset,
        ws: defaultPorts.ws ? defaultPorts.ws + offset : undefined,
    };
}
exports.default = exports.config;
//# sourceMappingURL=index.js.map