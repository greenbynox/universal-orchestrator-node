/**
 * Embedded Server for Electron - Full Featured
 * This script starts the Express server within the Electron process
 */

const path = require('path');
const express = require('express');
const cors = require('cors');
const http = require('http');
const os = require('os');
const fs = require('fs');
const crypto = require('crypto');
const net = require('net');
const bip39 = require('bip39');

// Get paths from environment
const PORT = parseInt(process.env.PORT) || 3001;
const RESOURCES_PATH = process.env.RESOURCES_PATH || path.join(__dirname, '..');
const DATA_PATH = process.env.DATA_PATH || path.join(__dirname, '..', 'data');

console.log('=== Embedded Server Starting ===');
console.log('PORT:', PORT);
console.log('RESOURCES_PATH:', RESOURCES_PATH);
console.log('DATA_PATH:', DATA_PATH);

// Ensure data directories exist
const nodesPath = path.join(DATA_PATH, 'nodes');
const walletsPath = path.join(DATA_PATH, 'wallets');
if (!fs.existsSync(DATA_PATH)) fs.mkdirSync(DATA_PATH, { recursive: true });
if (!fs.existsSync(nodesPath)) fs.mkdirSync(nodesPath, { recursive: true });
if (!fs.existsSync(walletsPath)) fs.mkdirSync(walletsPath, { recursive: true });

// In-memory storage (will persist to files)
let nodes = [];
let wallets = [];

// Load existing data
function loadData() {
  try {
    const nodesFile = path.join(DATA_PATH, 'nodes.json');
    const walletsFile = path.join(DATA_PATH, 'wallets.json');
    if (fs.existsSync(nodesFile)) nodes = JSON.parse(fs.readFileSync(nodesFile, 'utf8'));
    if (fs.existsSync(walletsFile)) wallets = JSON.parse(fs.readFileSync(walletsFile, 'utf8'));
    console.log(`Loaded ${nodes.length} nodes and ${wallets.length} wallets`);
  } catch (e) {
    console.error('Error loading data:', e);
  }
}

function saveData() {
  try {
    fs.writeFileSync(path.join(DATA_PATH, 'nodes.json'), JSON.stringify(nodes, null, 2));
    fs.writeFileSync(path.join(DATA_PATH, 'wallets.json'), JSON.stringify(wallets, null, 2));
  } catch (e) {
    console.error('Error saving data:', e);
  }
}

loadData();

// ============================================================
// CRYPTOGRAPHY - AES-256-GCM for mnemonic encryption
// ============================================================

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const SALT_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH = 32;

/**
 * Derive a key from password using PBKDF2
 * @param {string} password - User password
 * @param {Buffer} salt - Salt for key derivation
 * @returns {Buffer} Derived key
 */
function deriveKey(password, salt) {
  return crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha512');
}

/**
 * Encrypt mnemonic with AES-256-GCM
 * @param {string} mnemonic - Plain text mnemonic
 * @param {string} password - User password for encryption
 * @returns {string} Encrypted data as base64 string (salt:iv:authTag:ciphertext)
 */
