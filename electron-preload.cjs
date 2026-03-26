// Canvas Tracker — Electron preload script
// Bridges the main process and renderer via contextBridge (secure, sandboxed).
'use strict'

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // ─── Update lifecycle ──────────────────────────────────────────────────────
  // Called when a new version is found on GitHub
  onUpdateAvailable:  (cb) => ipcRenderer.on('update-available',  (_e, info) => cb(info)),
  // Called repeatedly during download with { percent, bytesPerSecond, transferred, total }
  onUpdateProgress:   (cb) => ipcRenderer.on('update-progress',   (_e, info) => cb(info)),
  // Called when download is complete and ready to install
  onUpdateDownloaded: (cb) => ipcRenderer.on('update-downloaded', (_e, info) => cb(info)),
  // Called if the updater encounters an error
  onUpdateError:      (cb) => ipcRenderer.on('update-error',      (_e, info) => cb(info)),

  // ─── Actions ──────────────────────────────────────────────────────────────
  // Quit and install the downloaded update (falls back to GitHub page if unsigned)
  installUpdate:  ()      => ipcRenderer.invoke('install-update'),
  // Open a URL in the system default browser
  openExternal:   (url)   => ipcRenderer.invoke('open-external', url),
  // Returns the app version from package.json
  getVersion:     ()      => ipcRenderer.invoke('get-version'),
})
