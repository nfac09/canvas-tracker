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
  const [searchParams, setSearchParams] = useSearchParams()
  const courseParam = searchParams.get('course') ?? ''

  const [addOpen, setAddOpen] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('dueDate')
  const [sortAsc, setSortAsc] = useState(true)
  const [filters, setFilters] = useState<FilterState>({
    courseId: '',
    status: '',
    category: '',
    gradeState: '',
  })
  const [showDone, setShowDone] = useState(false)

  // courseId is always driven by the URL — no effect needed
  // Overriding filters.courseId with courseParam ensures sidebar clicks always take effect immediately
  const effectiveFilters: FilterState = { ...filters, courseId: courseParam }

  function handleFiltersChange(f: FilterState) {
    if (f.courseId !== courseParam) {
      const next = new URLSearchParams(searchParams)
      if (f.courseId) {
        next.set('course', f.courseId)
      } else {
        next.delete('course')
      }
      setSearchParams(next)
    }
    setFilters(f)
  }

  // When gradeState filter is active, we need to see done assignments
  const effectiveShowDone = showDone || !!effectiveFilters.gradeState

  const visible = useMemo(() => {
    let list = selectAllVisible(assignments)
    if (!effectiveShowDone) list = list.filter((a) => a.status !== 'done')
    if (effectiveFilters.courseId) list = list.filter((a) => a.courseId === effectiveFilters.courseId)
    if (effectiveFilters.status) list = list.filter((a) => a.status === effectiveFilters.status)
    if (effectiveFilters.category) list = list.filter((a) => a.category === effectiveFilters.category)
    if (effectiveFilters.gradeState) {
      const byGrade = (a: typeof list[0]) => a.pointsEarned !== undefined || !!a.letterGrade
      if (effectiveFilters.gradeState === 'needs_grade') {
        list = list.filter((a) => a.status === 'done' && !byGrade(a))
      } else if (effectiveFilters.gradeState === 'graded') {
        list = list.filter((a) => byGrade(a))
      }
    }

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
  }, [assignments, effectiveFilters, sortKey, sortAsc, effectiveShowDone, courses])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v)
    else { setSortKey(key); setSortAsc(true) }
  }

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button
      onClick={() => toggleSort(k)}
      className={`text-[11px] font-medium px-2.5 py-[5px] rounded-md transition-all duration-100 ease-out active:scale-[0.93]
        ${sortKey === k
          ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-sm shadow-indigo-900/25 dark:shadow-indigo-900/40'
          : 'text-slate-500 dark:text-white/35 hover:text-slate-800 dark:hover:text-white/70 hover:bg-slate-100/80 dark:hover:bg-white/[0.07]'
        }`}
    >
      {label}{sortKey === k ? (sortAsc ? ' ↑' : ' ↓') : ''}
    </button>
  )

  return (
    <div>
      {/* ─────────────────────────────────────────────────────────────
          Sticky 2-tier header
          Tier 1: identity + primary action
          Tier 2: all controls (filters + sort + count)
      ──────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-slate-50 dark:bg-[#0d0d13] border-b border-slate-200 dark:border-white/[0.06]">
        {/* Tier 1 — identity row */}
        <div className="px-7 pt-4 pb-3 flex items-center justify-between gap-6">
          <div className="min-w-0">
            <h1 className="text-[15px] font-semibold tracking-tight text-slate-900 dark:text-white/88 leading-none">
              All Assignments
            </h1>
            <p className="text-[11px] text-slate-400 dark:text-white/28 mt-[5px] tabular-nums">
              {visible.length} {visible.length !== 1 ? 'items' : 'item'}
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}>
            + Add Assignment
          </Button>
        </div>

        {/* Tier 2 — controls row */}
        <div className="px-7 py-[9px] border-t border-slate-100 dark:border-white/[0.04] bg-slate-50/60 dark:bg-black/[0.12] flex items-center gap-3 flex-wrap">
          {/* Filters */}
          <AssignmentFilters filters={effectiveFilters} onChange={handleFiltersChange} showCategory showGradeFilter />

          {/* Divider */}
          <div className="w-px h-4 bg-slate-200 dark:bg-white/[0.08] shrink-0" />

          {/* Show completed */}
          <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={effectiveShowDone}
              onChange={(e) => setShowDone(e.target.checked)}
              disabled={!!effectiveFilters.gradeState}
              className="w-3.5 h-3.5 rounded border-slate-300 dark:border-white/[0.15] text-indigo-600 focus:ring-indigo-500/40 bg-white dark:bg-white/[0.04] disabled:opacity-50"
            />
            <span className="text-[11px] font-medium text-slate-500 dark:text-white/35 select-none">
              Completed
            </span>
          </label>

          {/* Divider */}
          <div className="w-px h-4 bg-slate-200 dark:bg-white/[0.08] shrink-0" />

          {/* Sort */}
          <div className="flex items-center gap-0.5 shrink-0">
            <span className="text-[10px] font-semibold text-slate-400 dark:text-white/20 uppercase tracking-widest mr-1.5">
              Sort
            </span>
            <SortBtn k="dueDate" label="Due Date" />
            <SortBtn k="priority" label="Priority" />
            <SortBtn k="course" label="Course" />
            <SortBtn k="status" label="Status" />
          </div>
        </div>
      </div>

      {/* Assignment list */}
      <div className="px-7 pt-4 pb-10 max-w-3xl">
        {visible.length === 0 ? (
          <EmptyState
            icon="○"
            title="No assignments found"
            description="Try adjusting your filters or add a new assignment."
            action={{ label: '+ Add Assignment', onClick: () => setAddOpen(true) }}
          />
        ) : (
          <div className="space-y-1">
            {visible.map((a) => <AssignmentCard key={a.id} assignment={a} />)}
          </div>
        )}
      </div>

      <AssignmentForm open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}
