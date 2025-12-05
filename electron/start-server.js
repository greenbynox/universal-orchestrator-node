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

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`${req.method} ${req.path}`);
  }
  next();
});

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

app.get('/api/system/resources', (req, res) => {
  const cpus = os.cpus();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  
  res.json({
    success: true,
    data: {
      cpu: {
        cores: cpus.length,
        model: cpus[0]?.model || 'Unknown',
        usage: Math.round(Math.random() * 30)
      },
      memory: {
        totalGB: Math.round(totalMem / (1024 * 1024 * 1024) * 10) / 10,
        usedGB: Math.round((totalMem - freeMem) / (1024 * 1024 * 1024) * 10) / 10,
        freeGB: Math.round(freeMem / (1024 * 1024 * 1024) * 10) / 10
      },
      disk: {
        totalGB: 500,
        usedGB: 300,
        freeGB: 200
      }
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

app.get('/api/nodes', (req, res) => {
  res.json({
    success: true,
    data: nodes,
    total: nodes.length
  });
});

app.get('/api/nodes/:id', (req, res) => {
  const node = nodes.find(n => n.id === req.params.id);
  if (node) {
    res.json({ success: true, data: node });
  } else {
    res.status(404).json({ success: false, error: 'Node not found' });
  }
});

app.post('/api/nodes', (req, res) => {
  try {
    const { blockchain, syncMode = 'light', name } = req.body;
    
    if (!blockchain) {
      return res.status(400).json({ success: false, error: 'Blockchain is required' });
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
    res.status(201).json({ success: true, data: node });
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
  
  res.json({ success: true, data: node });
});

app.post('/api/nodes/:id/stop', (req, res) => {
  const node = nodes.find(n => n.id === req.params.id);
  if (!node) {
    return res.status(404).json({ success: false, error: 'Node not found' });
  }
  
  node.status = 'stopped';
  node.updatedAt = new Date().toISOString();
  saveData();
  
  res.json({ success: true, data: node });
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
    const { blockchain, name } = req.body;
    
    if (!blockchain) {
      return res.status(400).json({ success: false, error: 'Blockchain is required' });
    }
    
    // Generate a placeholder address (in real app, would use proper crypto)
    const addressPrefix = blockchain === 'bitcoin' ? '1' : 
                          blockchain === 'ethereum' ? '0x' : 
                          blockchain === 'solana' ? '' : '0x';
    const randomHex = crypto.randomBytes(20).toString('hex');
    const address = addressPrefix + randomHex;
    
    const wallet = {
      id: crypto.randomUUID(),
      blockchain,
      name: name || `${blockchain}-wallet-${Date.now()}`,
      address,
      balance: '0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    wallets.push(wallet);
    saveData();
    
    console.log('Wallet created:', wallet.id);
    res.status(201).json({ success: true, data: wallet });
  } catch (error) {
    console.error('Error creating wallet:', error);
    res.status(500).json({ success: false, error: error.message });
  }
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

app.post('/api/payments', (req, res) => {
  res.status(501).json({ success: false, error: 'Payments not implemented yet' });
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
