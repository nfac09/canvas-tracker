import { useState, useMemo } from 'react'
import { useStore } from '../store'
import { AssignmentForm } from '../components/assignments/AssignmentForm'
import type { Assignment, Course } from '../types'

// ── Date helpers ──────────────────────────────────────────────────────────────

function toDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const TODAY_KEY = toDateKey(new Date())

function buildCalendarDays(year: number, month: number, weekStartsOn: 0 | 1): Date[] {
  const firstDay = new Date(year, month, 1)
  // offset = how many columns to shift before the 1st
  let offset = firstDay.getDay() // 0=Sun … 6=Sat
  if (weekStartsOn === 1) offset = (offset + 6) % 7 // Mon=0 … Sun=6
  const start = new Date(firstDay)
  start.setDate(start.getDate() - offset)
  const days: Date[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    days.push(d)
  }
  return days
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

// ── Assignment chip (inside a day cell) ──────────────────────────────────────

function AssignmentChip({
  assignment,
  course,
  isPast,
  onClick,
}: {
  assignment: Assignment
  course: Course | undefined
  isPast: boolean
  onClick: () => void
}) {
  const isDone = assignment.status === 'done'
  const isOverdue = isPast && !isDone
  const barColor = isOverdue ? '#ef4444' : (course?.color ?? '#6366f1')

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick() }}
      title={assignment.title}
      style={isDone ? undefined : { borderLeftColor: barColor }}
      className={`
        w-full text-left flex items-center gap-1.5 pl-2 pr-1.5 py-[3px] rounded text-[10px] leading-snug truncate
        border-l-[3px] transition-all duration-100
        ${isDone
          ? 'opacity-35 border-l-transparent bg-slate-50 dark:bg-white/[0.04]'
          : isOverdue
            ? 'bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 hover:bg-red-100 dark:hover:bg-red-900/60 hover:shadow-sm'
            : 'bg-white dark:bg-white/[0.1] border border-slate-100 dark:border-white/[0.12] hover:bg-slate-50 dark:hover:bg-white/[0.16] hover:shadow-sm'
        }
      `}
    >
      <span
        className={`truncate ${
          isDone
            ? 'line-through text-slate-400 dark:text-white/30'
            : isOverdue
              ? 'text-red-700 dark:text-red-300 font-medium'
              : 'text-slate-700 dark:text-white/85'
        }`}
      >
        {assignment.title}
      </span>
    </button>
  )
}

// ── Day panel (right-side detail) ────────────────────────────────────────────

