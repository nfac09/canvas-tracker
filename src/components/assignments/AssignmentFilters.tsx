import type { AssignmentStatus, AssignmentCategory } from '../../types'
import { useStore } from '../../store'

export interface FilterState {
  courseId: string
  status: AssignmentStatus | ''
  category: AssignmentCategory | ''
}

interface AssignmentFiltersProps {
  filters: FilterState
  onChange: (f: FilterState) => void
  showCategory?: boolean
}

const statuses: { value: AssignmentStatus | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
]

const categories: { value: AssignmentCategory | ''; label: string }[] = [
  { value: '', label: 'All categories' },
  { value: 'discussion', label: 'Discussion' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'lab', label: 'Lab' },
  { value: 'exam', label: 'Exam' },
  { value: 'homework', label: 'Homework' },
  { value: 'other', label: 'Other' },
]

const selectCls = 'text-sm rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 py-1.5 focus:ring-indigo-500 focus:border-indigo-500'

export function AssignmentFilters({ filters, onChange, showCategory = false }: AssignmentFiltersProps) {
  const courses = useStore((s) => s.courses)
  const active = !!(filters.courseId || filters.status || filters.category)

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={filters.courseId}
        onChange={(e) => onChange({ ...filters, courseId: e.target.value })}
        className={selectCls}
      >
        <option value="">All courses</option>
        {courses.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      <select
        value={filters.status}
        onChange={(e) => onChange({ ...filters, status: e.target.value as AssignmentStatus | '' })}
        className={selectCls}
      >
        {statuses.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>

      {showCategory && (
        <select
          value={filters.category}
          onChange={(e) => onChange({ ...filters, category: e.target.value as AssignmentCategory | '' })}
          className={selectCls}
        >
          {categories.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      )}

      {active && (
        <button
          onClick={() => onChange({ courseId: '', status: '', category: '' })}
          className="text-xs font-medium text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          Clear
        </button>
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
    return true
  })
}
