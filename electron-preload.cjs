// Canvas Tracker — Electron preload script
// Bridges secure IPC between the main process and the renderer.
'use strict'

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // Called once when main process detects a newer GitHub release
  onUpdateAvailable: (callback) => {
    ipcRenderer.on('update-available', (_event, info) => callback(info))
  },
  // Open a URL in the default system browser
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  // Get the current app version (from package.json)
  getVersion: () => ipcRenderer.invoke('get-version'),
})
