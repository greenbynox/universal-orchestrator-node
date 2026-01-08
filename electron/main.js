/**
 * ============================================================
 * ELECTRON MAIN PROCESS
 * Application Desktop Node Orchestrator
 * ============================================================
 */

const { app, BrowserWindow, ipcMain, dialog, Menu, Tray, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');

// ============================================================
// CONFIGURATION
// ============================================================

const isDev = process.env.NODE_ENV === 'development';
const isDevMode = isDev && !app.isPackaged;
const BACKEND_PORT = 3001;
const FRONTEND_PORT = isDev ? 5173 : 3001;
const DOCKER_AUTO_START = process.env.DOCKER_AUTO_START !== 'false';
const DOCKER_MAX_RETRIES = Number(process.env.DOCKER_MAX_RETRIES || 30);
const DOCKER_RETRY_DELAY_MS = Number(process.env.DOCKER_RETRY_DELAY_MS || 4000);
// Windows strategy:
// - Prefer WSL2 Docker Engine when WSL is available.
// - Only fall back to Docker Desktop if explicitly allowed.
const DOCKER_PREFER_WSL2 = process.env.DOCKER_PREFER_WSL2 !== 'false';
const DOCKER_ALLOW_DESKTOP_FALLBACK = process.env.DOCKER_ALLOW_DESKTOP_FALLBACK !== 'false';

let mainWindow = null;
let splashWindow = null;
let tray = null;
let expressServer = null;
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
// SPLASH SCREEN WITH PROGRESS
// ============================================================

function sendSplashUpdate(data) {
  if (splashWindow && !splashWindow.isDestroyed()) {
    try {
      splashWindow.webContents.send('splash-update', data);
      console.log('[Splash] Sent update:', data.log?.id || 'status', data.progress + '%');
    } catch (err) {
      console.error('[Splash] Failed to send update:', err);
    }
  }
}

function updateSplashProgress(id, text, status, progress) {
  sendSplashUpdate({
    status: text,
    progress: progress,
    log: { id, text, status }
  });
}

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 420,
    height: 450,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
  splashWindow.center();
  
  // Send initial update when ready
  splashWindow.webContents.on('did-finish-load', () => {
    console.log('[Splash] Window loaded, sending initial update...');
    updateSplashProgress('init', 'Démarrage de l\'application...', 'pending', 5);
  });
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
    show: false,  // Don't show until splash is done
    center: true, // Center on screen
    icon: path.join(__dirname, 'icons', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    // Only use hiddenInset on macOS
    ...(process.platform === 'darwin' ? { titleBarStyle: 'hiddenInset' } : {}),
    backgroundColor: '#0a0a0f',
  });

  console.log('Main window created...');

  // Load frontend
  if (isDevMode) {
    console.log('Loading dev URL:', `http://localhost:${FRONTEND_PORT}`);
    mainWindow.loadURL(`http://localhost:${FRONTEND_PORT}`);
    mainWindow.webContents.openDevTools();
  } else {
    console.log('Loading production URL:', `http://localhost:${BACKEND_PORT}`);
    mainWindow.loadURL(`http://localhost:${BACKEND_PORT}`);
  }

  // Handle load errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
    mainWindow.loadFile(path.join(__dirname, 'error.html'));
  });
  
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page loaded successfully');
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
  try {
    const iconPath = path.join(__dirname, 'icons', 'icon.png');
    
    if (!fs.existsSync(iconPath)) {
      console.warn('Tray icon not found, skipping tray creation');
      return;
    }
    
    tray = new Tray(iconPath);

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
  } catch (error) {
    console.error('Failed to create tray:', error);
  }
}

// ============================================================
// DOCKER - Auto-launch
// ============================================================

/**
 * Ensure Docker is running.
 * Windows:
 * - Prefer Docker already available.
 * - If not, try Docker Engine in WSL2 (no Docker Desktop required).
 * - Fallback: try launching Docker Desktop if present.
 */
