import { NavLink } from 'react-router-dom'
import { useStore } from '../../store'
import { useState } from 'react'
import { CanvasImportModal } from '../canvas/CanvasImportModal'

const navItems = [
  { to: '/', label: 'Dashboard', icon: '⊞', end: true },
  { to: '/assignments', label: 'All Assignments', icon: '☑', end: false },
  { to: '/courses', label: 'Courses', icon: '◫', end: false },
  { to: '/patterns', label: 'Recurring', icon: '↺', end: false },
]

export function Sidebar() {
  const courses = useStore((s) => s.courses)
  const [importOpen, setImportOpen] = useState(false)

  return (
    <>
      <aside className="w-64 shrink-0 bg-gray-950 text-gray-100 flex flex-col h-screen sticky top-0">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-800">
          <h1 className="text-base font-bold text-white tracking-tight">Canvas Tracker</h1>
          <p className="text-xs text-gray-400 mt-0.5">Weekly assignment planner</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          {/* Courses */}
          {courses.length > 0 && (
            <div className="pt-4">
              <p className="px-3 mb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Courses
              </p>
              {courses.map((course) => (
                <NavLink
                  key={course.id}
                  to={`/assignments?course=${course.id}`}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: course.color }}
                  />
                  {course.name}
                </NavLink>
              ))}
            </div>
          )}
        </nav>

        {/* Import button */}
        <div className="px-3 py-4 border-t border-gray-800">
          <button
            onClick={() => setImportOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <span>⬆</span>
            Import from Canvas
          </button>
        </div>
      </aside>

      <CanvasImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </>
  )
}