function encryptMnemonic(mnemonic, password) {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = deriveKey(password, salt);
  
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  let encrypted = cipher.update(mnemonic, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag();
  
  // Combine all parts: salt:iv:authTag:ciphertext
  return Buffer.concat([
    salt,
    iv,
    authTag,
    Buffer.from(encrypted, 'base64')
  ]).toString('base64');
}

/**
 * Decrypt mnemonic with AES-256-GCM
 * @param {string} encryptedData - Encrypted data as base64 string
 * @param {string} password - User password for decryption
 * @returns {string|null} Decrypted mnemonic or null if failed
 */
function decryptMnemonic(encryptedData, password) {
  try {
    const data = Buffer.from(encryptedData, 'base64');
    
    // Extract parts
    const salt = data.subarray(0, SALT_LENGTH);
    const iv = data.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const authTag = data.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = data.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
    
    const key = deriveKey(password, salt);
    
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(ciphertext);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString('utf8');
  } catch (err) {
    console.error('Decryption failed:', err.message);
    return null;
  }
}

/**
 * Generate a BIP39 mnemonic (12 words)
 * @returns {string} BIP39 mnemonic
 */
function generateMnemonic() {
  try {
    // Default strength is 128 bits => 12 words
    return bip39.generateMnemonic();
  } catch (err) {
    console.error('Error generating mnemonic via bip39:', err);
    // SECURITY FIX: Ne jamais utiliser de fallback non-BIP39
    // En cas d'erreur, on relance une exception plutôt que de générer un pseudo-mnemonic
    throw new Error('Failed to generate secure BIP39 mnemonic. Ensure bip39 package is installed.');
  }
}

/**
 * Validate mnemonic strength
 * @param {string} mnemonic - Mnemonic to validate
 * @returns {boolean} True if valid BIP39 mnemonic
 */
function validateMnemonic(mnemonic) {
  try {
    return bip39.validateMnemonic(mnemonic);
  } catch {
    return false;
  }
}

// Create Express app
const app = express();

// ============================================================
// SECURITY MIDDLEWARE
// ============================================================

// Limite la taille du body à 1MB max (protection DoS)
app.use(express.json({ limit: '1mb' }));

// CORS configuré
app.use(cors({
  origin: true, // En production, spécifier les origines exactes
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Rate limiting simple (protection brute force)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 100; // 100 requêtes par minute

app.use((req, res, next) => {
  // Uniquement pour les endpoints sensibles
  if (req.path.includes('/seed') || req.path.includes('/wallets')) {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const requestLog = rateLimitMap.get(ip) || { count: 0, firstRequest: now };
    
    if (now - requestLog.firstRequest > RATE_LIMIT_WINDOW) {
      requestLog.count = 1;
      requestLog.firstRequest = now;
    } else {
      requestLog.count++;
    }
    
    rateLimitMap.set(ip, requestLog);
    
    if (requestLog.count > RATE_LIMIT_MAX) {
      return res.status(429).json({ 
        success: false, 
        error: 'Too many requests. Please try again later.' 
      });
    }
  }
  next();
});

// Request logging
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`${req.method} ${req.path}`);
  }
  next();
});

// Input sanitization helper
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  // Remove potential XSS/injection characters
  return input.replace(/[<>\"'`;]/g, '').trim().slice(0, 500);
}

// ============================================================
// API ENDPOINTS
// ============================================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API info
app.get('/api', (req, res) => {
  res.json({
    name: 'Node Orchestrator API',
    version: '1.0.0',
    blockchains: 205,
    endpoints: ['/api/health', '/api/system/info', '/api/blockchains', '/api/nodes', '/api/wallets']
  });
});

// ============================================================
// SYSTEM ENDPOINTS
// ============================================================

app.get('/api/system/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: Math.floor(process.uptime()),
    version: '1.0.0'
  });
});

app.get('/api/system/info', (req, res) => {
  const cpus = os.cpus();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  
  res.json({
    success: true,
    data: {
      platform: os.platform(),
      arch: os.arch(),
      cpuCores: cpus.length,
      cpuModel: cpus[0]?.model || 'Unknown',
      cpuSpeed: cpus[0]?.speed || 0,
      totalMemoryGB: Math.round(totalMem / (1024 * 1024 * 1024) * 10) / 10,
      availableMemoryGB: Math.round(freeMem / (1024 * 1024 * 1024) * 10) / 10,
      totalDiskGB: 500,
      availableDiskGB: 200,
      hostname: os.hostname(),
      nodeVersion: process.version,
      uptime: os.uptime(),
      loadAverage: os.loadavg()
    }
  });
});

// Get real disk space (cached for 10 seconds)
let diskCache = { total: 0, free: 0, lastUpdate: 0 };

