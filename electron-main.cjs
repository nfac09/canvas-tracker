// Canvas Tracker — Electron main process
'use strict'

const { app, BrowserWindow, shell, ipcMain } = require('electron')
const path = require('path')
const { autoUpdater } = require('electron-updater')

const isDev = !app.isPackaged
let mainWindow = null

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * electron-updater returns releaseNotes as either a string or an array of
 * { version, note } objects depending on fullChangelog mode. Flatten to string.
 */
function flattenNotes(notes) {
  if (!notes) return ''
  if (typeof notes === 'string') return notes
  if (Array.isArray(notes)) return notes.map((n) => n.note ?? '').join('\n')
  return ''
}

// ─── Auto-updater ─────────────────────────────────────────────────────────────

function setupAutoUpdater() {
  if (isDev) return  // don't check for updates in development

  autoUpdater.autoDownload = true         // start downloading immediately when available
  autoUpdater.autoInstallOnAppQuit = true // install when user quits normally
  autoUpdater.fullChangelog = false       // only fetch notes for the latest release

  autoUpdater.on('update-available', (info) => {
    mainWindow?.webContents.send('update-available', {
      version: info.version,
      notes: flattenNotes(info.releaseNotes),
      publishedAt: info.releaseDate ?? new Date().toISOString(),
    })
  })

  autoUpdater.on('download-progress', (progress) => {
    mainWindow?.webContents.send('update-progress', {
      percent: Math.round(progress.percent),
      bytesPerSecond: progress.bytesPerSecond,
      transferred: progress.transferred,
      total: progress.total,
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    mainWindow?.webContents.send('update-downloaded', {
      version: info.version,
      notes: flattenNotes(info.releaseNotes),
    })
  })

  autoUpdater.on('error', (err) => {
    // Non-fatal — update errors should never crash the app
    console.error('[updater] error:', err.message)
    mainWindow?.webContents.send('update-error', { message: err.message })
  })

  // Check 4s after the window appears — avoids blocking startup render
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((err) => {
      console.error('[updater] check failed:', err.message)
    })
  }, 4000)
}

// ─── IPC handlers ─────────────────────────────────────────────────────────────

ipcMain.handle('open-external', (_e, url) => shell.openExternal(url))
ipcMain.handle('get-version', () => app.getVersion())

ipcMain.handle('install-update', () => {
  try {
    autoUpdater.quitAndInstall(false, true)
  } catch (err) {
    // Unsigned macOS builds can't auto-install — fall back to GitHub releases page
    console.error('[updater] install failed:', err.message)
    shell.openExternal('https://github.com/nfac09/canvas-tracker/releases/latest')
  }
})

// ─── Window ───────────────────────────────────────────────────────────────────

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 18 },
    backgroundColor: '#0d0d13',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'electron-preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,  // required for contextBridge + ipcRenderer
    },
  })

  // Show window only after the page has rendered (no white flash)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    setupAutoUpdater()
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'))
  }

  // All link opens go to the system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

// ─── App lifecycle ────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  createWindow()

  // macOS: re-create window when dock icon is clicked with no windows open
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// macOS: keep process alive when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
