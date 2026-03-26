import { useState } from 'react'
import type { Assignment } from '../../types'
import { useStore } from '../../store'
import { getCourseById } from '../../store/selectors'
import { CategoryBadge, PriorityDot, GradeBadge } from '../ui/Badge'
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
  const hasGrade = assignment.pointsEarned !== undefined || assignment.letterGrade

  return (
    <>
      <div
        className={`group flex items-start gap-3 px-4 py-3.5 rounded-xl border transition-colors
          ${done
            ? 'opacity-50 border-slate-100 dark:border-white/[0.04] bg-slate-50 dark:bg-transparent'
            : overdue
            ? 'border-red-200/80 dark:border-red-500/20 bg-red-50/50 dark:bg-red-950/[0.15] hover:bg-red-50/80 dark:hover:bg-red-950/20'
            : 'border-slate-200 dark:border-white/[0.07] bg-white dark:bg-[#13131e] hover:border-slate-300/80 dark:hover:border-white/[0.11] hover:bg-slate-50/60 dark:hover:bg-[#17172a]/50'
          }`}
      >
        {/* Checkbox */}
        <button
          onClick={() => setStatus(assignment.id, done ? 'not_started' : 'done')}
          className={`mt-0.5 w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
            ${done
              ? 'bg-emerald-500 border-emerald-500 text-white'
              : overdue
              ? 'border-red-300 dark:border-red-700/60 hover:border-red-500'
              : 'border-slate-300 dark:border-white/[0.18] hover:border-indigo-400 dark:hover:border-indigo-500/70'
            }`}
          aria-label={done ? 'Mark as not done' : 'Mark as done'}
        >
          {done && <span className="text-[9px] leading-none">✓</span>}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <PriorityDot priority={assignment.priority} />
              <p className={`text-sm font-medium leading-snug truncate
                ${done
                  ? 'line-through text-slate-400 dark:text-slate-600'
                  : 'text-slate-900 dark:text-[#e8e8f2]'
                }`}>
                {assignment.title}
              </p>
            </div>

            {/* Actions — visible on hover */}
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0 transition-opacity">
              {assignment.status !== 'done' && (
                <select
                  value={assignment.status}
                  onChange={(e) => setStatus(assignment.id, e.target.value as Assignment['status'])}
                  className="text-xs border-slate-200 dark:border-white/[0.1] rounded-md py-0.5 px-1 text-slate-600 dark:text-slate-400 bg-white dark:bg-white/[0.06] focus:ring-indigo-500/50 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              )}
              <button
                onClick={() => setEditOpen(true)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.07] transition-colors text-xs"
                title="Edit"
              >
                ✎
              </button>
              {assignment.recurringPatternId && !done && (
                <button
                  onClick={() => setSkipOpen(true)}
                  className="p-1 rounded-md text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors text-xs"
                  title="Skip this week"
                >
                  ⊘
                </button>
              )}
              <button
                onClick={() => setDeleteOpen(true)}
                className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-xs"
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
                className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-medium text-white opacity-90"
                style={{ backgroundColor: course.color }}
              >
                {course.name}
              </span>
            )}
            {assignment.category && <CategoryBadge category={assignment.category} />}
            <span className={`text-[11px] font-medium
              ${overdue
                ? 'text-red-500 dark:text-red-400'
                : 'text-slate-400 dark:text-slate-500'
              }`}>
              {overdue && '⚠ '}
              {formatDisplayDate(assignment.dueDate, assignment.dueTime)}
            </span>
            {assignment.recurringPatternId && (
              <span className="text-[11px] text-slate-300 dark:text-slate-600">↺</span>
            )}
            {hasGrade && (
              <GradeBadge
                pointsEarned={assignment.pointsEarned}
                pointsPossible={assignment.pointsPossible}
                letterGrade={assignment.letterGrade}
              />
            )}
          </div>

          {assignment.notes && (
            <p className="text-[11px] text-slate-400 dark:text-slate-600 mt-1 line-clamp-1 italic leading-relaxed">
              {assignment.notes}
            </p>
          )}
        </div>
      </div>

      <AssignmentForm open={editOpen} onClose={() => setEditOpen(false)} assignment={assignment} />

      <ConfirmDialog
        open={deleteOpen}
        title="Delete Assignment"
        description={`Delete "${assignment.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={() => { deleteAssignment(assignment.id); setDeleteOpen(false) }}
        onCancel={() => setDeleteOpen(false)}
      />

      <ConfirmDialog
        open={skipOpen}
        title="Skip This Week"
        description="This will hide this week's occurrence. The pattern will continue in future weeks."
        confirmLabel="Skip"
        onConfirm={() => { skipOccurrence(assignment.id); setSkipOpen(false) }}
        onCancel={() => setSkipOpen(false)}
      />
    </>
  )
}
