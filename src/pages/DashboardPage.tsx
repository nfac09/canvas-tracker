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
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {totalPending === 0
              ? 'You\'re all caught up! 🎉'
              : `${totalPending} assignment${totalPending !== 1 ? 's' : ''} need attention`}
          </p>
        </div>
        <Button variant="primary" onClick={() => setAddOpen(true)}>
          + Add Assignment
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <AssignmentFilters filters={filters} onChange={setFilters} />
      </div>

      {/* Overdue */}
      <AssignmentList
        assignments={overdue}
        sectionTitle="Overdue"
        badge={overdue.length}
        badgeColor="#EF4444"
        collapsible
        defaultCollapsed={false}
        emptyTitle="No overdue assignments"
      />

      {/* Due Today */}
      <AssignmentList
        assignments={today}
        sectionTitle="Due Today"
        badge={today.length}
        badgeColor="#F97316"
        collapsible
        defaultCollapsed={false}
        emptyTitle="Nothing due today"
      />

      {/* This Week */}
      <AssignmentList
        assignments={thisWeek}
        sectionTitle="Due This Week"
        badge={thisWeek.length}
        badgeColor="#6366F1"
        collapsible
        defaultCollapsed={false}
        emptyTitle="Nothing else due this week"
      />

      {/* Upcoming */}
      <AssignmentList
        assignments={upcoming}
        sectionTitle="Upcoming"
        badge={upcoming.length}
        badgeColor="#6B7280"
        collapsible
        defaultCollapsed={upcoming.length > 5}
        emptyTitle="No upcoming assignments"
        emptyDescription="Assignments due in the next 2 weeks will appear here."
      />

      <AssignmentForm open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}
