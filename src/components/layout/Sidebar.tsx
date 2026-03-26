import { NavLink } from 'react-router-dom'
import { useStore } from '../../store'
import { useState } from 'react'
import { CanvasImportModal } from '../canvas/CanvasImportModal'
import { ThemeToggle } from '../ui/ThemeToggle'

const navItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/assignments', label: 'Assignments', end: false },
  { to: '/grades', label: 'Grades', end: false },
  { to: '/courses', label: 'Courses', end: false },
  { to: '/patterns', label: 'Recurring', end: false },
]

export function Sidebar() {
  const courses = useStore((s) => s.courses)
  const [importOpen, setImportOpen] = useState(false)

  return (
    <>
      <aside className="w-56 shrink-0 bg-white dark:bg-[#0d0d13] flex flex-col h-screen sticky top-0 border-r border-slate-200 dark:border-white/[0.06]">
        {/* macOS traffic light spacer — draggable title bar */}
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
            <span className="text-slate-900 dark:text-white/90 font-semibold text-[13px] tracking-tight">
              Canvas Tracker
            </span>
          </div>
          <p className="text-slate-400 dark:text-[#3a3a58] text-[11px] mt-0.5 ml-[34px]">
            Weekly planner
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 pb-2 space-y-px">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center px-3 py-[7px] rounded-lg text-[13px] transition-colors
                ${isActive
                  ? 'bg-indigo-50 dark:bg-white/[0.08] text-indigo-700 dark:text-white font-medium'
                  : 'text-slate-500 dark:text-[#8888a8] hover:bg-slate-100 dark:hover:bg-white/[0.05] hover:text-slate-800 dark:hover:text-white/80'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}

          {/* Courses section */}
          {courses.length > 0 && (
            <div className="pt-5">
              <p className="px-3 mb-1.5 text-[10px] font-semibold text-slate-400 dark:text-[#3a3a55] uppercase tracking-widest">
                Courses
              </p>
              {courses.map((course) => (
                <NavLink
                  key={course.id}
                  to={`/assignments?course=${course.id}`}
                  className="flex items-center gap-2 px-3 py-[7px] rounded-lg text-[13px] text-slate-500 dark:text-[#8888a8] hover:bg-slate-100 dark:hover:bg-white/[0.05] hover:text-slate-800 dark:hover:text-white/80 transition-colors"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: course.color }}
                  />
                  <span className="truncate">{course.name}</span>
                </NavLink>
              ))}
            </div>
          )}
        </nav>

        {/* Bottom actions */}
        <div className="px-2 pb-4 pt-2.5 border-t border-slate-200 dark:border-white/[0.06] space-y-px">
          <button
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-2 w-full px-3 py-[7px] rounded-lg text-[13px] text-slate-500 dark:text-[#8888a8] hover:bg-slate-100 dark:hover:bg-white/[0.05] hover:text-slate-800 dark:hover:text-white/80 transition-colors"
          >
            <span className="text-[11px] opacity-70">↑</span>
            Import from Canvas
          </button>
          <ThemeToggle />
        </div>
      </aside>

      <CanvasImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </>
  )
}