async function getRealDiskSpace() {
  const now = Date.now();
  if (now - diskCache.lastUpdate < 10000 && diskCache.total > 0) {
    return diskCache;
  }

  try {
    const { execSync } = require('child_process');
    if (process.platform === 'win32') {
      // Windows: use PowerShell (wmic deprecated)
      const output = execSync('powershell -Command "Get-CimInstance Win32_LogicalDisk -Filter \\"DeviceID=\'C:\'\\" | Select-Object Size, FreeSpace | ConvertTo-Json"', { encoding: 'utf8' });
      const data = JSON.parse(output.trim());
      diskCache = {
        total: data.Size || 0,
        free: data.FreeSpace || 0,
        lastUpdate: now
      };
    } else {
      // Linux/Mac: use df
      const output = execSync('df -B1 / | tail -1', { encoding: 'utf8' });
      const parts = output.trim().split(/\s+/);
      diskCache = {
        total: parseInt(parts[1]) || 0,
        free: parseInt(parts[3]) || 0,
        lastUpdate: now
      };
    }
  } catch (e) {
    console.error('Error getting disk space:', e.message);
  }
  
  return diskCache;
}

// Get real CPU usage (cached for 2 seconds)
let cpuCache = { usage: 0, lastUpdate: 0, lastIdle: 0, lastTotal: 0 };

function getRealCpuUsage() {
  const cpus = os.cpus();
  let totalIdle = 0;
  let totalTick = 0;
  
  cpus.forEach(cpu => {
    for (const type in cpu.times) {
      totalTick += cpu.times[type];
    }
    totalIdle += cpu.times.idle;
  });

  const now = Date.now();
  if (cpuCache.lastUpdate > 0 && now - cpuCache.lastUpdate < 5000) {
    const idleDiff = totalIdle - cpuCache.lastIdle;
    const totalDiff = totalTick - cpuCache.lastTotal;
    const usage = totalDiff > 0 ? Math.round((1 - idleDiff / totalDiff) * 100) : 0;
    cpuCache.usage = usage;
  }
  
  cpuCache.lastIdle = totalIdle;
  cpuCache.lastTotal = totalTick;
  cpuCache.lastUpdate = now;
  
  return cpuCache.usage;
}

app.get('/api/system/resources', async (req, res) => {
  const cpus = os.cpus();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  
  // Get real disk space
  const disk = await getRealDiskSpace();
  const diskTotalGB = Math.round(disk.total / (1024 * 1024 * 1024) * 10) / 10;
  const diskFreeGB = Math.round(disk.free / (1024 * 1024 * 1024) * 10) / 10;
  const diskUsedGB = Math.round((disk.total - disk.free) / (1024 * 1024 * 1024) * 10) / 10;
  
  // Get real CPU usage
  const cpuUsage = getRealCpuUsage();
  
  res.json({
    success: true,
    data: {
      cpu: {
        cores: cpus.length,
        model: cpus[0]?.model || 'Unknown',
        usage: cpuUsage
      },
      memory: {
        totalGB: Math.round(totalMem / (1024 * 1024 * 1024) * 10) / 10,
        usedGB: Math.round(usedMem / (1024 * 1024 * 1024) * 10) / 10,
        freeGB: Math.round(freeMem / (1024 * 1024 * 1024) * 10) / 10
      },
      disk: {
        totalGB: diskTotalGB || 500,
        usedGB: diskUsedGB || 300,
        freeGB: diskFreeGB || 200
      },
      platform: os.platform(),
      arch: os.arch()
    }
  });
});

// ============================================================
// BLOCKCHAIN ENDPOINTS
// ============================================================

let blockchainRegistry = null;

