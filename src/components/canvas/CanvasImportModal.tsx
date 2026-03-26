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
    <Modal open={open} onClose={handleClose} title="Import from Canvas" size="md">
      <div className="space-y-4">
        {/* How-to banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
          <strong>How to get your Canvas calendar:</strong>
          <br />
          In Canvas, go to Calendar → click the gear icon → "Calendar Feed" → copy the URL, or
          click "Export" to download an .ics file.
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setTab('file')}
            className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors
              ${tab === 'file' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Upload .ics file
          </button>
          <button
            onClick={() => setTab('url')}
            className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors
              ${tab === 'url' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Paste URL
          </button>
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
              className="w-full border-2 border-dashed border-gray-300 rounded-xl py-8 text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
            >
              <span className="block text-2xl mb-2">📂</span>
              Click to choose an .ics file
            </button>
          </div>
        )}

        {tab === 'url' && (
          <div className="space-y-2">
            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
              Uses a CORS proxy (allorigins.win) to fetch the URL. Do not use with sensitive URLs.
            </div>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full rounded-lg border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="https://canvas.instructure.com/feeds/calendars/..."
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

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-green-800 mb-2">Import complete!</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-lg font-bold text-green-700">{result.itemsCreated}</p>
                <p className="text-xs text-green-600">Created</p>
              </div>
              <div>
                <p className="text-lg font-bold text-blue-700">{result.itemsUpdated}</p>
                <p className="text-xs text-blue-600">Updated</p>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-500">{result.itemsSkipped}</p>
                <p className="text-xs text-gray-400">Skipped</p>
              </div>
            </div>
            <p className="text-xs text-green-600 text-center mt-2">
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
