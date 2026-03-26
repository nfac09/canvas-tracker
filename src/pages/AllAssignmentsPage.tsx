import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStore } from '../store'
import { selectAllVisible } from '../store/selectors'
import { AssignmentCard } from '../components/assignments/AssignmentCard'
import {
  AssignmentFilters,
  type FilterState,
} from '../components/assignments/AssignmentFilters'
import { AssignmentForm } from '../components/assignments/AssignmentForm'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'

type SortKey = 'dueDate' | 'priority' | 'course' | 'status'

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 }
const STATUS_ORDER = { not_started: 0, in_progress: 1, done: 2 }

export function AllAssignmentsPage() {
  const assignments = useStore((s) => s.assignments)
  const courses = useStore((s) => s.courses)
  const [searchParams] = useSearchParams()
  const defaultCourse = searchParams.get('course') ?? ''

  const [addOpen, setAddOpen] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('dueDate')
  const [sortAsc, setSortAsc] = useState(true)
  const [filters, setFilters] = useState<FilterState>({
    courseId: defaultCourse,
    status: '',
    category: '',
  })
  const [showDone, setShowDone] = useState(false)

  const visible = useMemo(() => {
    let list = selectAllVisible(assignments)
    if (!showDone) list = list.filter((a) => a.status !== 'done')
    if (filters.courseId) list = list.filter((a) => a.courseId === filters.courseId)
    if (filters.status) list = list.filter((a) => a.status === filters.status)
    if (filters.category) list = list.filter((a) => a.category === filters.category)

    list = [...list].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'dueDate') cmp = a.dueDate.localeCompare(b.dueDate)
      else if (sortKey === 'priority') cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
      else if (sortKey === 'status') cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
      else if (sortKey === 'course') {
        const ca = courses.find((c) => c.id === a.courseId)?.name ?? ''
        const cb = courses.find((c) => c.id === b.courseId)?.name ?? ''
        cmp = ca.localeCompare(cb)
      }
      return sortAsc ? cmp : -cmp
    })
    return list
  }, [assignments, filters, sortKey, sortAsc, showDone, courses])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v)
    else { setSortKey(key); setSortAsc(true) }
  }

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button
      onClick={() => toggleSort(k)}
      className={`text-xs px-2.5 py-1 rounded-lg border transition-colors
        ${sortKey === k
          ? 'bg-indigo-600 dark:bg-indigo-500 text-white border-transparent'
          : 'border-slate-200 dark:border-white/[0.1] text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-700 dark:hover:text-slate-200'
        }`}
    >
      {label} {sortKey === k ? (sortAsc ? '↑' : '↓') : ''}
    </button>
  )

  return (
    <div className="px-8 py-8 max-w-3xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          All Assignments
        </h1>
        <Button variant="primary" onClick={() => setAddOpen(true)}>
          + Add Assignment
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <AssignmentFilters filters={filters} onChange={setFilters} showCategory />
        <label className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 cursor-pointer">
          <input
            type="checkbox"
            checked={showDone}
            onChange={(e) => setShowDone(e.target.checked)}
            className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500/50"
          />
          Show completed
        </label>
      </div>

      {/* Sort controls */}
      <div className="flex items-center gap-1.5 mb-5">
        <span className="text-xs text-slate-400 dark:text-slate-500 mr-1">Sort:</span>
        <SortBtn k="dueDate" label="Due Date" />
        <SortBtn k="priority" label="Priority" />
        <SortBtn k="course" label="Course" />
        <SortBtn k="status" label="Status" />
      </div>

      {/* Count */}
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
        {visible.length} assignment{visible.length !== 1 ? 's' : ''}
      </p>

      {visible.length === 0 ? (
        <EmptyState
          icon="○"
          title="No assignments found"
          description="Try adjusting your filters or add a new assignment."
          action={{ label: '+ Add Assignment', onClick: () => setAddOpen(true) }}
        />
      ) : (
        <div className="space-y-2">
          {visible.map((a) => <AssignmentCard key={a.id} assignment={a} />)}
        </div>
      )}

      <AssignmentForm open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}