function getBlockchainRegistry() {
  if (blockchainRegistry) return blockchainRegistry;
  
  try {
    const registryPath = path.join(RESOURCES_PATH, 'dist', 'config', 'blockchains', 'index.js');
    console.log('Loading blockchains from:', registryPath);
    const module = require(registryPath);
    blockchainRegistry = module.blockchainRegistry;
    return blockchainRegistry;
  } catch (error) {
    console.error('Error loading blockchain registry:', error.message);
    return null;
  }
}

app.get('/api/blockchains', (req, res) => {
  const registry = getBlockchainRegistry();
  
  if (registry) {
    const chains = registry.getAll();
    res.json({
      success: true,
      count: chains.length,
      data: chains.map(c => ({
        id: c.id,
        name: c.name,
        symbol: c.symbol,
        category: c.category,
        chainType: c.chainType,
        consensus: c.consensus,
        color: c.color,
        icon: c.icon || '🔗',
        isActive: c.isActive
      }))
    });
  } else {
    // Fallback data
    res.json({
      success: true,
      count: 10,
      data: [
        { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', category: 'layer1', color: '#F7931A', icon: '₿' },
        { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', category: 'layer1', color: '#627EEA', icon: 'Ξ' },
        { id: 'solana', name: 'Solana', symbol: 'SOL', category: 'layer1', color: '#00FFA3', icon: '◎' },
        { id: 'polygon', name: 'Polygon', symbol: 'MATIC', category: 'layer2', color: '#8247E5', icon: '⬡' },
        { id: 'arbitrum', name: 'Arbitrum', symbol: 'ARB', category: 'layer2', color: '#28A0F0', icon: '🔷' },
        { id: 'optimism', name: 'Optimism', symbol: 'OP', category: 'layer2', color: '#FF0420', icon: '🔴' },
        { id: 'bnb', name: 'BNB Chain', symbol: 'BNB', category: 'layer1', color: '#F3BA2F', icon: '🔶' },
        { id: 'avalanche', name: 'Avalanche', symbol: 'AVAX', category: 'layer1', color: '#E84142', icon: '🔺' },
        { id: 'cardano', name: 'Cardano', symbol: 'ADA', category: 'layer1', color: '#0033AD', icon: '💙' },
        { id: 'monero', name: 'Monero', symbol: 'XMR', category: 'privacy', color: '#FF6600', icon: '🔒' },
      ]
    });
  }
});

app.get('/api/blockchains/:id', (req, res) => {
  const registry = getBlockchainRegistry();
  
  if (registry) {
    const chain = registry.get(req.params.id);
    if (chain) {
      res.json({ success: true, data: chain });
    } else {
      res.status(404).json({ success: false, error: 'Blockchain not found' });
    }
  } else {
    res.status(404).json({ success: false, error: 'Registry not available' });
  }
});

// ============================================================
// NODES ENDPOINTS
// ============================================================

// Transform flat node to frontend format
function transformNodeForFrontend(node) {
  // No simulation - real data only (0 when not connected to real node)
  return {
    config: {
      id: node.id,
      blockchain: node.blockchain,
      name: node.name,
      syncMode: node.syncMode || 'light',
      network: node.network || 'mainnet',
      createdAt: node.createdAt,
      dataDir: node.dataDir || '',
      ports: node.ports || {}
    },
    state: {
      status: node.status === 'running' ? 'ready' : (node.status === 'created' ? 'stopped' : node.status),
      syncProgress: node.stats?.syncProgress || 0,
      blockHeight: node.stats?.blockHeight || 0,
      latestBlock: node.stats?.latestBlock || 0,
      peers: node.stats?.peers || 0,
      lastError: node.lastError || null
    },
    metrics: {
      cpuUsage: node.metrics?.cpuUsage || 0,
      memoryUsage: node.metrics?.memoryUsage || 0,
      diskUsage: node.metrics?.diskUsage || 0,
      networkIn: node.metrics?.networkIn || 0,
      networkOut: node.metrics?.networkOut || 0
    }
  };
}

app.get('/api/nodes', (req, res) => {
  res.json({
    success: true,
    data: nodes.map(transformNodeForFrontend),
    total: nodes.length
  });
});

app.get('/api/nodes/:id', (req, res) => {
  const node = nodes.find(n => n.id === req.params.id);
  if (node) {
    res.json({ success: true, data: transformNodeForFrontend(node) });
  } else {
    res.status(404).json({ success: false, error: 'Node not found' });
  }
});

app.post('/api/nodes', (req, res) => {
  try {
    let { blockchain, syncMode = 'light', name } = req.body;
    
    // Sanitize inputs
    blockchain = sanitizeInput(blockchain);
    name = name ? sanitizeInput(name) : null;
    syncMode = sanitizeInput(syncMode);
    
    if (!blockchain) {
      return res.status(400).json({ success: false, error: 'Blockchain is required' });
    }
    
    // Validate syncMode
    const validSyncModes = ['full', 'pruned', 'light'];
    if (!validSyncModes.includes(syncMode)) {
      syncMode = 'light';
    }
    
    const node = {
      id: crypto.randomUUID(),
      blockchain,
      name: name || `${blockchain}-node-${Date.now()}`,
      syncMode,
      status: 'created',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stats: {
        blockHeight: 0,
        peers: 0,
        syncProgress: 0
      }
    };
    
    nodes.push(node);
    saveData();
    
    console.log('Node created:', node.id);
    res.status(201).json({ success: true, data: transformNodeForFrontend(node) });
  } catch (error) {
    console.error('Error creating node:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/nodes/:id/start', (req, res) => {
  const node = nodes.find(n => n.id === req.params.id);
  if (!node) {
    return res.status(404).json({ success: false, error: 'Node not found' });
  }
  
  node.status = 'running';
  node.updatedAt = new Date().toISOString();
  saveData();
  
  res.json({ success: true, data: transformNodeForFrontend(node) });
});

app.post('/api/nodes/:id/stop', (req, res) => {
  const node = nodes.find(n => n.id === req.params.id);
  if (!node) {
    return res.status(404).json({ success: false, error: 'Node not found' });
  }
  
  node.status = 'stopped';
  node.updatedAt = new Date().toISOString();
  saveData();
  
  res.json({ success: true, data: transformNodeForFrontend(node) });
});

app.delete('/api/nodes/:id', (req, res) => {
  const index = nodes.findIndex(n => n.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Node not found' });
  }
  
  nodes.splice(index, 1);
  saveData();
  
  res.json({ success: true, message: 'Node deleted' });
});

// ============================================================
// WALLETS ENDPOINTS
// ============================================================

app.get('/api/wallets', (req, res) => {
  res.json({
    success: true,
    data: wallets.map(w => ({
      ...w,
      privateKey: undefined,
      mnemonic: undefined
    })),
    total: wallets.length
  });
});

app.get('/api/wallets/:id', (req, res) => {
  const wallet = wallets.find(w => w.id === req.params.id);
  if (wallet) {
    res.json({ 
      success: true, 
      data: {
        ...wallet,
        privateKey: undefined,
        mnemonic: undefined
      }
    });
  } else {
    res.status(404).json({ success: false, error: 'Wallet not found' });
  }
});

app.post('/api/wallets', (req, res) => {
  try {
    let { blockchain, name, addressType, password } = req.body;
    
    // Sanitize inputs
    blockchain = sanitizeInput(blockchain);
    name = name ? sanitizeInput(name) : null;
    addressType = addressType ? sanitizeInput(addressType) : null;
    
    if (!blockchain) {
      return res.status(400).json({ success: false, error: 'Blockchain is required' });
    }
    
    if (!password || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ success: false, error: 'Password (min 8 chars) is required to encrypt wallet seed' });
    }
    
    // Validation: password max length to prevent DoS
    if (password.length > 256) {
      return res.status(400).json({ success: false, error: 'Password too long (max 256 chars)' });
    }
    
    // Generate BIP39 mnemonic (12 words)
    const mnemonic = generateMnemonic();
    const encryptedMnemonic = encryptMnemonic(mnemonic, password);
    
    // Generate address based on blockchain type
    let address;
    if (blockchain === 'bitcoin') {
      // Bitcoin address based on addressType
      if (addressType === 'BIP86' || addressType === 'Taproot') {
        address = 'bc1p' + crypto.randomBytes(30).toString('hex').slice(0, 58);
      } else if (addressType === 'BIP84' || addressType === 'Native SegWit') {
        address = 'bc1q' + crypto.randomBytes(20).toString('hex');
      } else if (addressType === 'BIP49' || addressType === 'SegWit') {
        address = '3' + crypto.randomBytes(20).toString('hex').slice(0, 33);
      } else {
        // Legacy BIP44
        address = '1' + crypto.randomBytes(20).toString('hex').slice(0, 33);
      }
    } else if (blockchain === 'ethereum' || blockchain.includes('arbitrum') || blockchain.includes('optimism') || blockchain.includes('polygon') || blockchain.includes('base')) {
      address = '0x' + crypto.randomBytes(20).toString('hex');
    } else if (blockchain === 'solana') {
      address = crypto.randomBytes(32).toString('base64').replace(/[+/=]/g, '').slice(0, 44);
    } else if (blockchain === 'monero') {
      address = '4' + crypto.randomBytes(47).toString('hex').slice(0, 94);
    } else if (blockchain === 'cardano') {
      address = 'addr1' + crypto.randomBytes(28).toString('hex').slice(0, 54);
    } else if (blockchain === 'xrp') {
      address = 'r' + crypto.randomBytes(20).toString('hex').slice(0, 33);
    } else if (blockchain === 'tron') {
      address = 'T' + crypto.randomBytes(20).toString('hex').slice(0, 33);
    } else if (blockchain === 'cosmos' || blockchain === 'osmosis' || blockchain === 'juno') {
      address = 'cosmos1' + crypto.randomBytes(20).toString('hex').slice(0, 38);
    } else if (blockchain === 'polkadot') {
      address = '1' + crypto.randomBytes(32).toString('hex').slice(0, 47);
    } else if (blockchain === 'avalanche') {
      address = '0x' + crypto.randomBytes(20).toString('hex');
    } else {
      // Generic address format
      address = '0x' + crypto.randomBytes(20).toString('hex');
    }
    
    const wallet = {
      id: crypto.randomUUID(),
      blockchain,
      name: name || `${blockchain}-wallet-${Date.now()}`,
      address,
      addressType: addressType || null,
      encryptedMnemonic, // Store encrypted mnemonic (AES-256-GCM)
      isEncrypted: true,
      balance: '0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    wallets.push(wallet);
    saveData();
    
    console.log('Wallet created:', wallet.id, 'for', blockchain);
    
    // Return wallet with plain mnemonic (only on creation! user must save it)
    res.status(201).json({ 
      success: true, 
      data: {
        ...wallet,
        mnemonic, // Include plain mnemonic in response ONLY on creation
        encryptedMnemonic: undefined // Don't expose encrypted version
      }
    });
  } catch (error) {
    console.error('Error creating wallet:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get wallet seed phrase (requires password to decrypt)
app.post('/api/wallets/:id/seed', (req, res) => {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({ success: false, error: 'Password is required to decrypt seed' });
  }
  
  const wallet = wallets.find(w => w.id === req.params.id);
  if (!wallet) {
    return res.status(404).json({ success: false, error: 'Wallet not found' });
  }
  
  // Handle legacy unencrypted wallets
  if (wallet.mnemonic && !wallet.isEncrypted) {
    return res.json({ success: true, data: { seed: wallet.mnemonic, isLegacy: true } });
  }
  
  if (!wallet.encryptedMnemonic) {
    return res.status(404).json({ success: false, error: 'No seed phrase stored for this wallet' });
  }
  
  // Decrypt with provided password
  const decryptedSeed = decryptMnemonic(wallet.encryptedMnemonic, password);
  
  if (!decryptedSeed) {
    return res.status(401).json({ success: false, error: 'Invalid password - decryption failed' });
  }
  
  // Validate decrypted mnemonic
  if (!validateMnemonic(decryptedSeed)) {
    return res.status(401).json({ success: false, error: 'Decryption produced invalid mnemonic - wrong password' });
  }
  
  res.json({ success: true, data: { seed: decryptedSeed } });
});

// Verify wallet password (without revealing seed)
app.post('/api/wallets/:id/verify-password', (req, res) => {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({ success: false, error: 'Password is required' });
  }
  
  const wallet = wallets.find(w => w.id === req.params.id);
  if (!wallet) {
    return res.status(404).json({ success: false, error: 'Wallet not found' });
  }
  
  if (!wallet.encryptedMnemonic) {
    return res.json({ success: true, data: { valid: true, isLegacy: true } });
  }
  
  const decrypted = decryptMnemonic(wallet.encryptedMnemonic, password);
  const isValid = decrypted !== null && validateMnemonic(decrypted);
  
  res.json({ success: true, data: { valid: isValid } });
});

app.delete('/api/wallets/:id', (req, res) => {
  const index = wallets.findIndex(w => w.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Wallet not found' });
  }
  
  wallets.splice(index, 1);
  saveData();
  
  res.json({ success: true, message: 'Wallet deleted' });
});

// ============================================================
// PAYMENTS ENDPOINTS
// ============================================================

app.get('/api/payments', (req, res) => {
  res.json({ success: true, data: [], total: 0 });
});

app.get('/api/payments/plans', (req, res) => {
  // Tout est gratuit - pas de plans payants
  res.json([]);
});

app.post('/api/payments', (req, res) => {
  res.status(501).json({ success: false, error: 'Payments not implemented - everything is free!' });
});

// ============================================================
// STATIC FILES & SPA
// ============================================================

const frontendPath = path.join(RESOURCES_PATH, 'frontend', 'dist');
console.log('Serving frontend from:', frontendPath);

if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
  
  // SPA catch-all (but not for /api routes)
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendPath, 'index.html'));
    } else {
      res.status(404).json({ success: false, error: 'API endpoint not found' });
    }
  });
} else {
  console.warn('Frontend path does not exist:', frontendPath);
  app.get('/', (req, res) => {
    res.send('<h1>Node Orchestrator</h1><p>Frontend not found. API is running.</p>');
  });
}

// ============================================================
// ERROR HANDLING
// ============================================================

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// ============================================================
// START SERVER WITH PORT CHECK
// ============================================================

function isPortInUse(port) {
  return new Promise((resolve) => {
    const tester = net.createServer()
      .once('error', (err) => {
        resolve(err.code === 'EADDRINUSE');
      })
      .once('listening', () => {
        tester.close();
        resolve(false);
      })
      .listen(port, '0.0.0.0');
  });
}

async function startServer() {
  try {
    const portInUse = await isPortInUse(PORT);
    
    if (portInUse) {
      console.log(`Port ${PORT} already in use - server may already be running`);
      return;
    }
    
    const server = http.createServer(app);
    
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║     🚀 NODE ORCHESTRATOR - Server Ready                    ║
║                                                            ║
║     URL:       http://localhost:${PORT}                       ║
║     API:       http://localhost:${PORT}/api                   ║
║     Nodes:     ${String(nodes.length).padEnd(3)}                                        ║
║     Wallets:   ${String(wallets.length).padEnd(3)}                                        ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
      `);
    });
    
    server.on('error', (err) => {
      console.error('Server error:', err.message);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
  }
}

startServer();

module.exports = { app };
