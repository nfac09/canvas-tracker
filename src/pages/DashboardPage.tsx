import { useState } from 'react'
import { useStore } from '../store'
import {
  selectOverdue,
  selectDueToday,
  selectDueThisWeek,
  selectUpcoming,
} from '../store/selectors'
import { AssignmentList } from '../components/assignments/AssignmentList'
import {
  AssignmentFilters,
  applyFilters,
  type FilterState,
} from '../components/assignments/AssignmentFilters'
import { AssignmentForm } from '../components/assignments/AssignmentForm'
import { Button } from '../components/ui/Button'

export function DashboardPage() {
  const assignments = useStore((s) => s.assignments)
  const [addOpen, setAddOpen] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    courseId: '',
    status: '',
    category: '',
  })

  const filtered = applyFilters(assignments, filters)

  const overdue = selectOverdue(filtered)
  const today = selectDueToday(filtered)
  const thisWeek = selectDueThisWeek(filtered)
  const upcoming = selectUpcoming(filtered)

  const totalPending = overdue.length + today.length + thisWeek.length

  return (
    <div className="px-8 py-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
            {totalPending === 0
              ? 'All caught up'
              : `${totalPending} assignment${totalPending !== 1 ? 's' : ''} need attention`}
          </p>
        </div>
        <Button variant="primary" onClick={() => setAddOpen(true)}>
          + Add Assignment
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-8">
        <AssignmentFilters filters={filters} onChange={setFilters} />
      </div>

      {/* Sections */}
      <AssignmentList
        assignments={overdue}
        sectionTitle="Overdue"
        badge={overdue.length}
        badgeColor="#ef4444"
        collapsible
        defaultCollapsed={false}
        emptyTitle="No overdue assignments"
      />

      <AssignmentList
        assignments={today}
        sectionTitle="Due Today"
        badge={today.length}
        badgeColor="#f97316"
        collapsible
        defaultCollapsed={false}
        emptyTitle="Nothing due today"
      />

      <AssignmentList
        assignments={thisWeek}
        sectionTitle="Due This Week"
        badge={thisWeek.length}
        badgeColor="#6366f1"
        collapsible
        defaultCollapsed={false}
        emptyTitle="Nothing else due this week"
      />

      <AssignmentList
        assignments={upcoming}
        sectionTitle="Upcoming"
        badge={upcoming.length}
        badgeColor="#64748b"
        collapsible
        defaultCollapsed={upcoming.length > 5}
        emptyTitle="No upcoming assignments"
        emptyDescription="Assignments due in the next 2 weeks will appear here."
      />

      <AssignmentForm open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}