function ensureDockerIsRunning() {
  return new Promise((resolve) => {
    const { spawn } = require('child_process');
    const os = require('os');

    const hasWslExe = () => {
      if (process.platform !== 'win32') return false;
      const sysRoot = process.env.SystemRoot || 'C:\\Windows';
      const wslPath = path.join(sysRoot, 'System32', 'wsl.exe');
      return fs.existsSync(wslPath);
    };

    console.log('[Docker] Checking if Docker is running...');
    updateSplashProgress('docker', 'Vérification de Docker...', 'pending', 5);

    if (!DOCKER_AUTO_START) {
      console.warn('[Docker] DOCKER_AUTO_START=false, skipping auto-launch');
      updateSplashProgress('docker', 'Docker non démarré automatiquement (config)', 'warning', 8);
      resolve();
      return;
    }

    const testDockerCli = (cb) => {
      try {
        const child = spawn('docker', ['info'], { stdio: 'ignore', windowsHide: true });
        let done = false;

        const finish = (ok) => {
          if (done) return;
          done = true;
          try { child.kill(); } catch { /* ignore */ }
          cb(ok);
        };

        const timer = setTimeout(() => finish(false), 2500);

        child.on('exit', (code) => {
          clearTimeout(timer);
          finish(code === 0);
        });
        child.on('error', () => {
          clearTimeout(timer);
          finish(false);
        });
      } catch {
        cb(false);
      }
    };

    const testDockerWsl = (cb) => {
      if (process.platform !== 'win32') return cb(false);
      try {
        const child = spawn('wsl.exe', ['-e', 'sh', '-lc', 'docker info >/dev/null 2>&1'], { stdio: 'ignore', windowsHide: true });
        let done = false;

        const finish = (ok) => {
          if (done) return;
          done = true;
          try { child.kill(); } catch { /* ignore */ }
          cb(ok);
        };

        // WSL boot + systemd + docker may take a few seconds.
        const timer = setTimeout(() => finish(false), 12000);
        child.on('exit', (code) => {
          clearTimeout(timer);
          finish(code === 0);
        });
        child.on('error', () => {
          clearTimeout(timer);
          finish(false);
        });
      } catch {
        cb(false);
      }
    };

    const warmupWsl = (cb) => {
      if (process.platform !== 'win32') return cb();
      try {
        const child = spawn('wsl.exe', ['-e', 'sh', '-lc', 'true'], { stdio: 'ignore', windowsHide: true });
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          try { child.kill(); } catch { /* ignore */ }
          cb();
        };
        const timer = setTimeout(() => finish(), 8000);
        child.on('exit', () => {
          clearTimeout(timer);
          finish();
        });
        child.on('error', () => {
          clearTimeout(timer);
          finish();
        });
      } catch {
        cb();
      }
    };

    const testDockerReady = (attempts) => {
      if (attempts >= DOCKER_MAX_RETRIES) {
        console.warn('[Docker] Docker did not become ready in time, continuing anyway');
        updateSplashProgress('docker', 'Docker non disponible, continuation...', 'warning', 8);
        resolve();
        return;
      }

      // Prefer checking native Docker CLI first, then WSL2 docker.
      testDockerCli((ok) => {
        if (ok) {
          console.log('[Docker] Docker is now ready!');
          updateSplashProgress('docker', 'Docker est opérationnel', 'success', 8);
          resolve();
          return;
        }

        testDockerWsl((wslOk) => {
          if (wslOk) {
            console.log('[Docker] Docker Engine in WSL2 is now ready!');
            updateSplashProgress('docker', 'Docker (WSL2) est opérationnel', 'success', 8);
            resolve();
            return;
          }

          setTimeout(() => testDockerReady(attempts + 1), DOCKER_RETRY_DELAY_MS);
        });
      });
    };

    // Test if Docker is accessible
    const testDocker = () => {
      testDockerCli((ok) => {
        if (ok) {
          console.log('[Docker] Docker is already running');
          updateSplashProgress('docker', 'Docker est opérationnel', 'success', 8);
          resolve();
          return;
        }

        // Windows: prefer WSL2 Docker Engine when available.
        if (process.platform === 'win32' && DOCKER_PREFER_WSL2 && hasWslExe()) {
          updateSplashProgress('docker', 'Démarrage de Docker (WSL2)...', 'pending', 7);
          warmupWsl(() => {
            // Give WSL2 a chance to boot/systemd-start docker in background.
            testDockerReady(0);
          });
          return;
        }

        // Fallback path: try WSL quick check, then Docker Desktop.
        testDockerWsl((wslOk) => {
          if (wslOk) {
            console.log('[Docker] Docker Engine in WSL2 is running');
            updateSplashProgress('docker', 'Docker (WSL2) est opérationnel', 'success', 8);
            resolve();
            return;
          }
          launchDocker();
        });
      });
    };

    const launchDocker = () => {
      if (process.platform === 'win32' && !DOCKER_ALLOW_DESKTOP_FALLBACK) {
        console.warn('[Docker] Docker Desktop fallback disabled; continuing without auto-launch');
        updateSplashProgress('docker', 'Docker Desktop désactivé (fallback) — continuation...', 'warning', 8);
        resolve();
        return;
      }

      console.log('[Docker] Attempting to launch Docker Desktop...');
      updateSplashProgress('docker', 'Lancement de Docker Desktop...', 'pending', 6);

      if (process.platform === 'win32') {
        // Windows
        try {
          const dockerPaths = [
            'C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe',
            process.env.ProgramFiles + '\\Docker\\Docker\\Docker Desktop.exe',
            process.env['ProgramFiles(x86)'] + '\\Docker\\Docker\\Docker Desktop.exe',
          ];

          let found = false;
          for (const dockerPath of dockerPaths) {
            if (fs.existsSync(dockerPath)) {
              console.log('[Docker] Found Docker at:', dockerPath);
              spawn(dockerPath, [], { detached: true, stdio: 'ignore' });
              found = true;
              break;
            }
          }

          if (found) {
            console.log('[Docker] Waiting for Docker to start (15 seconds)...');
            updateSplashProgress('docker', 'Attente du démarrage de Docker...', 'pending', 7);
            
            // Wait for Docker to be ready
            setTimeout(() => {
              testDockerReady(0);
            }, 15000);
          } else {
            console.warn('[Docker] Docker Desktop not found in common locations');
            updateSplashProgress('docker', 'Docker Desktop non trouvé (essayez WSL2 Engine)', 'warning', 8);
            resolve(); // Continue anyway
          }
        } catch (error) {
          console.error('[Docker] Error launching Docker:', error);
          updateSplashProgress('docker', 'Erreur au lancement de Docker', 'warning', 8);
          resolve(); // Continue anyway
        }
      } else if (process.platform === 'darwin') {
        // macOS
        try {
          const dockerPath = '/Applications/Docker.app/Contents/MacOS/Docker';
          if (fs.existsSync(dockerPath)) {
            console.log('[Docker] Launching Docker on macOS...');
            spawn(dockerPath, [], { detached: true, stdio: 'ignore' });
            
            setTimeout(() => {
              testDockerReady(0);
            }, 15000);
          } else {
            console.warn('[Docker] Docker not found on macOS');
            updateSplashProgress('docker', 'Docker non trouvé', 'warning', 8);
            resolve();
          }
        } catch (error) {
          console.error('[Docker] Error launching Docker on macOS:', error);
          updateSplashProgress('docker', 'Erreur au lancement', 'warning', 8);
          resolve();
        }
      } else if (process.platform === 'linux') {
        // Linux - Docker typically runs as a service
        console.log('[Docker] Linux detected - Docker should be running as service');
        updateSplashProgress('docker', 'Linux: vérification du service Docker', 'pending', 7);
        testDockerReady(0);
      }
    };

    testDocker();
  });
}

