import { useEffect, useState } from 'react'

interface UpdateInfo {
  version: string
  notes: string
  url: string
  publishedAt: string
}

export function UpdateBanner() {
  const [update, setUpdate] = useState<UpdateInfo | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Only available when running inside Electron
    window.electronAPI?.onUpdateAvailable((info) => {
      setUpdate(info)
    })
  }, [])

  if (!update || dismissed) return null

  const lines = update.notes
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-indigo-50 dark:bg-indigo-950/60">
        <div className="flex items-center gap-2">
          <span className="text-indigo-500 text-base">↑</span>
          <div>
            <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
              Update available — {update.version}
            </p>
            <p className="text-xs text-indigo-400 dark:text-indigo-500">
              {new Date(update.publishedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-indigo-300 hover:text-indigo-500 dark:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-lg leading-none"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>

      {/* Patch notes toggle */}
      {lines.length > 0 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full text-left px-4 py-2 text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
        >
          <span>{expanded ? '▾' : '▸'}</span>
          {expanded ? 'Hide' : "What's new"}
        </button>
      )}

      {expanded && (
        <ul className="px-4 pb-3 space-y-1 max-h-40 overflow-y-auto">
          {lines.map((line, i) => (
            <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex gap-1.5">
              <span className="text-slate-300 dark:text-slate-600 shrink-0">•</span>
              <span>{line.replace(/^[-*•]\s*/, '')}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Download button */}
      <div className="px-4 pb-4 pt-1">
        <button
          onClick={() => window.electronAPI?.openExternal(update.url)}
          className="w-full py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
        >
          Download {update.version}
        </button>
      </div>
    </div>
  )
}
