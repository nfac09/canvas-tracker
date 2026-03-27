import { useState, useEffect, type FormEvent } from 'react'
import type { Assignment } from '../../types'
import { useStore } from '../../store'
import { getCourseById } from '../../store/selectors'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { formatDisplayDate } from '../../utils/dateHelpers'

interface GradeEntryModalProps {
  open: boolean
  onClose: () => void
  assignment: Assignment | null
}

const inputCls =
  'w-full rounded-lg border-slate-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.06] ' +
  'text-slate-900 dark:text-slate-100 dark:placeholder-slate-600 text-sm ' +
  'focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors'
const labelCls = 'block text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-white/25 mb-1.5'

function letterFromPercent(pct: number): string {
  if (pct >= 93) return 'A'
  if (pct >= 90) return 'A-'
  if (pct >= 87) return 'B+'
  if (pct >= 83) return 'B'
  if (pct >= 80) return 'B-'
  if (pct >= 77) return 'C+'
  if (pct >= 73) return 'C'
  if (pct >= 70) return 'C-'
  if (pct >= 67) return 'D+'
  if (pct >= 60) return 'D'
  return 'F'
}

function pctColor(pct: number) {
  if (pct >= 90) return 'text-emerald-600 dark:text-emerald-400'
  if (pct >= 80) return 'text-blue-600 dark:text-blue-400'
  if (pct >= 70) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

function pctBg(pct: number) {
  if (pct >= 90) return 'bg-emerald-50/80 dark:bg-emerald-500/[0.08] border-emerald-100 dark:border-emerald-500/[0.15]'
  if (pct >= 80) return 'bg-blue-50/80 dark:bg-blue-500/[0.08] border-blue-100 dark:border-blue-500/[0.15]'
  if (pct >= 70) return 'bg-amber-50/80 dark:bg-amber-500/[0.08] border-amber-100 dark:border-amber-500/[0.15]'
  return 'bg-red-50/80 dark:bg-red-500/[0.08] border-red-100 dark:border-red-500/[0.15]'
}

export function GradeEntryModal({ open, onClose, assignment }: GradeEntryModalProps) {
  const courses = useStore((s) => s.courses)
  const updateAssignment = useStore((s) => s.updateAssignment)

  const [pointsEarned, setPointsEarned] = useState('')
  const [pointsPossible, setPointsPossible] = useState('')
  const [letterGrade, setLetterGrade] = useState('')
  const [gradeFeedback, setGradeFeedback] = useState('')

  useEffect(() => {
    if (open && assignment) {
      setPointsEarned(assignment.pointsEarned !== undefined ? String(assignment.pointsEarned) : '')
      setPointsPossible(assignment.pointsPossible !== undefined ? String(assignment.pointsPossible) : '')
      setLetterGrade(assignment.letterGrade ?? '')
      setGradeFeedback(assignment.gradeFeedback ?? '')
    }
  }, [open, assignment])

  if (!open || !assignment) return null

  const course = getCourseById(courses, assignment.courseId)
  const earned = parseFloat(pointsEarned)
  const possible = parseFloat(pointsPossible)
  const pct =
    !isNaN(earned) && !isNaN(possible) && possible > 0
      ? Math.round((earned / possible) * 100)
      : null
  const autoLetter = pct !== null ? letterFromPercent(pct) : null
  const hasExistingGrade = assignment.pointsEarned !== undefined || !!assignment.letterGrade

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    updateAssignment(assignment!.id, {
      pointsEarned: pointsEarned !== '' ? Number(pointsEarned) : undefined,
      pointsPossible: pointsPossible !== '' ? Number(pointsPossible) : undefined,
      letterGrade: letterGrade.trim() || undefined,
      gradeFeedback: gradeFeedback.trim() || undefined,
    })
    onClose()
  }

  function handleClear() {
    updateAssignment(assignment!.id, {
      pointsEarned: undefined,
      pointsPossible: undefined,
      letterGrade: undefined,
      gradeFeedback: undefined,
    })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Record Grade" size="sm">
      {/* Assignment context chip */}
      <div className="mb-5 px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-white/[0.04] border border-slate-100 dark:border-white/[0.06]">
        <p className="text-[13px] font-medium text-slate-800 dark:text-white/80 truncate leading-snug">
          {assignment.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {course && (
            <span className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-white/35 font-medium">
              <span
                className="w-[5px] h-[5px] rounded-full shrink-0"
                style={{ backgroundColor: course.color }}
              />
              {course.name}
            </span>
          )}
          {course && (
            <span className="text-slate-200 dark:text-white/[0.09] text-[10px]">·</span>
          )}
          <span className="text-[11px] text-slate-400 dark:text-white/25">
            {formatDisplayDate(assignment.dueDate)}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Points fields */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Points Earned</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={pointsEarned}
              onChange={(e) => setPointsEarned(e.target.value)}
              className={inputCls}
              placeholder="87"
              autoFocus
            />
          </div>
          <div>
            <label className={labelCls}>Points Possible</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={pointsPossible}
              onChange={(e) => setPointsPossible(e.target.value)}
              className={inputCls}
              placeholder="100"
            />
          </div>
        </div>

        {/* Live score preview */}
        {pct !== null && (
          <div
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg border ${pctBg(pct)}`}
          >
            <span className={`text-[26px] font-bold tabular-nums leading-none ${pctColor(pct)}`}>
              {pct}%
            </span>
            {autoLetter && (
              <span className={`text-[16px] font-semibold ${pctColor(pct)}`}>{autoLetter}</span>
            )}
            <span className="text-[11px] text-slate-400 dark:text-white/25 ml-auto tabular-nums">
              {pointsEarned} / {pointsPossible} pts
            </span>
          </div>
        )}

        {/* Letter grade override */}
        <div>
          <label className={labelCls}>
            Letter Grade{' '}
            <span className="normal-case font-normal text-slate-400 dark:text-white/20">
              (optional override)
            </span>
          </label>
          <input
            value={letterGrade}
            onChange={(e) => setLetterGrade(e.target.value)}
            className={inputCls}
            placeholder={autoLetter ?? 'e.g. A, B+, 92%'}
            maxLength={10}
          />
        </div>

        {/* Feedback */}
        <div>
          <label className={labelCls}>Feedback</label>
          <textarea
            value={gradeFeedback}
            onChange={(e) => setGradeFeedback(e.target.value)}
            rows={2}
            className={`${inputCls} resize-none`}
            placeholder="Instructor feedback or your own notes…"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          {hasExistingGrade && (
            <button
              type="button"
              onClick={handleClear}
              className="text-[11px] text-slate-400 dark:text-white/25 hover:text-red-500 dark:hover:text-red-400 transition-colors duration-100 mr-auto active:scale-95"
            >
              Clear grade
            </button>
          )}
          <div className={`flex gap-2 ${hasExistingGrade ? '' : 'ml-auto'}`}>
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Grade
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
