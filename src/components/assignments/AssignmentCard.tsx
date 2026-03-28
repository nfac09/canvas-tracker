import { useState } from 'react'
import type { Assignment } from '../../types'
import { useStore } from '../../store'
import { getCourseById } from '../../store/selectors'
import { CategoryBadge, PriorityDot, GradeBadge } from '../ui/Badge'
import { formatDisplayDate, isOverdue } from '../../utils/dateHelpers'
import { AssignmentForm } from './AssignmentForm'
import { GradeEntryModal } from './GradeEntryModal'
import { ConfirmDialog } from '../ui/ConfirmDialog'

interface AssignmentCardProps {
  assignment: Assignment
  selectable?: boolean
  selected?: boolean
  onToggleSelect?: (e: React.MouseEvent) => void
}

export function AssignmentCard({ assignment, selectable = false, selected = false, onToggleSelect }: AssignmentCardProps) {
  const courses = useStore((s) => s.courses)
  const setStatus = useStore((s) => s.setStatus)
  const deleteAssignment = useStore((s) => s.deleteAssignment)
  const skipOccurrence = useStore((s) => s.skipOccurrence)

  const [editOpen, setEditOpen] = useState(false)
  const [gradeOpen, setGradeOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [skipOpen, setSkipOpen] = useState(false)

  const course = getCourseById(courses, assignment.courseId)
  const overdue = isOverdue(assignment.dueDate) && assignment.status !== 'done'
  const done = assignment.status === 'done'
  const inProgress = assignment.status === 'in_progress'
  const hasGrade = assignment.pointsEarned !== undefined || assignment.letterGrade

  return (
    <>
      <div
        className={`
          group relative flex items-stretch rounded-lg border
          transition-all duration-150 ease-out
          ${!selectable ? 'hover:-translate-y-px' : ''}
          ${selected
            ? 'border-indigo-400/70 dark:border-indigo-500/40 bg-indigo-50/50 dark:bg-indigo-500/[0.08] shadow-none'
            : done
            ? 'opacity-40 border-slate-100 dark:border-white/[0.04] bg-transparent shadow-none'
            : overdue
            ? `border-red-200/60 dark:border-red-500/20
               bg-red-50/40 dark:bg-red-950/[0.12]
               shadow-[0_1px_3px_rgba(239,68,68,0.08)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.4)]
               hover:border-red-300/60 dark:hover:border-red-500/30
               hover:bg-red-50/60 dark:hover:bg-red-950/[0.18]
               hover:shadow-[0_4px_12px_rgba(239,68,68,0.12)] dark:hover:shadow-[0_6px_16px_rgba(0,0,0,0.5)]`
            : `border-slate-200 dark:border-white/[0.08]
               bg-white dark:bg-[#111119]
               shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.35)]
               hover:border-slate-300/70 dark:hover:border-white/[0.13]
               hover:bg-white dark:hover:bg-[#141422]
               hover:shadow-[0_4px_12px_rgba(0,0,0,0.09)] dark:hover:shadow-[0_6px_16px_rgba(0,0,0,0.5)]`
          }
        `}
      >
        {/* Course color left accent */}
        {course && !done && (
          <span
            className="absolute left-0 top-0 bottom-0 w-[2px] rounded-l-lg"
            style={{ backgroundColor: course.color }}
          />
        )}

        {/* ── Zone 1: Selection checkbox or status toggle ──── */}
        <div className="w-9 flex items-center justify-center shrink-0">
          {selectable ? (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleSelect?.(e) }}
              className={`
                w-[15px] h-[15px] rounded-[3px] border-[1.5px] flex items-center justify-center shrink-0
                transition-all duration-100 ease-out active:scale-75
                ${selected
                  ? 'bg-indigo-500 border-indigo-500 text-white shadow-sm shadow-indigo-500/30'
                  : 'border-slate-300 dark:border-white/[0.2] hover:border-indigo-400 dark:hover:border-indigo-500/70 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/[0.07]'
                }
              `}
              aria-label={selected ? 'Deselect' : 'Select'}
            >
              {selected && <span className="text-[7px] leading-none font-bold">✓</span>}
            </button>
          ) : (
            <button
              onClick={() => setStatus(assignment.id, done ? 'not_started' : 'done')}
              className={`
                w-[15px] h-[15px] rounded-full border-[1.5px] flex items-center justify-center shrink-0
                transition-all duration-100 ease-out
                active:scale-75
                ${done
                  ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                  : overdue
                  ? 'border-red-400/70 dark:border-red-600/60 hover:border-red-500 dark:hover:border-red-500/80 hover:bg-red-50 dark:hover:bg-red-500/10'
                  : inProgress
                  ? 'border-indigo-400 dark:border-indigo-500/80 bg-indigo-50 dark:bg-indigo-500/10 hover:border-indigo-500'
                  : 'border-slate-300 dark:border-white/[0.2] hover:border-indigo-400 dark:hover:border-indigo-500/70 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/[0.07]'
                }
              `}
              aria-label={done ? 'Mark as not done' : 'Mark as done'}
            >
              {done && <span className="text-[7px] leading-none font-bold">✓</span>}
              {inProgress && !done && <span className="w-[5px] h-[5px] rounded-full bg-indigo-400" />}
            </button>
          )}
        </div>

        {/* ── Zone 2: Content ─────────────────────────────────── */}
        <div
          className={`flex-1 min-w-0 py-[9px] pr-3 ${selectable ? 'cursor-pointer' : ''}`}
          onClick={selectable ? (e) => onToggleSelect?.(e) : undefined}
        >
          {/* Row 1: Title */}
          <div className="flex items-center gap-1.5 mb-[3px]">
            <PriorityDot priority={assignment.priority} />
            <p
              className={`text-[13px] font-medium leading-[1.3] truncate
                ${done
                  ? 'line-through text-slate-400 dark:text-slate-600'
                  : 'text-slate-900 dark:text-white/85'
                }`}
            >
              {assignment.title}
            </p>
          </div>

          {/* Row 2: Metadata */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {course && (
              <span className="flex items-center gap-[5px] text-[11px] text-slate-500 dark:text-white/30 font-medium shrink-0">
                <span
                  className="w-[5px] h-[5px] rounded-full shrink-0"
                  style={{ backgroundColor: course.color }}
                />
                {course.name}
              </span>
            )}
            {assignment.contextLabel && (
              <>
                <span className="text-slate-200 dark:text-white/[0.09] text-[10px]">·</span>
                <span className="text-[11px] text-slate-400 dark:text-white/20 shrink-0">
                  {assignment.contextLabel}
                </span>
              </>
            )}
            {assignment.category && (
              <>
                <span className="text-slate-200 dark:text-white/[0.09] text-[10px]">·</span>
                <CategoryBadge category={assignment.category} />
              </>
            )}
            {inProgress && (
              <>
                <span className="text-slate-200 dark:text-white/[0.09] text-[10px]">·</span>
                <span className="text-[10px] font-medium text-indigo-500 dark:text-indigo-400">
                  In progress
                </span>
              </>
            )}
            {hasGrade && (
              <>
                <span className="text-slate-200 dark:text-white/[0.09] text-[10px]">·</span>
                <GradeBadge
                  pointsEarned={assignment.pointsEarned}
                  pointsPossible={assignment.pointsPossible}
                  letterGrade={assignment.letterGrade}
                />
              </>
            )}
            {assignment.recurringPatternId && (
              <span
                className="text-[10px] text-slate-300 dark:text-white/[0.18] ml-0.5"
                title="Recurring"
              >
                ↺
              </span>
            )}
          </div>

          {assignment.notes && !done && (
            <p className="text-[11px] text-slate-400 dark:text-white/20 mt-0.5 line-clamp-1 leading-relaxed">
              {assignment.notes}
            </p>
          )}
        </div>

        {/* ── Zone 3: Date + actions ──────────────────────────── */}
        <div
          className={`flex items-center gap-2 pl-3 pr-3 self-stretch shrink-0 border-l
            ${overdue
              ? 'border-red-200/40 dark:border-red-500/[0.12]'
              : 'border-slate-100 dark:border-white/[0.05]'
            }
          `}
        >
          {/* Due date — always visible */}
          <span
            className={`text-[11px] font-medium tabular-nums whitespace-nowrap w-[76px] text-right
              ${overdue
                ? 'text-red-500 dark:text-red-400'
                : 'text-slate-400 dark:text-white/28'
              }`}
          >
            {overdue ? '⚠ ' : ''}
            {formatDisplayDate(assignment.dueDate, assignment.dueTime)}
          </span>

          {/* Action buttons — hidden in selection mode, slide in on hover otherwise */}
          <div className={`flex items-center gap-0.5 transition-[opacity,transform] duration-150 ease-out shrink-0 ${selectable ? 'opacity-0 pointer-events-none' : 'opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0'}`}>
            {done && (
              <button
                onClick={() => setGradeOpen(true)}
                className={`p-[5px] rounded-md transition-all duration-100 text-[11px] leading-none active:scale-90
                  ${hasGrade
                    ? 'text-indigo-400 dark:text-indigo-400/70 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 active:bg-indigo-100 dark:active:bg-indigo-500/20'
                    : 'text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-500/15 active:bg-indigo-100 dark:active:bg-indigo-500/25'
                  }`}
                title={hasGrade ? 'Edit grade' : 'Record grade'}
              >
                ◎
              </button>
            )}
            <button
              onClick={() => setEditOpen(true)}
              className="p-[5px] rounded-md transition-all duration-100
                text-slate-400 dark:text-white/20
                hover:text-slate-700 dark:hover:text-white/70
                hover:bg-slate-100 dark:hover:bg-white/[0.08]
                active:scale-90 active:bg-slate-200 dark:active:bg-white/[0.12]
                text-[11px] leading-none"
              title="Edit"
            >
              ✎
            </button>
            {assignment.recurringPatternId && !done && (
              <button
                onClick={() => setSkipOpen(true)}
                className="p-[5px] rounded-md transition-all duration-100
                  text-slate-400 dark:text-white/20
                  hover:text-amber-600 dark:hover:text-amber-400
                  hover:bg-amber-50 dark:hover:bg-amber-500/10
                  active:scale-90 active:bg-amber-100 dark:active:bg-amber-500/20
                  text-[11px] leading-none"
                title="Skip this week"
              >
                ⊘
              </button>
            )}
            <button
              onClick={() => setDeleteOpen(true)}
              className="p-[5px] rounded-md transition-all duration-100
                text-slate-400 dark:text-white/20
                hover:text-red-600 dark:hover:text-red-400
                hover:bg-red-50 dark:hover:bg-red-500/10
                active:scale-90 active:bg-red-100 dark:active:bg-red-500/20
                text-[11px] leading-none"
              title="Delete"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      <AssignmentForm open={editOpen} onClose={() => setEditOpen(false)} assignment={assignment} />
      <GradeEntryModal open={gradeOpen} onClose={() => setGradeOpen(false)} assignment={assignment} />

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
