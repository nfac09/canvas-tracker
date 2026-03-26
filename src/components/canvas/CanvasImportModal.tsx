import { useState, useRef, type ChangeEvent } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { useStore } from '../../store'
import type { CanvasImportSession } from '../../types'

interface CanvasImportModalProps {
  open: boolean
  onClose: () => void
}

type Tab = 'file' | 'url'

export function CanvasImportModal({ open, onClose }: CanvasImportModalProps) {
  const importFromIcal = useStore((s) => s.importFromIcal)
  const [tab, setTab] = useState<Tab>('file')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<CanvasImportSession | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function reset() {
    setUrl('')
    setLoading(false)
    setError('')
    setResult(null)
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setResult(null)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      try {
        const session = importFromIcal(text, 'ics_file')
        setResult(session)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse file.')
      }
    }
    reader.readAsText(file)
  }

  async function handleUrl() {
    if (!url.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url.trim())}`
      const resp = await fetch(proxyUrl)
      if (!resp.ok) throw new Error('Network error fetching calendar.')
      const data = (await resp.json()) as { contents?: string }
      if (!data.contents) throw new Error('Empty response from calendar URL.')
      const session = importFromIcal(data.contents, 'ical_url')
      setResult(session)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch calendar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Import from Canvas">
      <div className="space-y-4">
        {/* Info banner */}
        <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl p-3 text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
          <strong>How to get your Canvas calendar:</strong>{' '}
          Calendar → gear icon → "Calendar Feed" to copy the URL, or "Export" to download a .ics file.
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 dark:bg-white/[0.05] p-1 rounded-xl">
          {(['file', 'url'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors
                ${tab === t
                  ? 'bg-white dark:bg-white/[0.1] text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
            >
              {t === 'file' ? 'Upload .ics file' : 'Paste URL'}
            </button>
          ))}
        </div>

        {tab === 'file' && (
          <div>
            <input
              ref={fileRef}
              type="file"
              accept=".ics,text/calendar"
              className="hidden"
              onChange={handleFile}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-slate-200 dark:border-white/[0.08] rounded-xl py-8 text-sm text-slate-400 dark:text-slate-500 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <span className="block text-2xl mb-2">📂</span>
              Click to choose an .ics file
            </button>
          </div>
        )}

        {tab === 'url' && (
          <div className="space-y-2">
            <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
              Uses a CORS proxy to fetch the URL. Do not paste sensitive links.
            </p>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full rounded-lg border-slate-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.06] dark:text-slate-100 text-sm focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
              placeholder="https://canvas.instructure.com/feeds/calendars/…"
            />
            <Button
              variant="primary"
              onClick={handleUrl}
              disabled={loading || !url.trim()}
              className="w-full justify-center"
            >
              {loading ? 'Importing…' : 'Import Calendar'}
            </Button>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl p-3 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {result && (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl p-4">
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 mb-3">
              Import complete
            </p>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'Created', value: result.itemsCreated, color: 'text-emerald-700 dark:text-emerald-400' },
                { label: 'Updated', value: result.itemsUpdated, color: 'text-blue-700 dark:text-blue-400' },
                { label: 'Skipped', value: result.itemsSkipped, color: 'text-slate-500 dark:text-slate-500' },
              ].map((stat) => (
                <div key={stat.label} className="bg-white dark:bg-white/[0.07] rounded-lg py-2">
                  <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-500 text-center mt-2">
              Safe to re-import — duplicates are automatically skipped.
            </p>
          </div>
        )}

        <div className="flex justify-end">
          <Button variant="secondary" onClick={handleClose}>
            {result ? 'Done' : 'Cancel'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
