import { NavLink } from 'react-router-dom'
import { useStore } from '../../store'
import { useState } from 'react'
import { CanvasImportModal } from '../canvas/CanvasImportModal'
import { ThemeToggle } from '../ui/ThemeToggle'

const navItems = [
  { to: '/', label: 'Dashboard', icon: '▦', end: true },
  { to: '/assignments', label: 'Assignments', icon: '☑', end: false },
  { to: '/grades', label: 'Grades', icon: '◎', end: false },
  { to: '/courses', label: 'Courses', icon: '◫', end: false },
  { to: '/patterns', label: 'Recurring', icon: '↺', end: false },
]

export function Sidebar() {
  const courses = useStore((s) => s.courses)
  const [importOpen, setImportOpen] = useState(false)

  return (
    <>
      <aside className="w-60 shrink-0 bg-slate-900 flex flex-col h-screen sticky top-0 border-r border-slate-800">
        {/* Traffic light spacer — gives room for macOS window controls.
            The [app-region:drag] class makes this area draggable as a title bar. */}
        <div
          className="h-11 shrink-0 px-5 flex items-end pb-1"
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        />

        {/* Logo */}
        <div className="px-5 pb-4">
          <div className="flex items-center gap-2.5 mb-0.5">
            <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">CT</span>
            </div>
            <span className="text-white font-semibold text-sm tracking-tight">Canvas Tracker</span>
          </div>
          <p className="text-slate-500 text-xs ml-9">Weekly planner</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all
                ${isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`
              }
            >
              <span className="w-4 text-center opacity-80">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          {/* Courses section */}
          {courses.length > 0 && (
            <div className="pt-4">
              <p className="px-3 mb-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Courses
              </p>
              {courses.map((course) => (
                <NavLink
                  key={course.id}
                  to={`/assignments?course=${course.id}`}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: course.color }}
                  />
                  <span className="truncate">{course.name}</span>
                </NavLink>
              ))}
            </div>
          )}
        </nav>

        {/* Bottom actions */}
        <div className="px-2 pb-4 space-y-0.5 border-t border-slate-800 pt-3">
          <button
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
          >
            <span className="w-4 text-center">⬆</span>
            Import from Canvas
          </button>
          <ThemeToggle />
        </div>
      </aside>

      <CanvasImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </>
  )
}
