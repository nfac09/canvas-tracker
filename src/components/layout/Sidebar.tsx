import { NavLink } from 'react-router-dom'
import { useStore } from '../../store'
import { useState, useMemo } from 'react'
import { CanvasImportModal } from '../canvas/CanvasImportModal'
import { ThemeToggle } from '../ui/ThemeToggle'
import { ResetDataModal } from '../ui/ResetDataModal'

const navItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/assignments', label: 'Assignments', end: false },
  { to: '/grades', label: 'Grades', end: false },
  { to: '/courses', label: 'Courses', end: false },
  { to: '/patterns', label: 'Recurring', end: false },
]

export function Sidebar() {
  const courses = useStore((s) => s.courses)
  const assignments = useStore((s) => s.assignments)
  const pendingSuggestionCount = useStore((s) =>
    s.recurrenceSuggestions.filter((s) => s.status === 'pending').length
  )
  const [importOpen, setImportOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)

  // Live pending count per course (not done, not skipped)
  const pendingByCourse = useMemo(() => {
    return assignments.reduce<Record<string, number>>((acc, a) => {
      if (a.status !== 'done' && !a.isSkipped) {
        acc[a.courseId] = (acc[a.courseId] ?? 0) + 1
      }
      return acc
    }, {})
  }, [assignments])

  return (
    <>
      <aside className="w-56 shrink-0 bg-white dark:bg-[#0d0d13] flex flex-col h-screen sticky top-0 border-r border-slate-200 dark:border-white/[0.06]">
        {/* macOS traffic light spacer — draggable */}
        <div
          className="h-11 shrink-0"
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        />

        {/* Logo */}
        <div className="px-4 pb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 bg-indigo-500 rounded-[5px] flex items-center justify-center shrink-0">
              <span className="text-white text-[10px] font-bold tracking-tight">CT</span>
            </div>
            <span className="text-slate-900 dark:text-white/85 font-semibold text-[13px] tracking-tight">
              Canvas Tracker
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 pb-2 space-y-px">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `relative flex items-center px-3 py-[7px] rounded-lg text-[13px]
                transition-all duration-100 ease-out
                active:scale-[0.98]
                ${isActive
                  ? 'bg-indigo-50 dark:bg-indigo-500/[0.1] text-indigo-700 dark:text-indigo-300 font-medium'
                  : 'text-slate-500 dark:text-[#8888a8] hover:bg-slate-100 dark:hover:bg-white/[0.05] hover:text-slate-800 dark:hover:text-white/80 active:bg-slate-200/60 dark:active:bg-white/[0.08]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-[18px] rounded-r-full bg-indigo-500 dark:bg-indigo-400" />
                  )}
                  {item.label}
                  {item.to === '/patterns' && pendingSuggestionCount > 0 && (
                    <span className="ml-auto min-w-[16px] h-[16px] px-1 rounded text-[9px] font-bold text-white bg-amber-400 flex items-center justify-center tabular-nums shrink-0">
                      {pendingSuggestionCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}

          {/* Courses — with live pending counts */}
          {courses.length > 0 && (
            <div className="pt-5">
              <p className="px-3 mb-1.5 text-[10px] font-semibold text-slate-400 dark:text-white/20 uppercase tracking-widest">
                Courses
              </p>
              {courses.map((course) => {
                const count = pendingByCourse[course.id] ?? 0
                return (
                  <NavLink
                    key={course.id}
                    to={`/assignments?course=${course.id}`}
                    className="flex items-center gap-2 px-3 py-[7px] rounded-lg text-[13px] text-slate-500 dark:text-[#8888a8] hover:bg-slate-100 dark:hover:bg-white/[0.05] hover:text-slate-800 dark:hover:text-white/80 active:bg-slate-200/60 dark:active:bg-white/[0.08] transition-all duration-100 active:scale-[0.98]"
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: course.color }}
                    />
                    <span className="flex-1 truncate">{course.name}</span>
                    {count > 0 && (
                      <span className="text-[10px] font-semibold text-slate-400 dark:text-white/25 tabular-nums shrink-0">
                        {count}
                      </span>
                    )}
                  </NavLink>
                )
              })}
            </div>
          )}
        </nav>

        {/* Bottom */}
        <div className="px-2 pb-4 pt-2.5 border-t border-slate-200 dark:border-white/[0.06] space-y-px">
          <button
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-2 w-full px-3 py-[7px] rounded-lg text-[13px] text-slate-500 dark:text-[#8888a8] hover:bg-slate-100 dark:hover:bg-white/[0.05] hover:text-slate-800 dark:hover:text-white/80 active:bg-slate-200/60 dark:active:bg-white/[0.08] transition-all duration-100 active:scale-[0.98]"
          >
            <span className="text-[11px] opacity-60">↑</span>
            Import from Canvas
          </button>
          <ThemeToggle />
          <button
            onClick={() => setResetOpen(true)}
            className="flex items-center gap-2 w-full px-3 py-[7px] rounded-lg text-[13px] text-slate-400 dark:text-[#6666888] hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 active:bg-red-100/60 dark:active:bg-red-950/50 transition-all duration-100 active:scale-[0.98]"
          >
            <span className="text-[11px] opacity-70">⊗</span>
            Reset data
          </button>
        </div>
      </aside>

      <CanvasImportModal open={importOpen} onClose={() => setImportOpen(false)} />
      <ResetDataModal open={resetOpen} onClose={() => setResetOpen(false)} />
    </>
  )
}
