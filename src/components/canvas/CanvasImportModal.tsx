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
  // Fallback ref used only in browser (non-Electron) environments
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

  // Browser fallback: read file via FileReader (not used in packaged Electron app)
  function handleFileFallback(e: ChangeEvent<HTMLInputElement>) {
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

  async function handleUploadClick() {
    if (window.electronAPI?.openFileDialog) {
      // Electron: open the native file picker from the main process.
      // This avoids blocking the renderer thread (which causes beachball on macOS).
      setLoading(true)
      setError('')
      setResult(null)
      try {
        const text = await window.electronAPI.openFileDialog()
        if (text === null) return // user canceled — no error, no state change
        const session = importFromIcal(text, 'ics_file')
        setResult(session)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse file.')
      } finally {
        setLoading(false)
      }
    } else {
      // Browser / dev fallback: use hidden <input type="file">
      fileRef.current?.click()
    }
  }

  async function handleUrl() {
    const trimmed = url.trim()
    if (!trimmed) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const text = await window.electronAPI!.fetchIcalUrl(trimmed)
      const session = importFromIcal(text, 'ical_url')
      setResult(session)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch calendar. Try the file upload method instead.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Import from Canvas">
      <div className="space-y-4">

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 dark:bg-white/[0.05] p-1 rounded-xl">
          {(['file', 'url'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError('') }}
              className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors
                ${tab === t
                  ? 'bg-white dark:bg-white/[0.1] text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
            >
              {t === 'file' ? 'Upload .ics file' : 'Paste feed URL'}
            </button>
          ))}
        </div>

        {tab === 'file' && (
          <div className="space-y-3">
            <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.07] rounded-xl p-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed space-y-1">
              <p className="font-medium text-slate-800 dark:text-slate-200">How to get your .ics file:</p>
              <ol className="list-decimal list-inside space-y-0.5 text-slate-500 dark:text-slate-500">
                <li>Open <strong className="text-slate-700 dark:text-slate-300">Canvas</strong> → go to <strong className="text-slate-700 dark:text-slate-300">Calendar</strong></li>
                <li>Scroll down in the <strong className="text-slate-700 dark:text-slate-300">right sidebar</strong></li>
                <li>Click <strong className="text-slate-700 dark:text-slate-300">Calendar Feed</strong> to open the feed URL in your browser</li>
                <li>Save the page as a <strong className="text-slate-700 dark:text-slate-300">.ics file</strong> and upload it below</li>
              </ol>
            </div>
            {/* Hidden input used only in non-Electron (browser) environments */}
            <input
              ref={fileRef}
              type="file"
              accept=".ics,text/calendar"
              className="hidden"
              onChange={handleFileFallback}
            />
            <button
              onClick={handleUploadClick}
              disabled={loading}
              className="w-full border-2 border-dashed border-slate-200 dark:border-white/[0.08] rounded-xl py-8 text-sm text-slate-400 dark:text-slate-500 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="block text-2xl mb-2">📂</span>
              {loading ? 'Reading file…' : 'Click to choose an .ics file'}
            </button>
          </div>
        )}

        {tab === 'url' && (
          <div className="space-y-3">
            <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.07] rounded-xl p-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed space-y-1">
              <p className="font-medium text-slate-800 dark:text-slate-200">How to get your feed URL:</p>
              <ol className="list-decimal list-inside space-y-0.5 text-slate-500 dark:text-slate-500">
                <li>Open <strong className="text-slate-700 dark:text-slate-300">Canvas</strong> → go to <strong className="text-slate-700 dark:text-slate-300">Calendar</strong></li>
                <li>Scroll down in the <strong className="text-slate-700 dark:text-slate-300">right sidebar</strong></li>
                <li>Click <strong className="text-slate-700 dark:text-slate-300">Calendar Feed</strong></li>
                <li>Copy the URL and paste it below</li>
              </ol>
              <p className="text-slate-400 dark:text-slate-600 pt-1">
                Your URL is fetched directly — it never leaves your device.
              </p>
            </div>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleUrl() }}
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
            <div className="grid grid-cols-3 gap-2 text-center mb-2">
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
            {!!result.coursesCreated && (
              <p className="text-xs text-indigo-600 dark:text-indigo-400 text-center font-medium mb-1">
                {result.coursesCreated} new course{result.coursesCreated !== 1 ? 's' : ''} created automatically
              </p>
            )}
            <p className="text-xs text-emerald-600 dark:text-emerald-500 text-center">
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
