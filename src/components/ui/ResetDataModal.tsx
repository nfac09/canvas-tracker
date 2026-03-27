import { useState } from 'react'
import { Modal } from './Modal'
import { Button } from './Button'
import { useStore } from '../../store'

interface ResetDataModalProps {
  open: boolean
  onClose: () => void
}

type ResetScope = 'all' | 'imports'

const SCOPE_CONFIG = {
  all: {
    label: 'Reset everything',
    description: 'Wipe all app data and return to a clean slate.',
    bullets: [
      'All assignments (manual and imported)',
      'All courses',
      'All recurring patterns and rules',
      'All Canvas import history',
      'All recurrence suggestions',
    ],
    note: 'Your display preferences (theme, week start) will be kept.',
    confirmLabel: 'Reset all data',
  },
  imports: {
    label: 'Clear Canvas import data only',
    description: 'Remove everything that came from Canvas imports, keeping data you created manually.',
    bullets: [
      'Assignments imported from Canvas',
      'All import sessions and history',
      'Pending recurrence suggestions from imports',
    ],
    note: 'Manually-created assignments, courses, and recurring patterns are kept.',
    confirmLabel: 'Clear import data',
  },
} satisfies Record<ResetScope, {
  label: string
  description: string
  bullets: string[]
  note: string
  confirmLabel: string
}>

export function ResetDataModal({ open, onClose }: ResetDataModalProps) {
  const resetAllData = useStore((s) => s.resetAllData)
  const resetImportData = useStore((s) => s.resetImportData)

  const [scope, setScope] = useState<ResetScope>('all')
  const [confirmed, setConfirmed] = useState(false)

  function handleClose() {
    setScope('all')
    setConfirmed(false)
    onClose()
  }

  function handleConfirm() {
    if (scope === 'all') {
      resetAllData()
    } else {
      resetImportData()
    }
    handleClose()
  }

  const config = SCOPE_CONFIG[scope]

  return (
    <Modal open={open} onClose={handleClose} title="Reset app data" size="sm">
      <div className="space-y-4">
        {/* Scope selector */}
        <div className="space-y-2">
          {(Object.entries(SCOPE_CONFIG) as [ResetScope, typeof SCOPE_CONFIG[ResetScope]][]).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => { setScope(key); setConfirmed(false) }}
              className={`w-full text-left px-3.5 py-3 rounded-xl border transition-all duration-100
                ${scope === key
                  ? 'border-red-300 dark:border-red-700/60 bg-red-50 dark:bg-red-950/30'
                  : 'border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] hover:border-slate-300 dark:hover:border-white/[0.14]'
                }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 flex items-center justify-center
                  ${scope === key
                    ? 'border-red-500 dark:border-red-400'
                    : 'border-slate-300 dark:border-white/20'
                  }`}
                >
                  {scope === key && (
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 dark:bg-red-400" />
                  )}
                </div>
                <span className={`text-sm font-medium ${scope === key ? 'text-red-800 dark:text-red-300' : 'text-slate-700 dark:text-slate-300'}`}>
                  {cfg.label}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* What will be deleted */}
        <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-xl px-4 py-3 space-y-2">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Will be permanently deleted
          </p>
          <ul className="space-y-1">
            {config.bullets.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                <span className="mt-[5px] w-1 h-1 rounded-full bg-red-400 dark:bg-red-500 shrink-0" />
                {b}
              </li>
            ))}
          </ul>
          <p className="text-xs text-slate-400 dark:text-slate-500 pt-0.5 border-t border-slate-200 dark:border-white/[0.06]">
            {config.note}
          </p>
        </div>

        {/* Confirmation checkbox */}
        <label className="flex items-start gap-3 cursor-pointer select-none group">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 w-4 h-4 shrink-0 rounded border-slate-300 dark:border-white/20 text-red-600 focus:ring-red-500/40 cursor-pointer"
          />
          <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors leading-snug">
            I understand this action is permanent and cannot be undone
          </span>
        </label>

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-1">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirm}
            disabled={!confirmed}
          >
            {config.confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