function DayPanel({
  dateKey,
  assignments,
  courseMap,
  onClose,
  onEdit,
  onAdd,
}: {
  dateKey: string
  assignments: Assignment[]
  courseMap: Map<string, Course>
  onClose: () => void
  onEdit: (a: Assignment) => void
  onAdd: () => void
}) {
  const setStatus = useStore((s) => s.setStatus)

  const [y, mo, d] = dateKey.split('-').map(Number)
  const date = new Date(y, mo - 1, d)
  const dateLabel = date.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
  const isPast = dateKey < TODAY_KEY

  const sorted = [...assignments].sort((a, b) => {
    if (a.status === 'done' && b.status !== 'done') return 1
    if (a.status !== 'done' && b.status === 'done') return -1
    return (a.dueTime ?? '').localeCompare(b.dueTime ?? '')
  })

  return (
    <div className="w-[260px] shrink-0 border-l border-slate-200 dark:border-white/[0.06] flex flex-col bg-white dark:bg-[#0e0e16]">
      {/* Panel header */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-100 dark:border-white/[0.06] flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-slate-900 dark:text-white/88 leading-snug">{dateLabel}</p>
          <p className="text-[11px] text-slate-400 dark:text-white/28 mt-0.5">
            {assignments.length === 0 ? 'Nothing due' : `${assignments.length} assignment${assignments.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 text-slate-400 dark:text-white/25 hover:text-slate-600 dark:hover:text-white/60 transition-colors text-lg leading-none mt-0.5"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {/* Assignment list */}
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-px">
        {sorted.length === 0 ? (
          <div className="py-8 flex flex-col items-center gap-2">
            <p className="text-[12px] text-slate-400 dark:text-white/20">No assignments due</p>
            <button
              onClick={onAdd}
              className="text-[11px] text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
            >
              + Add one
            </button>
          </div>
        ) : (
          sorted.map((a) => {
            const course = courseMap.get(a.courseId)
            const isDone = a.status === 'done'
            const isOverdue = isPast && !isDone
            const dotColor = isOverdue ? '#ef4444' : (course?.color ?? '#6366f1')
            return (
              <button
                key={a.id}
                onClick={() => onEdit(a)}
                className={`w-full text-left flex items-start gap-2.5 px-2 py-2 rounded-lg transition-colors group
                  ${isOverdue
                    ? 'hover:bg-red-50 dark:hover:bg-red-950/30'
                    : 'hover:bg-slate-50 dark:hover:bg-white/[0.07]'
                  }
                `}
              >
                {/* Status circle */}
                <span
                  role="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.stopPropagation()
                    setStatus(a.id, isDone ? 'not_started' : 'done')
                  }}
                  style={isDone ? { boxShadow: '0 0 6px #10b98166' } : undefined}
                  className={`
                    mt-0.5 w-[14px] h-[14px] rounded-full border-2 flex items-center justify-center shrink-0 transition-all
                    ${isDone
                      ? 'bg-emerald-500 border-emerald-500'
                      : isOverdue
                        ? 'border-red-400 dark:border-red-500 hover:border-red-500 dark:hover:border-red-400'
                        : 'border-slate-300 dark:border-white/25 hover:border-indigo-400 dark:hover:border-indigo-400'
                    }
                  `}
                >
                  {isDone && (
                    <svg viewBox="0 0 8 8" className="w-[7px] h-[7px] text-white fill-current">
                      <path d="M1.5 4L3.5 6L6.5 2" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>

                <div className="flex-1 min-w-0">
                  {/* Course indicator + title */}
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {!isDone && (
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{
                          backgroundColor: dotColor,
                          boxShadow: `0 0 5px ${dotColor}99`,
                        }}
                      />
                    )}
                    <span
                      className={`text-[12px] font-medium truncate leading-snug ${
                        isDone
                          ? 'line-through text-slate-400 dark:text-white/28'
                          : isOverdue
                            ? 'text-red-700 dark:text-red-300'
                            : 'text-slate-800 dark:text-white/90'
                      }`}
                    >
                      {a.title}
                    </span>
                  </div>
                  {/* Course name + time */}
                  {(course || a.dueTime) && (
                    <p className={`text-[10px] truncate ${
                      isDone ? 'text-slate-400 dark:text-white/20' : 'text-slate-400 dark:text-white/40'
                    }`}>
                      {[course?.name, a.dueTime].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
              </button>
            )
          })
        )}
      </div>

      {/* Footer: add assignment */}
      {sorted.length > 0 && (
        <div className="px-4 py-3 border-t border-slate-100 dark:border-white/[0.06]">
          <button
            onClick={onAdd}
            className="text-[12px] text-slate-400 dark:text-white/25 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            + Add assignment
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function CalendarPage() {
  const assignments = useStore((s) => s.assignments)
  const courses = useStore((s) => s.courses)
  // Fallback to 1 (Monday) if weekStartsOn is missing from an older persisted store
  const weekStartsOn = useStore((s) => s.settings.weekStartsOn ?? 1)

  const now = new Date()
  const [currentYear, setCurrentYear] = useState(now.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(now.getMonth())
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null)
  const [editAssignment, setEditAssignment] = useState<Assignment | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [addDefaultDate, setAddDefaultDate] = useState<string | undefined>()

  const courseMap = useMemo(
    () => new Map(courses.map((c) => [c.id, c])),
    [courses],
  )

  // Group non-skipped assignments by due date
  const assignmentsByDate = useMemo(() => {
    const map = new Map<string, Assignment[]>()
    for (const a of assignments) {
      if (a.isSkipped) continue
      const list = map.get(a.dueDate) ?? []
      list.push(a)
      map.set(a.dueDate, list)
    }
    return map
  }, [assignments])

  const calendarDays = useMemo(
    () => buildCalendarDays(currentYear, currentMonth, weekStartsOn),
    [currentYear, currentMonth, weekStartsOn],
  )

  function prevMonth() {
    setSelectedDateKey(null)
    if (currentMonth === 0) { setCurrentYear((y) => y - 1); setCurrentMonth(11) }
    else setCurrentMonth((m) => m - 1)
  }

  function nextMonth() {
    setSelectedDateKey(null)
    if (currentMonth === 11) { setCurrentYear((y) => y + 1); setCurrentMonth(0) }
    else setCurrentMonth((m) => m + 1)
  }

  function goToToday() {
    const t = new Date()
    setCurrentYear(t.getFullYear())
    setCurrentMonth(t.getMonth())
    setSelectedDateKey(null)
  }

  const isCurrentMonth =
    currentYear === now.getFullYear() && currentMonth === now.getMonth()

  const dayLabels = weekStartsOn === 1
    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const selectedAssignments = selectedDateKey
    ? (assignmentsByDate.get(selectedDateKey) ?? [])
    : []

  function handleDayClick(key: string) {
    setSelectedDateKey((prev) => (prev === key ? null : key))
  }

  function openEdit(a: Assignment, dateKey?: string) {
    if (dateKey) setSelectedDateKey(dateKey)
    setEditAssignment(a)
  }

  function openAdd(dateKey: string) {
    setAddDefaultDate(dateKey)
    setAddOpen(true)
  }

  return (
    <div className="flex h-full">

      {/* ── Calendar body ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Sticky header — Tier 1: month nav */}
        <div className="sticky top-0 z-10 bg-slate-50 dark:bg-[#0d0d13] border-b border-slate-200 dark:border-white/[0.06]">
          <div className="px-7 pt-4 pb-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-[15px] font-semibold tracking-tight text-slate-900 dark:text-white/88 leading-none">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </h1>
              {!isCurrentMonth && (
                <button
                  onClick={goToToday}
                  className="text-[11px] font-medium px-2 py-[3px] rounded-md text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                >
                  Today
                </button>
              )}
            </div>
            <div className="flex items-center gap-0.5">
              <button
                onClick={prevMonth}
                className="w-7 h-7 flex items-center justify-center rounded-md text-[15px] text-slate-400 dark:text-white/30 hover:text-slate-700 dark:hover:text-white/70 hover:bg-slate-100 dark:hover:bg-white/[0.07] transition-colors"
                aria-label="Previous month"
              >
                ‹
              </button>
              <button
                onClick={nextMonth}
                className="w-7 h-7 flex items-center justify-center rounded-md text-[15px] text-slate-400 dark:text-white/30 hover:text-slate-700 dark:hover:text-white/70 hover:bg-slate-100 dark:hover:bg-white/[0.07] transition-colors"
                aria-label="Next month"
              >
                ›
              </button>
            </div>
          </div>

          {/* Tier 2: day-of-week labels */}
          <div className="grid grid-cols-7 border-t border-slate-100 dark:border-white/[0.04] px-0">
            {dayLabels.map((d) => (
              <div
                key={d}
                className="py-2 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-white/20"
              >
                {d}
              </div>
            ))}
          </div>
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 border-l border-t border-slate-200 dark:border-white/[0.06]">
          {calendarDays.map((day) => {
            const key = toDateKey(day)
            const inMonth = day.getMonth() === currentMonth
            const isToday = key === TODAY_KEY
            const isPast = key < TODAY_KEY
            const isSelected = key === selectedDateKey
            const dayAssignments = assignmentsByDate.get(key) ?? []
            const visibleChips = dayAssignments.slice(0, 3)
            const overflow = dayAssignments.length - 3

            return (
              <div
                key={key}
                onClick={() => handleDayClick(key)}
                className={`
                  border-r border-b border-slate-200 dark:border-white/[0.06]
                  min-h-[110px] p-1.5 flex flex-col gap-0.5 cursor-pointer
                  transition-colors duration-100
                  ${isSelected
                    ? 'bg-indigo-50/80 dark:bg-indigo-500/[0.07]'
                    : 'hover:bg-slate-50/80 dark:hover:bg-white/[0.02]'
                  }
                  ${!inMonth ? 'opacity-30' : ''}
                `}
              >
                {/* Date number */}
                <div className="flex items-center justify-between mb-0.5 px-0.5">
                  <span
                    className={`
                      text-[11px] font-semibold leading-none w-[20px] h-[20px] flex items-center justify-center rounded-full tabular-nums
                      ${isToday
                        ? 'bg-indigo-500 text-white'
                        : 'text-slate-500 dark:text-white/35'
                      }
                    `}
                  >
                    {day.getDate()}
                  </span>
                </div>

                {/* Assignment chips */}
                <div className="flex flex-col gap-[3px] flex-1">
                  {visibleChips.map((a) => (
                    <AssignmentChip
                      key={a.id}
                      assignment={a}
                      course={courseMap.get(a.courseId)}
                      isPast={isPast}
                      onClick={() => openEdit(a, key)}
                    />
                  ))}
                  {overflow > 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedDateKey(key) }}
                      className="text-left text-[9px] px-1.5 text-slate-400 dark:text-white/20 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors leading-snug"
                    >
                      +{overflow} more
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Day panel ───────────────────────────────────────────────────── */}
      {selectedDateKey && (
        <DayPanel
          dateKey={selectedDateKey}
          assignments={selectedAssignments}
          courseMap={courseMap}
          onClose={() => setSelectedDateKey(null)}
          onEdit={(a) => openEdit(a)}
          onAdd={() => openAdd(selectedDateKey)}
        />
      )}

      {/* Edit form */}
      <AssignmentForm
        open={editAssignment !== null}
        assignment={editAssignment ?? undefined}
        onClose={() => setEditAssignment(null)}
      />

      {/* Add form — pre-fills due date from selected day */}
      <AssignmentForm
        open={addOpen}
        defaultDueDate={addDefaultDate}
        onClose={() => { setAddOpen(false); setAddDefaultDate(undefined) }}
      />
    </div>
  )
}
