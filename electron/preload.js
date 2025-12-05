/**
 * ============================================================
 * ELECTRON PRELOAD SCRIPT
 * Secure bridge between renderer and main process
 * ============================================================
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getVersion: () => ipcRenderer.invoke('get-version'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  getDataPath: () => ipcRenderer.invoke('get-data-path'),

  // Dialogs
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),

  // Navigation
  onNavigate: (callback) => ipcRenderer.on('navigate', (event, path) => callback(path)),

  // Actions
  onAction: (callback) => ipcRenderer.on('action', (event, action, data) => callback(action, data)),

  // Splash screen updates
  onSplashUpdate: (callback) => ipcRenderer.on('splash-update', (event, data) => callback(data)),

  // System
  isElectron: true,
});

// Notify that preload is complete
console.log('Electron preload script loaded');
