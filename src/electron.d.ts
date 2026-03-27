export {}

// ─── Types exposed via contextBridge ──────────────────────────────────────────

export interface UpdateInfo {
  version: string       // e.g. "1.2.0"
  notes: string         // GitHub release body (markdown)
  publishedAt?: string  // ISO date string
}

export interface UpdateProgress {
  percent: number         // 0–100
  bytesPerSecond: number
  transferred: number     // bytes downloaded so far
  total: number           // total bytes
}

export interface UpdateError {
  message: string
}

// ─── Global window augmentation ───────────────────────────────────────────────

declare global {
  interface Window {
    /**
     * electronAPI is injected by electron-preload.cjs via contextBridge.
     * Undefined when running in a normal browser (not inside Electron).
     */
    electronAPI?: {
      // Update lifecycle listeners
      onUpdateAvailable:  (callback: (info: UpdateInfo) => void) => void
      onUpdateProgress:   (callback: (progress: UpdateProgress) => void) => void
      onUpdateDownloaded: (callback: (info: UpdateInfo) => void) => void
      onUpdateError:      (callback: (error: UpdateError) => void) => void

      // Actions
      installUpdate:   () => Promise<void>
      openExternal:    (url: string) => Promise<void>
      getVersion:      () => Promise<string>
      /** Fetch a Canvas iCal feed URL via the main process — no CORS proxy, no third-party routing */
      fetchIcalUrl:    (url: string) => Promise<string>
    }
  }
}
