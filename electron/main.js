/**
 * ============================================================
 * ELECTRON MAIN PROCESS
 * Application Desktop Node Orchestrator
 * ============================================================
 */

const { app, BrowserWindow, ipcMain, dialog, Menu, Tray, shell } = require('electron');
const path = require('path');
const { spawn, fork } = require('child_process');
const fs = require('fs');
const http = require('http');

// ============================================================
// CONFIGURATION
// ============================================================

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const BACKEND_PORT = 3001;
const FRONTEND_PORT = isDev ? 5173 : 3001;

let mainWindow = null;
let splashWindow = null;
let tray = null;
let backendProcess = null;
let isQuitting = false;

// ============================================================
// PATHS
// ============================================================

function getResourcePath(relativePath) {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, relativePath);
  }
  return path.join(__dirname, '..', relativePath);
}

function getDataPath() {
  return path.join(app.getPath('userData'), 'data');
}

// ============================================================
// SPLASH SCREEN
// ============================================================

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
  splashWindow.center();
}

// ============================================================
// MAIN WINDOW
// ============================================================

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    show: false,
    icon: path.join(__dirname, 'icons', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0a0a0f',
  });

  // Load frontend
  if (isDev) {
    mainWindow.loadURL(`http://localhost:${FRONTEND_PORT}`);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL(`http://localhost:${BACKEND_PORT}`);
  }

  mainWindow.once('ready-to-show', () => {
    if (splashWindow) {
      splashWindow.destroy();
      splashWindow = null;
    }
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      
      // Show notification
      if (process.platform === 'darwin') {
        app.dock.hide();
      }
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Security: Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// ============================================================
// SYSTEM TRAY
// ============================================================

function createTray() {
  const iconPath = path.join(__dirname, 'icons', 'tray-icon.png');
  
  // Create default icon if not exists
  if (!fs.existsSync(iconPath)) {
    tray = new Tray(path.join(__dirname, 'icons', 'icon.png'));
  } else {
    tray = new Tray(iconPath);
  }

  const contextMenu = Menu.buildFromTemplate([
    { 
      label: '🚀 Node Orchestrator', 
      enabled: false 
    },
    { type: 'separator' },
    { 
      label: 'Ouvrir', 
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          if (process.platform === 'darwin') {
            app.dock.show();
          }
        }
      }
    },
    { 
      label: 'Dashboard', 
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.webContents.send('navigate', '/dashboard');
        }
      }
    },
    { type: 'separator' },
    { 
      label: 'Status: En cours...', 
      id: 'status',
      enabled: false 
    },
    { type: 'separator' },
    { 
      label: 'Quitter', 
      click: () => {
        isQuitting = true;
        app.quit();
      }
    },
  ]);

  tray.setToolTip('Node Orchestrator - Multi-Blockchain');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.focus();
      } else {
        mainWindow.show();
        if (process.platform === 'darwin') {
          app.dock.show();
        }
      }
    }
  });
}

// ============================================================
// BACKEND SERVER
// ============================================================

function startBackend() {
  return new Promise((resolve, reject) => {
    const serverPath = getResourcePath('dist/server.js');
    
    // Set environment variables
    const env = {
      ...process.env,
      NODE_ENV: 'production',
      PORT: BACKEND_PORT.toString(),
      DATA_PATH: getDataPath(),
    };

    // Ensure data directory exists
    if (!fs.existsSync(getDataPath())) {
      fs.mkdirSync(getDataPath(), { recursive: true });
    }

    console.log('Starting backend server:', serverPath);

    backendProcess = fork(serverPath, [], {
      env,
      stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
    });

    backendProcess.stdout.on('data', (data) => {
      console.log('[Backend]', data.toString());
    });

    backendProcess.stderr.on('data', (data) => {
      console.error('[Backend Error]', data.toString());
    });

    backendProcess.on('error', (error) => {
      console.error('Backend error:', error);
      reject(error);
    });

    backendProcess.on('exit', (code) => {
      console.log('Backend exited with code:', code);
      if (!isQuitting && code !== 0) {
        // Restart backend on crash
        setTimeout(() => startBackend(), 3000);
      }
    });

    // Wait for backend to be ready
    const checkServer = () => {
      http.get(`http://localhost:${BACKEND_PORT}/api/health`, (res) => {
        if (res.statusCode === 200) {
          console.log('Backend is ready!');
          resolve();
        } else {
          setTimeout(checkServer, 500);
        }
      }).on('error', () => {
        setTimeout(checkServer, 500);
      });
    };

    // Start checking after short delay
    setTimeout(checkServer, 1000);

    // Timeout after 30 seconds
    setTimeout(() => {
      reject(new Error('Backend startup timeout'));
    }, 30000);
  });
}