// ============================================================
// BACKEND SERVER - Embedded Express
// ============================================================

function startBackend() {
  return new Promise((resolve, reject) => {
    try {
      // Update splash: environment setup
      updateSplashProgress('init', 'Démarrage de l\'application...', 'success', 5);
      updateSplashProgress('env', 'Configuration de l\'environnement...', 'pending', 10);
      
      // Set environment variables BEFORE requiring modules
      process.env.NODE_ENV = 'production';
      process.env.PORT = BACKEND_PORT.toString();
      process.env.DATA_PATH = getDataPath();
      process.env.RESOURCES_PATH = app.isPackaged ? process.resourcesPath : path.join(__dirname, '..');

      // Ensure data directory exists
      const dataPath = getDataPath();
      console.log('[Backend] Creating data directory:', dataPath);
      
      updateSplashProgress('env', 'Configuration de l\'environnement...', 'success', 15);
      updateSplashProgress('data', 'Préparation des données locales...', 'pending', 20);
      
      if (!fs.existsSync(dataPath)) {
        fs.mkdirSync(dataPath, { recursive: true });
      }

      console.log('[Backend] Starting embedded backend server...');
      console.log('[Backend] Data path:', dataPath);
      console.log('[Backend] Resources path:', process.env.RESOURCES_PATH);
      console.log('[Backend] Is packaged:', app.isPackaged);
      console.log('[Backend] Port:', BACKEND_PORT);

      updateSplashProgress('data', 'Préparation des données locales...', 'success', 25);
      updateSplashProgress('deps', 'Chargement des dépendances...', 'pending', 30);

      // Prefer the real backend (compiled TS server) so the packaged app uses the same
      // security posture (auth/CORS/CSP/rate-limits) as the standalone server.
      // Keep the legacy embedded server as a fallback for unbuilt/dev environments.
      const distServerPath = path.join(__dirname, '..', 'dist', 'server.js');
      const legacyEmbeddedPath = path.join(__dirname, 'start-server.js');
      const serverPath = fs.existsSync(distServerPath) ? distServerPath : legacyEmbeddedPath;
      console.log('[Backend] Server entry:', serverPath);
      console.log('[Backend] dist server exists:', fs.existsSync(distServerPath));
      console.log('[Backend] legacy embedded exists:', fs.existsSync(legacyEmbeddedPath));
      
      updateSplashProgress('deps', 'Chargement des dépendances...', 'success', 35);
      updateSplashProgress('server-init', 'Initialisation du serveur Express...', 'pending', 40);
      
      // Import and start the server with error catching
      try {
        require(serverPath);
        console.log('[Backend] Server module loaded successfully');
        updateSplashProgress('server-init', 'Initialisation du serveur Express...', 'success', 50);
      } catch (loadErr) {
        console.error('[Backend] Failed to load server module:', loadErr);
        updateSplashProgress('server-init', 'Erreur de chargement du serveur', 'error', 50);
        reject(loadErr);
        return;
      }
      
      updateSplashProgress('server-start', 'Connexion au serveur...', 'pending', 55);
      
      // Wait for server to be ready with increased timeout
      let attempts = 0;
      const maxAttempts = 120; // 60 seconds max
      
      const checkServer = () => {
        attempts++;
        
        // Update progress more frequently for better feedback
        const progressInCheck = 55 + Math.min(30, attempts * 0.5);
        const elapsedSec = Math.round(attempts / 2);
        
        // Update every 2 seconds (every 4 attempts)
        if (attempts % 4 === 0) {
          updateSplashProgress('server-start', `Connexion au serveur... (${elapsedSec}s)`, 'pending', progressInCheck);
        }
        
        if (attempts > maxAttempts) {
          console.error('[Backend] Timeout waiting for server');
          updateSplashProgress('server-start', 'Timeout du serveur', 'error', progressInCheck);
          reject(new Error(`Backend startup timeout after ${maxAttempts * 500}ms`));
          return;
        }
        
        const req = http.get(`http://127.0.0.1:${BACKEND_PORT}/api/health`, (res) => {
          if (res.statusCode === 200) {
            console.log('[Backend] Server is ready!');
            updateSplashProgress('server-start', 'Serveur démarré avec succès', 'success', 85);
            updateSplashProgress('ready', 'Serveur prêt !', 'success', 90);
            resolve();
          } else {
            console.log(`[Backend] Server responded with status ${res.statusCode}`);
            setTimeout(checkServer, 500);
          }
        });
        
        req.on('error', (err) => {
          if (attempts % 10 === 0) {
            console.log(`[Backend] Check attempt ${attempts}/${maxAttempts}: ${err.code}`);
          }
          setTimeout(checkServer, 500);
        });
        
        req.setTimeout(5000, () => {
          req.destroy();
          setTimeout(checkServer, 500);
        });
      };

      // Start checking after short delay
      console.log('[Backend] Starting health checks...');
      setTimeout(checkServer, 1000);
      
    } catch (error) {
      console.error('[Backend] Failed to start backend:', error);
      reject(error);
    }
  });
}

