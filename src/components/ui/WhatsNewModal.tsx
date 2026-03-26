import { useEffect, useState } from 'react'
import { Modal } from './Modal'

const LAST_SEEN_KEY = 'ct-last-seen-version'
const GITHUB_REPO = 'nfac09/canvas-tracker'

function parseNotes(body: string): string[] {
  return body
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => l.replace(/^[-*•]\s*/, ''))
}

export function WhatsNewModal() {
  const [open, setOpen] = useState(false)
  const [version, setVersion] = useState('')
  const [notes, setNotes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!window.electronAPI) return

    window.electronAPI.getVersion().then(async (v) => {
      const lastSeen = localStorage.getItem(LAST_SEEN_KEY)

      if (lastSeen === null) {
        // Fresh install — just record the version, don't show the modal
        localStorage.setItem(LAST_SEEN_KEY, v)
        return
      }

      if (lastSeen === v) return  // already seen this version

      // User has updated — mark as seen immediately so it only shows once
      localStorage.setItem(LAST_SEEN_KEY, v)
      setVersion(v)
      setOpen(true)
      setLoading(true)

      // Fetch the release notes for this specific version from GitHub
      try {
        const res = await fetch(
          `https://api.github.com/repos/${GITHUB_REPO}/releases/tags/v${v}`,
          { headers: { 'User-Agent': 'Canvas-Tracker-App' } },
        )
        if (res.ok) {
          const data = await res.json() as { body?: string }
          setNotes(parseNotes(data.body ?? ''))
        }
      } catch {
        // No network or release not found — modal still shows with version info
      } finally {
        setLoading(false)
      }
    })
  }, [])

  if (!open) return null

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      title={`What's new in v${version}`}
      size="sm"
    >
      <div className="space-y-4">
        {loading ? (
          <p className="text-sm text-slate-400 dark:text-[#8888a8]">Loading release notes…</p>
        ) : notes.length > 0 ? (
          <ul className="space-y-2">
            {notes.map((note, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-slate-600 dark:text-[#8888a8]">
                <span className="text-indigo-400 shrink-0 mt-0.5">·</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500 dark:text-[#8888a8]">
            Canvas Tracker has been updated to v{version}.
          </p>
        )}

        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() =>
              window.electronAPI?.openExternal(
                `https://github.com/${GITHUB_REPO}/releases/tag/v${version}`,
              )
            }
            className="text-xs text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
          >
            Full release notes ↗
          </button>
          <button
            onClick={() => setOpen(false)}
            className="px-4 py-1.5 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </Modal>
  )
}
