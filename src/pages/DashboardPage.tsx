import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { CanvasImportModal } from '../components/canvas/CanvasImportModal'
import { Button } from '../components/ui/Button'

export function DashboardPage() {
  const assignments = useStore((s) => s.assignments)
  const courses = useStore((s) => s.courses)
  const [addOpen, setAddOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const navigate = useNavigate()
  const [filters, setFilters] = useState<FilterState>({
    courseId: '',
    status: '',
    category: '',
    gradeState: '',
  })

  const filtered = applyFilters(assignments, filters)

  const overdue   = selectOverdue(filtered)
  const today     = selectDueToday(filtered)
  const thisWeek  = selectDueThisWeek(filtered)
  const upcoming  = selectUpcoming(filtered)

  const totalPending = overdue.length + today.length + thisWeek.length
  const allClear = totalPending === 0 && upcoming.length === 0

  const pendingByCourse = useMemo(() => {
    const all = [...overdue, ...today, ...thisWeek, ...upcoming]
    return all.reduce<Record<string, number>>((acc, a) => {
      acc[a.courseId] = (acc[a.courseId] ?? 0) + 1
      return acc
    }, {})
  }, [overdue, today, thisWeek, upcoming])

  const overviewRows = [
    { label: 'Overdue',   count: overdue.length,  color: '#ef4444' },
    { label: 'Due today', count: today.length,    color: '#f97316' },
    { label: 'This week', count: thisWeek.length, color: '#6366f1' },
    { label: 'Upcoming',  count: upcoming.length, color: '#64748b' },
  ].filter((r) => r.count > 0)

  // Short date label: "Thu, Mar 26"
  const dateLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  }).format(new Date())

  return (
    <div>
      {/* ─────────────────────────────────────────────────────────────
          Sticky 2-tier header
          Tier 1: identity (title + date + primary action)
          Tier 2: filter controls
      ──────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-slate-50 dark:bg-[#0d0d13] border-b border-slate-200 dark:border-white/[0.06]">
        {/* Tier 1 — identity row */}
        <div className="px-7 pt-4 pb-3 flex items-center justify-between gap-6">
          <div className="min-w-0">
            <h1 className="text-[15px] font-semibold tracking-tight text-slate-900 dark:text-white/88 leading-none">
              Dashboard
            </h1>
            <p className="text-[11px] text-slate-400 dark:text-white/28 mt-[5px] tabular-nums">
              {dateLabel}
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}>
            + Add Assignment
          </Button>
        </div>

        {/* Tier 2 — filter controls row */}
        <div className="px-7 py-[9px] border-t border-slate-100 dark:border-white/[0.04] bg-slate-50/60 dark:bg-black/[0.12]">
          <AssignmentFilters filters={filters} onChange={setFilters} />
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────── */}
      {courses.length === 0 ? (

        /* ── Welcome / onboarding empty state ── */
        <div className="flex flex-col items-center justify-center min-h-[58vh] px-7">
          <div className="text-center max-w-xs">
            <div className="w-11 h-11 bg-indigo-500 rounded-xl flex items-center justify-center mx-auto mb-5">
              <span className="text-white text-[16px] font-bold tracking-tight">CT</span>
            </div>
            <h2 className="text-[17px] font-semibold text-slate-900 dark:text-white/88 mb-2">
              Welcome to Canvas Tracker
            </h2>
            <p className="text-[13px] text-slate-500 dark:text-white/35 leading-relaxed mb-7">
              Import your Canvas calendar to bring in all your assignments at once, or add your courses manually to get started.
            </p>
            <div className="flex flex-col gap-2">
              <Button variant="primary" onClick={() => setImportOpen(true)}>
                Import from Canvas
              </Button>
              <Button variant="ghost" onClick={() => navigate('/courses')}>
                Add courses manually
              </Button>
            </div>
          </div>
        </div>

      ) : (

        /* ── Two-column content layout ── */
        <div className="flex items-start gap-5 px-7 pt-4 pb-10">

          {/* Left — sections */}
          <div className="flex-1 min-w-0">
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
          </div>

          {/* Right — live overview panel */}
          <div className="w-52 shrink-0 space-y-3 pt-0.5">

            {/* Status overview */}
            <div className="rounded-xl border border-slate-200 dark:border-white/[0.07] overflow-hidden bg-white dark:bg-[#0f0f1a]">
              <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-white/[0.05]">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-white/25">
                  Overview
                </p>
              </div>
              {allClear ? (
                <div className="px-3.5 py-3">
                  <p className="text-[12px] font-medium text-emerald-600 dark:text-emerald-400">All clear</p>
                  <p className="text-[11px] text-slate-400 dark:text-white/25 mt-0.5">No pending items</p>
                </div>
              ) : (
                <div className="px-2 py-1.5">
                  {overviewRows.map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between px-2 py-[5px] rounded-md hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors duration-100"
                    >
                      <span className="flex items-center gap-2 text-[12px] text-slate-600 dark:text-white/45">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: row.color }}
                        />
                        {row.label}
                      </span>
                      <span className="text-[12px] font-semibold text-slate-700 dark:text-white/60 tabular-nums">
                        {row.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Course breakdown */}
            <div className="rounded-xl border border-slate-200 dark:border-white/[0.07] overflow-hidden bg-white dark:bg-[#0f0f1a]">
              <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-white/[0.05]">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-white/25">
                  Courses
                </p>
              </div>
              <div className="px-2 py-1.5">
                {courses.map((c) => {
                  const count = pendingByCourse[c.id] ?? 0
                  return (
                    <div
                      key={c.id}
                      className="flex items-center gap-2 px-2 py-[5px] rounded-md hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors duration-100"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: c.color }}
                      />
                      <span className="flex-1 truncate text-[12px] text-slate-600 dark:text-white/45 font-medium">
                        {c.name}
                      </span>
                      <span
                        className={`text-[11px] font-semibold tabular-nums ${
                          count > 0 ? 'text-slate-600 dark:text-white/55' : 'text-slate-300 dark:text-white/15'
                        }`}
                      >
                        {count > 0 ? count : '—'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        </div>

      )}

      <AssignmentForm open={addOpen} onClose={() => setAddOpen(false)} />
      <CanvasImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  )
}