function stopBackend() {
  // Server runs in same process, will stop with app
  console.log('Backend stopping with app...');
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
              message: 'Node Orchestrator v2.3.1',
              detail: 'Orchestrateur Multi-Blockchain\n205+ blockchains supportées\n\n© 2026 Node Orchestrator Team',
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
    // Start Docker in the background (non-blocking).
    // The backend can start in degraded mode and will connect when Docker is ready.
    try {
      void ensureDockerIsRunning();
    } catch (e) {
      console.warn('[Docker] Background startup failed:', e);
    }

    // Start backend server
    await startBackend();

    // Update splash: loading UI
    updateSplashProgress('ui', 'Chargement de l\'interface...', 'pending', 92);

    // Create main window
    createMainWindow();
    createTray();
    createMenu();
    
    // Update splash: complete
    updateSplashProgress('ui', 'Interface prête', 'success', 98);
    updateSplashProgress('complete', 'Lancement de l\'application...', 'success', 100);
    
    // Small delay before closing splash for smooth transition
    setTimeout(() => {
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.close();
        splashWindow = null;
      }
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    }, 500);
    
  } catch (error) {
    console.error('Failed to start application:', error);
    updateSplashProgress('error', `Erreur: ${error.message}`, 'error', 0);
    setTimeout(() => {
      dialog.showErrorBox('Erreur de démarrage', `Impossible de démarrer l'application:\n${error.message}`);
      app.quit();
    }, 2000);
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
