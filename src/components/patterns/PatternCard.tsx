import { useState } from 'react'
import type { RecurringPattern } from '../../types'
import { useStore } from '../../store'
import { getCourseById } from '../../store/selectors'
import { Button } from '../ui/Button'
import { CategoryBadge, PriorityBadge } from '../ui/Badge'
import { PatternForm } from './PatternForm'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { previewPatternOccurrences } from '../../utils/recurringGenerator'
import { formatDayOfWeek, formatTimeDisplay, formatDisplayDate } from '../../utils/dateHelpers'

interface PatternCardProps {
  pattern: RecurringPattern
}

export function PatternCard({ pattern }: PatternCardProps) {
  const courses = useStore((s) => s.courses)
  const deletePattern = useStore((s) => s.deletePattern)
  const updatePattern = useStore((s) => s.updatePattern)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteGenerated, setDeleteGenerated] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)

  const course = getCourseById(courses, pattern.courseId)
  const previews = previewOpen ? previewPatternOccurrences(pattern, 6) : []

  return (
    <>
      <div className="bg-white dark:bg-[#13131e] rounded-xl border border-slate-200 dark:border-white/[0.07] p-4 hover:border-slate-300 dark:hover:border-white/[0.12] transition-colors">
        <div className="flex items-start gap-3">
          {/* Color bar */}
          {course && (
            <div
              className="w-[3px] rounded-full self-stretch mt-0.5 shrink-0 opacity-70"
              style={{ backgroundColor: course.color, minHeight: '40px' }}
            />
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-slate-900 dark:text-[#e8e8f2] text-sm">
                    {pattern.title}
                  </h3>
                  {!pattern.active && (
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/[0.06] px-1.5 py-0.5 rounded-md">
                      Paused
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                  Every <span className="font-medium text-slate-700 dark:text-slate-300">{formatDayOfWeek(pattern.dayOfWeek)}</span>
                  {' '}at{' '}
                  <span className="font-medium text-slate-700 dark:text-slate-300">{formatTimeDisplay(pattern.dueTime)}</span>
                  {pattern.endDate && (
                    <span className="text-slate-400 dark:text-slate-600"> · ends {formatDisplayDate(pattern.endDate)}</span>
                  )}
                </p>
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {course && (
                    <span
                      className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-medium text-white opacity-90"
                      style={{ backgroundColor: course.color }}
                    >
                      {course.name}
                    </span>
                  )}
                  {pattern.category && <CategoryBadge category={pattern.category} />}
                  <PriorityBadge priority={pattern.priority} />
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button size="sm" variant="ghost" onClick={() => setEditOpen(true)}>✎</Button>
                <Button size="sm" variant="ghost" onClick={() => setDeleteOpen(true)}>✕</Button>
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex items-center gap-4 mt-3 pt-2.5 border-t border-slate-100 dark:border-white/[0.05]">
              <button
                onClick={() => setPreviewOpen((p) => !p)}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium transition-colors"
              >
                {previewOpen ? '▴ Hide' : '▾ Upcoming'}
              </button>
              <button
                onClick={() => updatePattern(pattern.id, { active: !pattern.active })}
                className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium transition-colors"
              >
                {pattern.active ? 'Pause' : 'Resume'}
              </button>
            </div>
          </div>
        </div>

        {/* Preview */}
        {previewOpen && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/[0.05]">
            {previews.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-600">No upcoming occurrences.</p>
            ) : (
              <div className="grid grid-cols-2 gap-1.5">
                {previews.map((entry) => {
                  const [, dateStr] = entry.split('::')
                  return (
                    <div key={entry} className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500">
                      <span className="w-1 h-1 rounded-full bg-indigo-400/60 shrink-0" />
                      {formatDisplayDate(dateStr, pattern.dueTime)}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <PatternForm open={editOpen} onClose={() => setEditOpen(false)} pattern={pattern} />

      <ConfirmDialog
        open={deleteOpen}
        title="Delete Pattern"
        description={`Delete the pattern "${pattern.title}"?`}
        confirmLabel={deleteGenerated ? 'Delete Pattern + Assignments' : 'Delete Pattern'}
        danger
        onConfirm={() => { deletePattern(pattern.id, deleteGenerated); setDeleteOpen(false) }}
        onCancel={() => setDeleteOpen(false)}
      >
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={deleteGenerated}
            onChange={(e) => setDeleteGenerated(e.target.checked)}
            className="rounded border-slate-300 dark:border-slate-600 text-indigo-600"
          />
          Also delete all generated assignments
        </label>
      </ConfirmDialog>
    </>
  )
}