function stopBackend() {
  if (backendProcess) {
    backendProcess.kill('SIGTERM');
    backendProcess = null;
  }
}

// ============================================================
// APPLICATION MENU
// ============================================================

function createMenu() {
  const isMac = process.platform === 'darwin';

  const template = [
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    }] : []),
    {
      label: 'Fichier',
      submenu: [
        {
          label: 'Nouveau Wallet',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow?.webContents.send('action', 'new-wallet');
          },
        },
        {
          label: 'Importer Wallet',
          accelerator: 'CmdOrCtrl+I',
          click: () => {
            mainWindow?.webContents.send('action', 'import-wallet');
          },
        },
        { type: 'separator' },
        {
          label: 'Exporter Backup',
          click: async () => {
            const { filePath } = await dialog.showSaveDialog({
              defaultPath: `node-orchestrator-backup-${Date.now()}.json`,
              filters: [{ name: 'JSON', extensions: ['json'] }],
            });
            if (filePath) {
              mainWindow?.webContents.send('action', 'export-backup', filePath);
            }
          },
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' },
      ],
    },
    {
      label: 'Édition',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
      ],
    },
    {
      label: 'Affichage',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Nodes',
      submenu: [
        {
          label: 'Démarrer tous les nodes',
          click: () => {
            mainWindow?.webContents.send('action', 'start-all-nodes');
          },
        },
        {
          label: 'Arrêter tous les nodes',
          click: () => {
            mainWindow?.webContents.send('action', 'stop-all-nodes');
          },
        },
        { type: 'separator' },
        {
          label: 'Rafraîchir Status',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow?.webContents.send('action', 'refresh-status');
          },
        },
      ],
    },
    {
      label: 'Aide',
      submenu: [
        {
          label: 'Documentation',
          click: () => {
            shell.openExternal('https://github.com/greenbynox/universal-orchestrator-node');
          },
        },
        {
          label: 'Signaler un bug',
          click: () => {
            shell.openExternal('https://github.com/greenbynox/universal-orchestrator-node/issues');
          },
        },
        { type: 'separator' },
        {
          label: 'À propos',
          click: () => {
            dialog.showMessageBox({
              type: 'info',
              title: 'Node Orchestrator',
              message: 'Node Orchestrator v1.0.0',
              detail: 'Orchestrateur Multi-Blockchain\n173+ blockchains supportées\n\n© 2024 Node Orchestrator Team',
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// ============================================================
// IPC HANDLERS
// ============================================================

ipcMain.handle('get-version', () => app.getVersion());
ipcMain.handle('get-platform', () => process.platform);
ipcMain.handle('get-data-path', () => getDataPath());

ipcMain.handle('show-open-dialog', async (event, options) => {
  return dialog.showOpenDialog(mainWindow, options);
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  return dialog.showSaveDialog(mainWindow, options);
});

ipcMain.handle('show-message-box', async (event, options) => {
  return dialog.showMessageBox(mainWindow, options);
});

// ============================================================
// APP LIFECYCLE
// ============================================================

app.whenReady().then(async () => {
  // Show splash screen
  createSplashWindow();

  try {
    // Start backend server
    await startBackend();

    // Create main window
    createMainWindow();
    createTray();
    createMenu();
  } catch (error) {
    console.error('Failed to start application:', error);
    dialog.showErrorBox('Erreur de démarrage', `Impossible de démarrer l'application:\n${error.message}`);
    app.quit();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    } else if (mainWindow) {
      mainWindow.show();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
  stopBackend();
});

app.on('will-quit', () => {
  stopBackend();
});

// ============================================================
// SECURITY
// ============================================================

// Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});

// Handle certificate errors in production
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (isDev) {
    event.preventDefault();
    callback(true);
  } else {
    callback(false);
  }
});
