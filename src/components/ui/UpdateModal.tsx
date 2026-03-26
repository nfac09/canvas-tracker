import { useEffect, useState } from 'react'
// Types come from the global Window augmentation in src/electron.d.ts
type UpdateState = 'idle' | 'available' | 'downloading' | 'downloaded' | 'error'

interface UpdateInfo {
  version: string
  notes: string
  publishedAt?: string
}

interface UpdateProgress {
  percent: number
  bytesPerSecond: number
  transferred: number
  total: number
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function parseNotes(raw: string): string[] {
  return raw
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))  // drop markdown headings
    .map((l) => l.replace(/^[-*•]\s*/, ''))  // strip list markers
}

export function UpdateModal() {
  const [state, setState] = useState<UpdateState>('idle')
  const [info, setInfo] = useState<UpdateInfo | null>(null)
  const [progress, setProgress] = useState<UpdateProgress | null>(null)
  const [notesOpen, setNotesOpen] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!window.electronAPI) return

    window.electronAPI.onUpdateAvailable((u) => {
      setInfo(u)
      setState('available')
    })

    window.electronAPI.onUpdateProgress((p) => {
      setProgress(p)
      setState('downloading')
      setDismissed(false) // always show during download
    })

    window.electronAPI.onUpdateDownloaded((u) => {
      setInfo(u)
      setState('downloaded')
      setDismissed(false) // always surface the restart prompt
    })

    window.electronAPI.onUpdateError(() => {
      // Only surface the error if we were already showing something
      setState((prev) => (prev === 'idle' ? 'idle' : 'error'))
    })
  }, [])

  if (state === 'idle') return null
  if (dismissed && state === 'available') return null

  const notes = parseNotes(info?.notes ?? '')
  const pct = progress?.percent ?? 0

  return (
    <div className="fixed bottom-5 right-5 z-50 w-[320px] rounded-xl border border-white/[0.1] bg-[#15151f] shadow-2xl shadow-black/50 overflow-hidden">

      {/* ── Available state ──────────────────────────────────────────────── */}
      {state === 'available' && (
        <>
          <div className="flex items-start justify-between px-4 pt-4 pb-3">
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-white leading-tight">
                Update available
              </p>
              <p className="text-xs text-[#8888a8] mt-0.5">
                Version {info?.version} is ready to download
              </p>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="ml-3 text-[#4a4a6a] hover:text-[#8888a8] transition-colors shrink-0 text-lg leading-none"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>

          {/* Patch notes toggle */}
          {notes.length > 0 && (
            <>
              <button
                onClick={() => setNotesOpen((v) => !v)}
                className="w-full text-left px-4 py-2 text-xs text-[#8888a8] hover:text-white/70 hover:bg-white/[0.04] transition-colors flex items-center gap-1.5 border-t border-white/[0.06]"
              >
                <span className="text-[10px]">{notesOpen ? '▴' : '▾'}</span>
                {notesOpen ? 'Hide' : "What's new"}
              </button>
              {notesOpen && (
                <ul className="px-4 pb-3 space-y-1.5 max-h-36 overflow-y-auto">
                  {notes.map((line, i) => (
                    <li key={i} className="flex gap-2 text-xs text-[#8888a8]">
                      <span className="text-[#3a3a55] shrink-0 mt-0.5">•</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {/* Action */}
          <div className="px-4 pb-4 pt-1 border-t border-white/[0.06]">
            <p className="text-[11px] text-[#4a4a6a] mb-2">
              Downloading automatically in the background…
            </p>
          </div>
        </>
      )}

      {/* ── Downloading state ────────────────────────────────────────────── */}
      {state === 'downloading' && (
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[13px] font-semibold text-white">Downloading update…</p>
            <span className="text-xs text-indigo-400 font-medium tabular-nums">{pct}%</span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-1 bg-white/[0.08] rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          {progress && (
            <p className="text-[11px] text-[#4a4a6a] mt-1.5 tabular-nums">
              {formatBytes(progress.transferred)} / {formatBytes(progress.total)}
              {' · '}
              {formatBytes(progress.bytesPerSecond)}/s
            </p>
          )}
        </div>
      )}

      {/* ── Downloaded / ready to install ────────────────────────────────── */}
      {state === 'downloaded' && (
        <>
          <div className="px-4 pt-4 pb-3">
            <p className="text-[13px] font-semibold text-white">Ready to install</p>
            <p className="text-xs text-[#8888a8] mt-0.5">
              {info?.version} downloaded — restart to apply the update
            </p>
          </div>

          {notes.length > 0 && (
            <>
              <button
                onClick={() => setNotesOpen((v) => !v)}
                className="w-full text-left px-4 py-2 text-xs text-[#8888a8] hover:text-white/70 hover:bg-white/[0.04] transition-colors flex items-center gap-1.5 border-t border-white/[0.06]"
              >
                <span className="text-[10px]">{notesOpen ? '▴' : '▾'}</span>
                {notesOpen ? 'Hide' : "What's new"}
              </button>
              {notesOpen && (
                <ul className="px-4 pb-3 space-y-1.5 max-h-36 overflow-y-auto">
                  {notes.map((line, i) => (
                    <li key={i} className="flex gap-2 text-xs text-[#8888a8]">
                      <span className="text-[#3a3a55] shrink-0 mt-0.5">•</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          <div className="px-4 pb-4 pt-2 border-t border-white/[0.06] flex gap-2">
            <button
              onClick={() => window.electronAPI?.installUpdate()}
              className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            >
              Restart &amp; Install
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#8888a8] hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              Later
            </button>
          </div>
        </>
      )}

      {/* ── Error state ──────────────────────────────────────────────────── */}
      {state === 'error' && (
        <div className="px-4 py-4 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-white">Update failed</p>
            <button
              onClick={() => window.electronAPI?.openExternal('https://github.com/nfac09/canvas-tracker/releases/latest')}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors mt-0.5"
            >
              Download manually ↗
            </button>
          </div>
          <button
            onClick={() => setState('idle')}
            className="text-[#4a4a6a] hover:text-[#8888a8] transition-colors text-lg leading-none shrink-0"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}
