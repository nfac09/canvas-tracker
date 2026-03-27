import type { AssignmentStatus, AssignmentCategory } from '../../types'
import { useStore } from '../../store'

export type GradeFilterState = '' | 'needs_grade' | 'graded'

export interface FilterState {
  courseId: string
  status: AssignmentStatus | ''
  category: AssignmentCategory | ''
  gradeState: GradeFilterState
}

interface AssignmentFiltersProps {
  filters: FilterState
  onChange: (f: FilterState) => void
  showCategory?: boolean
  showGradeFilter?: boolean
}

const statusOptions: { value: AssignmentStatus | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'not_started', label: 'Not started' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
]

const categoryOptions: { value: AssignmentCategory | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'homework', label: 'HW' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'exam', label: 'Exam' },
  { value: 'lab', label: 'Lab' },
  { value: 'discussion', label: 'Discussion' },
  { value: 'other', label: 'Other' },
]

// Base pill: shared classes for all states
const pillBase =
  'text-[11px] font-medium px-2.5 py-[5px] rounded-md cursor-pointer select-none ' +
  'transition-all duration-100 ease-out ' +
  'active:scale-[0.93]'

// Active: filled indigo with subtle shadow
const pillActive =
  'bg-indigo-600 dark:bg-indigo-500 text-white shadow-sm shadow-indigo-900/25 dark:shadow-indigo-900/40'

// Inactive: ghost, brightens on hover
const pillInactive =
  'text-slate-500 dark:text-white/35 ' +
  'hover:text-slate-800 dark:hover:text-white/70 ' +
  'hover:bg-slate-100/80 dark:hover:bg-white/[0.07]'

const gradeOptions: { value: GradeFilterState; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'needs_grade', label: 'Needs Grade' },
  { value: 'graded', label: 'Graded' },
]

export function AssignmentFilters({ filters, onChange, showCategory = false, showGradeFilter = false }: AssignmentFiltersProps) {
  const courses = useStore((s) => s.courses)
  const active = !!(filters.courseId || filters.status || filters.category || filters.gradeState)

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Course selector */}
      {courses.length > 0 && (
        <div className="relative shrink-0">
          <select
            value={filters.courseId}
            onChange={(e) => onChange({ ...filters, courseId: e.target.value })}
            className="
              appearance-none text-[11px] font-medium rounded-md cursor-pointer
              border border-slate-200 dark:border-white/[0.1]
              bg-white dark:bg-white/[0.05]
              text-slate-600 dark:text-white/55
              py-[5px] pl-2.5 pr-7
              transition-all duration-150
              hover:border-slate-300 dark:hover:border-white/[0.16]
              hover:bg-slate-50 dark:hover:bg-white/[0.07]
              focus:outline-none focus:ring-1 focus:ring-indigo-500/40 focus:border-indigo-500/50
            "
          >
            <option value="">All courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/25 text-[9px]">
            ▾
          </span>
        </div>
      )}

      {/* Divider */}
      {courses.length > 0 && (
        <div className="w-px h-4 bg-slate-200 dark:bg-white/[0.08] shrink-0" />
      )}

      {/* Status pills */}
      <div className="flex items-center gap-0.5">
        {statusOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange({ ...filters, status: opt.value })}
            className={`${pillBase} ${filters.status === opt.value ? pillActive : pillInactive}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Category pills */}
      {showCategory && (
        <>
          <div className="w-px h-4 bg-slate-200 dark:bg-white/[0.08] shrink-0" />
          <div className="flex items-center gap-0.5 flex-wrap">
            {categoryOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() =>
                  onChange({ ...filters, category: opt.value as AssignmentCategory | '' })
                }
                className={`${pillBase} ${filters.category === opt.value ? pillActive : pillInactive}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Grade state pills */}
      {showGradeFilter && (
        <>
          <div className="w-px h-4 bg-slate-200 dark:bg-white/[0.08] shrink-0" />
          <div className="flex items-center gap-0.5">
            {gradeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onChange({ ...filters, gradeState: opt.value })}
                className={`${pillBase} ${filters.gradeState === opt.value ? pillActive : pillInactive}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Clear */}
      {active && (
        <>
          <div className="w-px h-4 bg-slate-200 dark:bg-white/[0.08] shrink-0" />
          <button
            onClick={() => onChange({ courseId: '', status: '', category: '', gradeState: '' })}
            className="
              text-[11px] font-medium tabular-nums
              text-slate-400 dark:text-white/25
              hover:text-slate-700 dark:hover:text-white/55
              transition-all duration-100
              active:scale-95
            "
          >
            Clear ×
          </button>
        </>
      )}
    </div>
  )
}

export function applyFilters(
  assignments: ReturnType<typeof useStore.getState>['assignments'],
  filters: FilterState,
) {
  return assignments.filter((a) => {
    if (filters.courseId && a.courseId !== filters.courseId) return false
    if (filters.status && a.status !== filters.status) return false
    if (filters.category && a.category !== filters.category) return false
    if (filters.gradeState) {
      const hasGrade = a.pointsEarned !== undefined || !!a.letterGrade
      if (filters.gradeState === 'needs_grade' && hasGrade) return false
      if (filters.gradeState === 'graded' && !hasGrade) return false
    }
    return true
  })
}
