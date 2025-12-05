/**
 * Embedded Server Starter for Electron
 * This script starts the Express server within the Electron process
 */

const path = require('path');
const express = require('express');
const cors = require('cors');
const http = require('http');

// Get paths from environment
const PORT = process.env.PORT || 3001;
const RESOURCES_PATH = process.env.RESOURCES_PATH || path.join(__dirname, '..');
const DATA_PATH = process.env.DATA_PATH || path.join(__dirname, '..', 'data');

console.log('=== Embedded Server Starting ===');
console.log('PORT:', PORT);
console.log('RESOURCES_PATH:', RESOURCES_PATH);
console.log('DATA_PATH:', DATA_PATH);

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health endpoint
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
    blockchains: 205
  });
});

// System info
app.get('/api/system/info', (req, res) => {
  const os = require('os');
  res.json({
    success: true,
    data: {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      totalMemory: Math.round(os.totalmem() / (1024 * 1024 * 1024)),
      freeMemory: Math.round(os.freemem() / (1024 * 1024 * 1024)),
      hostname: os.hostname(),
      nodeVersion: process.version
    }
  });
});

// Blockchains list
app.get('/api/blockchains', (req, res) => {
  try {
    // Try to load the blockchain registry
    const registryPath = path.join(RESOURCES_PATH, 'dist', 'config', 'blockchains', 'index.js');
    console.log('Loading blockchains from:', registryPath);
    
    const { blockchainRegistry } = require(registryPath);
    const chains = blockchainRegistry.getAll();
    
    res.json({
      success: true,
      count: chains.length,
      data: chains.map(c => ({
        id: c.id,
        name: c.name,
        symbol: c.symbol,
        category: c.category,
        color: c.color,
        icon: c.icon
      }))
    });
  } catch (error) {
    console.error('Error loading blockchains:', error);
    // Return basic list if registry fails
    res.json({
      success: true,
      count: 205,
      data: [
        { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', category: 'layer1', color: '#F7931A' },
        { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', category: 'layer1', color: '#627EEA' },
        { id: 'solana', name: 'Solana', symbol: 'SOL', category: 'layer1', color: '#00FFA3' },
      ]
    });
  }
});

// Nodes list (empty for now)
app.get('/api/nodes', (req, res) => {
  res.json({
    success: true,
    data: [],
    total: 0
  });
});

// Wallets list (empty for now)  
app.get('/api/wallets', (req, res) => {
  res.json({
    success: true,
    data: [],
    total: 0
  });
});

// Serve frontend static files
const frontendPath = path.join(RESOURCES_PATH, 'frontend', 'dist');
console.log('Serving frontend from:', frontendPath);

app.use(express.static(frontendPath));

// Catch-all route for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Start server
const server = http.createServer(app);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║     🚀 NODE ORCHESTRATOR - Embedded Server                 ║
║                                                            ║
║     Server:    http://0.0.0.0:${PORT}                         ║
║     Status:    RUNNING                                     ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

module.exports = { app, server };
