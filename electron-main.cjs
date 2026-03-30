// Canvas Tracker — Electron main process
'use strict'

const { app, BrowserWindow, shell, ipcMain, dialog } = require('electron')
const fs = require('fs')
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

/**
 * Open a native file picker (main process) and return the .ics file contents.
 * Returns null if the user cancels without selecting a file.
 * Using dialog.showOpenDialog from the main process avoids the renderer-freeze
 * bug caused by programmatically clicking a hidden <input type="file">.
 */
ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Choose Canvas Calendar Export',
    filters: [{ name: 'iCal Calendar', extensions: ['ics'] }],
    properties: ['openFile'],
  })
  if (result.canceled || result.filePaths.length === 0) return null
  return fs.promises.readFile(result.filePaths[0], 'utf8')
})

/**
 * Fetch a Canvas iCal feed URL from the main process (Node.js).
 * No CORS restrictions apply here — the URL is fetched directly and
 * never routed through a third-party proxy.
 */
ipcMain.handle('fetch-ical-url', async (_e, rawUrl) => {
  // Normalize webcal:// → https:// (Canvas feed URLs often use this scheme)
  const url = rawUrl.replace(/^webcal:\/\//i, 'https://')

  // Validate URL before making any network call
  let parsed
  try {
    parsed = new URL(url)
  } catch {
    throw new Error('Invalid URL — make sure you copied the full calendar feed link.')
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only http and https URLs are supported.')
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 20000) // 20s timeout

  try {
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'CanvasTracker/1.0' },
    })
    clearTimeout(timeoutId)

    if (resp.status === 401 || resp.status === 403) {
      throw new Error(
        `Canvas returned HTTP ${resp.status}. The calendar feed URL may have expired — copy it again from Canvas Calendar settings.`
      )
    }
    if (resp.status === 404) {
      throw new Error('URL not found (HTTP 404). Double-check that you copied the correct calendar feed link.')
    }
    if (!resp.ok) {
      throw new Error(`Canvas returned HTTP ${resp.status}. Try again, or use the file upload method instead.`)
    }

    const text = await resp.text()
    if (!text.trimStart().startsWith('BEGIN:VCALENDAR')) {
      throw new Error(
        'The URL did not return a valid calendar file. Make sure you copied the "Calendar Feed" link, not a regular Canvas page URL.'
      )
    }
    return text
  } catch (err) {
    clearTimeout(timeoutId)
    if (err.name === 'AbortError') {
      throw new Error('Request timed out after 20 seconds. Check your internet connection and try again.')
    }
    throw err
  }
})

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
