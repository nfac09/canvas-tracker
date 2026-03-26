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
      <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-semibold text-gray-900 text-sm">{pattern.title}</h3>
              {!pattern.active && (
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  Inactive
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {course && (
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: course.color }}
                >
                  {course.name}
                </span>
              )}
              {pattern.category && <CategoryBadge category={pattern.category} />}
              <PriorityBadge priority={pattern.priority} />
            </div>
            <p className="text-xs text-gray-500 mt-1.5">
              Every <strong>{formatDayOfWeek(pattern.dayOfWeek)}</strong> at{' '}
              <strong>{formatTimeDisplay(pattern.dueTime)}</strong>
              {pattern.endDate && ` · ends ${formatDisplayDate(pattern.endDate)}`}
            </p>
          </div>

          <div className="flex flex-col gap-1.5 items-end shrink-0">
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => setEditOpen(true)}>✎</Button>
              <Button size="sm" variant="ghost" onClick={() => setDeleteOpen(true)}>✕</Button>
            </div>
            <button
              onClick={() => setPreviewOpen((p) => !p)}
              className="text-xs text-indigo-600 hover:text-indigo-800"
            >
              {previewOpen ? '▲ Hide preview' : '▼ Preview upcoming'}
            </button>
            <button
              onClick={() => updatePattern(pattern.id, { active: !pattern.active })}
              className={`text-xs font-medium ${pattern.active ? 'text-gray-400 hover:text-gray-700' : 'text-indigo-600 hover:text-indigo-800'}`}
            >
              {pattern.active ? 'Pause' : 'Resume'}
            </button>
          </div>
        </div>

        {previewOpen && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-2">Upcoming occurrences</p>
            {previews.length === 0 ? (
              <p className="text-xs text-gray-400">No upcoming occurrences.</p>
            ) : (
              <div className="space-y-1">
                {previews.map((entry) => {
                  const [, dateStr] = entry.split('::')
                  return (
                    <div key={entry} className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="w-2 h-2 rounded-full bg-indigo-400" />
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
        description={`Delete the pattern "${pattern.title}"? Choose whether to also remove generated assignments.`}
        confirmLabel={deleteGenerated ? 'Delete Pattern + Assignments' : 'Delete Pattern'}
        danger
        onConfirm={() => {
          deletePattern(pattern.id, deleteGenerated)
          setDeleteOpen(false)
        }}
        onCancel={() => setDeleteOpen(false)}
      >
        <label className="flex items-center gap-2 text-sm text-gray-700 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={deleteGenerated}
            onChange={(e) => setDeleteGenerated(e.target.checked)}
            className="rounded border-gray-300 text-indigo-600"
          />
          Also delete all generated assignments
        </label>
      </ConfirmDialog>
    </>
  )
}
