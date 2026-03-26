// Canvas Tracker — Electron main process
'use strict'

const { app, BrowserWindow, shell, ipcMain } = require('electron')
const path = require('path')
const https = require('https')

// In dev (not packaged), load from Vite dev server
const isDev = !app.isPackaged

const GITHUB_REPO = 'nfac09/canvas-tracker'
let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    // macOS native look: hidden inset keeps traffic lights visible
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 18 },
    backgroundColor: '#0f172a',
    show: false, // show after content loads to avoid white flash
    webPreferences: {
      preload: path.join(__dirname, 'electron-preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // must be false to allow contextBridge with ipcRenderer
    },
  })

  // Show window once the page is ready (avoids white flash)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    // Check for updates shortly after window is shown
    setTimeout(() => checkForUpdates(), 3000)
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    // Uncomment to open DevTools in dev:
    // mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'))
  }

  // Open external links in the system browser, not Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

// Compare semver strings: returns true if remote > local
function isNewer(local, remote) {
  const parse = (v) => v.replace(/^v/, '').split('.').map(Number)
  const [lMaj, lMin, lPatch] = parse(local)
  const [rMaj, rMin, rPatch] = parse(remote)
  if (rMaj !== lMaj) return rMaj > lMaj
  if (rMin !== lMin) return rMin > lMin
  return rPatch > lPatch
}

function checkForUpdates() {
  const options = {
    hostname: 'api.github.com',
    path: `/repos/${GITHUB_REPO}/releases/latest`,
    headers: { 'User-Agent': 'Canvas-Tracker-App' },
  }

  https.get(options, (res) => {
    let data = ''
    res.on('data', (chunk) => { data += chunk })
    res.on('end', () => {
      try {
        if (res.statusCode !== 200) return
        const release = JSON.parse(data)
        const remoteVersion = release.tag_name   // e.g. "v1.2.0"
        const localVersion = app.getVersion()    // from package.json
        if (isNewer(localVersion, remoteVersion)) {
          mainWindow && mainWindow.webContents.send('update-available', {
            version: remoteVersion,
            notes: release.body ?? '',
            url: release.html_url,
            publishedAt: release.published_at,
          })
        }
      } catch (_) {
        // Network or parse errors are silently ignored
      }
    })
  }).on('error', () => {
    // Update check failures are silent — the app works fine without them
  })
}

// IPC: renderer asks us to open a URL in the system browser
ipcMain.handle('open-external', (_event, url) => {
  shell.openExternal(url)
})

// IPC: renderer asks for the current app version
ipcMain.handle('get-version', () => app.getVersion())

app.whenReady().then(() => {
  createWindow()

  // macOS: re-create window when dock icon is clicked and no windows are open
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// macOS: keep app running when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
