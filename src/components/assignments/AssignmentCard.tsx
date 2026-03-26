import { useState } from 'react'
import type { Assignment } from '../../types'
import { useStore } from '../../store'
import { getCourseById } from '../../store/selectors'
import { CategoryBadge, PriorityBadge } from '../ui/Badge'
import { formatDisplayDate, isOverdue } from '../../utils/dateHelpers'
import { AssignmentForm } from './AssignmentForm'
import { ConfirmDialog } from '../ui/ConfirmDialog'

interface AssignmentCardProps {
  assignment: Assignment
}

export function AssignmentCard({ assignment }: AssignmentCardProps) {
  const courses = useStore((s) => s.courses)
  const setStatus = useStore((s) => s.setStatus)
  const deleteAssignment = useStore((s) => s.deleteAssignment)
  const skipOccurrence = useStore((s) => s.skipOccurrence)

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [skipOpen, setSkipOpen] = useState(false)

  const course = getCourseById(courses, assignment.courseId)
  const overdue = isOverdue(assignment.dueDate) && assignment.status !== 'done'
  const done = assignment.status === 'done'

  return (
    <>
      <div
        className={`group flex items-start gap-3 p-3 rounded-xl border transition-all
          ${done ? 'border-gray-100 bg-gray-50 opacity-60' : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'}
          ${overdue ? 'border-red-200 bg-red-50' : ''}`}
      >
        {/* Checkbox */}
        <button
          onClick={() =>
            setStatus(assignment.id, done ? 'not_started' : 'done')
          }
          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
            ${done
              ? 'bg-green-500 border-green-500 text-white'
              : overdue
              ? 'border-red-300 hover:border-red-500'
              : 'border-gray-300 hover:border-indigo-500'
            }`}
          aria-label={done ? 'Mark as not done' : 'Mark as done'}
        >
          {done && <span className="text-xs">✓</span>}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm font-medium leading-snug ${done ? 'line-through text-gray-400' : 'text-gray-900'}`}>
              {assignment.title}
            </p>
            {/* Actions */}
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0 transition-opacity">
              {assignment.status !== 'done' && (
                <select
                  value={assignment.status}
                  onChange={(e) => setStatus(assignment.id, e.target.value as Assignment['status'])}
                  className="text-xs border-gray-200 rounded-md py-0.5 text-gray-600 focus:ring-indigo-500"
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              )}
              <button
                onClick={() => setEditOpen(true)}
                className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                title="Edit"
              >
                ✎
              </button>
              {assignment.recurringPatternId && !done && (
                <button
                  onClick={() => setSkipOpen(true)}
                  className="p-1 rounded text-gray-400 hover:text-amber-600 hover:bg-amber-50"
                  title="Skip this week"
                >
                  ⊘
                </button>
              )}
              <button
                onClick={() => setDeleteOpen(true)}
                className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50"
                title="Delete"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            {course && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: course.color }}
              >
                {course.name}
              </span>
            )}
            {assignment.category && <CategoryBadge category={assignment.category} />}
            <PriorityBadge priority={assignment.priority} />
            <span className={`text-xs ${overdue ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
              {overdue && '⚠ '}
              {formatDisplayDate(assignment.dueDate, assignment.dueTime)}
            </span>
            {assignment.recurringPatternId && (
              <span className="text-xs text-gray-400">↺ Recurring</span>
            )}
            {assignment.source === 'canvas_import' && (
              <span className="text-xs text-gray-400">Canvas</span>
            )}
          </div>

          {assignment.notes && (
            <p className="text-xs text-gray-400 mt-1 line-clamp-1">{assignment.notes}</p>
          )}
        </div>
      </div>

      <AssignmentForm
        open={editOpen}
        onClose={() => setEditOpen(false)}
        assignment={assignment}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="Delete Assignment"
        description={`Are you sure you want to delete "${assignment.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={() => {
          deleteAssignment(assignment.id)
          setDeleteOpen(false)
        }}
        onCancel={() => setDeleteOpen(false)}
      />

      <ConfirmDialog
        open={skipOpen}
        title="Skip This Week"
        description="This will hide this week's occurrence. The recurring pattern will continue in future weeks."
        confirmLabel="Skip"
        onConfirm={() => {
          skipOccurrence(assignment.id)
          setSkipOpen(false)
        }}
        onCancel={() => setSkipOpen(false)}
      />
    </>
  )
}
