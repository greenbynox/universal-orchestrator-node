"use strict";
/**
 * ============================================================
 * NODE ORCHESTRATOR - Main Server
 * ============================================================
 * Point d'entrée principal de l'application
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wsHandler = exports.httpServer = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const http_1 = require("http");
const path_1 = __importDefault(require("path"));
const config_1 = require("./config");
const logger_1 = require("./utils/logger");
const api_1 = require("./api");
const websocket_1 = require("./websocket");
const NodeManager_1 = require("./core/NodeManager");
const auth_1 = require("./utils/auth");
const apiAuth_1 = __importDefault(require("./middleware/apiAuth"));
const blockchains_1 = __importDefault(require("./routes/blockchains"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const alerts_1 = __importDefault(require("./routes/alerts"));
const wallets_1 = __importDefault(require("./routes/wallets"));
require("./services/notifications");
const PruningService_1 = require("./services/pruning/PruningService");
// ============================================================
// EXPRESS APP SETUP
// ============================================================
const app = (0, express_1.default)();
exports.app = app;
const httpServer = (0, http_1.createServer)(app);
exports.httpServer = httpServer;
// Middleware de sécurité avec CSP activé
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            // Dev-only relaxations: React/Vite dev tooling may require eval/inline.
            // In production, keep scripts strict.
            scriptSrc: config_1.config.isDev
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
const getAllowedOrigins = () => {
    const configured = config_1.config.api.allowedOrigins || [];
    if (configured.length > 0)
        return configured;
    return config_1.config.isDev ? defaultDevOrigins : ['http://localhost:3000'];
};
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
        const allowed = getAllowedOrigins();
        if (allowed.includes(origin)) {
            callback(null, true);
        }
        else if (config_1.config.isDev && (config_1.config.api.allowedOrigins || []).length === 0 && devLocalhostOriginRe.test(origin)) {
            // Dev: allow Vite/devtools regardless of which localhost port they picked.
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
}));
// Rate limiting (dynamic: can be toggled via runtime settings)
// En développement: polling frequent nécessaire pour le dev (App.tsx fait ~36 requêtes/min)
// En production: protection contre abus/DDoS
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // 200 requêtes par fenêtre
    message: 'Trop de requêtes, veuillez réessayer plus tard',
    skip: () => config_1.config.isDev || !config_1.config.api.rateLimitEnabled,
});
app.use('/api/', limiter);
// Stricter rate limit for authentication endpoints
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 10, // Only 10 auth attempts per 15 minutes
    message: 'Trop de tentatives, veuillez réessayer plus tard',
    skip: () => config_1.config.isDev || !config_1.config.api.rateLimitEnabled,
});
app.use('/api/auth', authLimiter);
// Body parser with size limits
app.use(express_1.default.json({ limit: '1mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '1mb' }));
// API-level auth (token/basic/none) applied to all /api routes
app.use('/api', apiAuth_1.default);
// ============================================================
// ROUTES API
// ============================================================
// Public routes (no auth required)
app.use('/api/system', api_1.systemRouter);
app.use('/api/blockchains', blockchains_1.default);
app.use('/api/wallets/hardware', wallets_1.default); // Hardware wallets are public for connection
// Protected routes (authentication required)
app.use('/api/nodes', auth_1.requireAuth, api_1.nodesRouter);
app.use('/api/wallets', auth_1.requireAuth, api_1.walletsRouter);
app.use('/api/dashboard', auth_1.requireAuth, dashboard_1.default);
app.use('/api/alerts', auth_1.requireAuth, alerts_1.default);
// Route de base
app.get('/api', (_req, res) => {
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
app.get('/api/health', (_req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});
// ============================================================
// FRONTEND STATIC (Production)
// ============================================================
if (!config_1.config.isDev) {
    // Determine frontend path - works both for standalone and Electron packaged
    let frontendPath;
    if (process.env.ELECTRON_RUN_AS_NODE) {
        // Running inside Electron packaged app - use resourcesPath
        const resourcesPath = process.env.RESOURCES_PATH || path_1.default.join(__dirname, '..');
        frontendPath = path_1.default.join(resourcesPath, 'frontend/dist');
    }
    else {
        // Standalone Node.js
        frontendPath = path_1.default.join(__dirname, '../frontend/dist');
    }
    logger_1.logger.info(`Serving frontend from: ${frontendPath}`);
    app.use(express_1.default.static(frontendPath));
    app.get('*', (_req, res) => {
        res.sendFile(path_1.default.join(frontendPath, 'index.html'));
    });
}
// ============================================================
// ERROR HANDLING
// ============================================================
// 404
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint non trouvé',
        timestamp: new Date(),
    });
});
// Error handler global
app.use((err, _req, res, _next) => {
    logger_1.logger.error('Erreur non gérée', { error: err.message, stack: err.stack });
    res.status(500).json({
        success: false,
        error: config_1.config.isDev ? err.message : 'Erreur interne du serveur',
        timestamp: new Date(),
    });
});
// ============================================================
// WEBSOCKET
// ============================================================
const wsHandler = new websocket_1.WebSocketHandler(httpServer);
exports.wsHandler = wsHandler;
// ============================================================
// WAIT FOR DOCKER (if FORCE_DOCKER is enabled)
// ============================================================
async function waitForDocker() {
    const forceDocker = process.env.FORCE_DOCKER === 'true';
    const skipDockerCheck = process.env.SKIP_DOCKER_CHECK === 'true';
    const dockerHost = process.env.DOCKER_HOST;
    const { getDockerConnectionAttempts } = require('./utils/dockerConnection');
    const connAttempts = getDockerConnectionAttempts();
    logger_1.logger.info(`Config Docker: FORCE_DOCKER=${forceDocker} DOCKER_HOST=${dockerHost || 'none'} attempts=${connAttempts.map((a) => a.label).join(',') || 'none'}`);
    // Dev convenience: allow skipping Docker entirely
    if (skipDockerCheck) {
        logger_1.logger.warn('Docker check skipped (SKIP_DOCKER_CHECK=true)');
        return;
    }
    if (!forceDocker) {
        return; // Skip if not forcing Docker
    }
    logger_1.logger.info('Attente de la disponibilité de Docker...');
    const maxAttempts = Number.isFinite(config_1.config.docker.maxRetries) ? config_1.config.docker.maxRetries : 30;
    let attempts = 0;
    while (attempts < maxAttempts) {
        try {
            const Docker = require('dockerode');
            let lastErr = null;
            let ok = false;
            for (const a of connAttempts) {
                try {
                    const docker = new Docker(a.opts);
                    const pingPromise = docker.ping();
                    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Docker ping timeout')), 5000));
                    await Promise.race([pingPromise, timeoutPromise]);
                    ok = true;
                    break;
                }
                catch (e) {
                    lastErr = e;
                }
            }
            if (!ok) {
                throw lastErr || new Error('Docker indisponible');
            }
            logger_1.logger.info('✅ Docker est disponible!');
            return;
        }
        catch (error) {
            attempts++;
            if (attempts % 5 === 0 || attempts === 1) {
                logger_1.logger.warn(`Docker non disponible (tentative ${attempts}/${maxAttempts}): ${error.message}`);
            }
            const delay = Number.isFinite(config_1.config.docker.retryDelayMs) ? config_1.config.docker.retryDelayMs : 1000;
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
    // Do not throw here to avoid crashing the entire app on machines without Docker.
    // Historically we exited, but for a packaged desktop app we prefer to continue
    // in a degraded mode and log a clear warning so users can use the app without Docker.
    logger_1.logger.error(`Docker indisponible après ${maxAttempts} tentatives. ${guidance}`);
    logger_1.logger.warn('Docker requis mais indisponible — démarrage en mode dégradé sans Docker.');
    return;
}
// ============================================================
// DÉMARRAGE DU SERVEUR
// ============================================================
// Wait for Docker before starting server
waitForDocker().then(() => {
    const isLoopbackHost = (host) => {
        const h = (host || '').trim().toLowerCase();
        return h === '127.0.0.1' || h === 'localhost' || h === '::1';
    };
    // SECURITY: refuse insecure public binding in production unless explicitly allowed.
    // This prevents accidental exposure of a no-auth local API to the LAN/Internet.
    const allowInsecureRemote = process.env.ALLOW_INSECURE_REMOTE === 'true';
    const isPublicBind = !isLoopbackHost(config_1.config.server.host);
    if (!config_1.config.isDev && isPublicBind && config_1.config.api.authMode === 'none' && !allowInsecureRemote) {
        logger_1.logger.error('Refus de démarrer: HOST n\'est pas loopback et API_AUTH_MODE=none. ' +
            'Activez une auth (API_AUTH_MODE=token/basic) ou remettez HOST=127.0.0.1. ' +
            'Override (dangereux): ALLOW_INSECURE_REMOTE=true.');
        process.exit(1);
    }
    httpServer.listen(config_1.config.server.port, config_1.config.server.host, () => {
        logger_1.logger.info(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║     🚀 NODE ORCHESTRATOR - MVP                             ║
║                                                            ║
║     Server:    http://${config_1.config.server.host}:${config_1.config.server.port}                     ║
║     API:       http://${config_1.config.server.host}:${config_1.config.server.port}/api                 ║
║     WebSocket: ws://${config_1.config.server.host}:${config_1.config.server.port}                       ║
║     Mode:      ${config_1.config.env.toUpperCase().padEnd(42)}║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `);
        // Start background services
        PruningService_1.pruningService.start();
    });
}).catch(error => {
    logger_1.logger.error('Erreur lors de l\'attente de Docker', { error });
    process.exit(1);
});
// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================
async function shutdown(signal) {
    logger_1.logger.info(`Signal ${signal} reçu. Arrêt en cours...`);
    try {
        // Arrêter les managers
        await NodeManager_1.nodeManager.shutdown();
        // Fermer le serveur HTTP
        httpServer.close(() => {
            logger_1.logger.info('Serveur HTTP fermé');
            process.exit(0);
        });
        // Force exit après 30 secondes
        setTimeout(() => {
            logger_1.logger.warn('Arrêt forcé après timeout');
            process.exit(1);
        }, 30000);
    }
    catch (error) {
        logger_1.logger.error('Erreur lors de l\'arrêt', { error });
        process.exit(1);
    }
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
//# sourceMappingURL=server.js.map