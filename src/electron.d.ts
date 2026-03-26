export {}

interface UpdateInfo {
  version: string      // e.g. "v1.2.0"
  notes: string        // GitHub release body (markdown)
  url: string          // GitHub release page URL
  publishedAt: string  // ISO date string
}

declare global {
  interface Window {
    electronAPI?: {
      onUpdateAvailable: (callback: (info: UpdateInfo) => void) => void
      openExternal: (url: string) => Promise<void>
      getVersion: () => Promise<string>
    }
  }
}
