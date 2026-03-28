import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useStore } from './store'
import { useTheme } from './hooks/useTheme'
import { AppShell } from './components/layout/AppShell'
import { DashboardPage } from './pages/DashboardPage'
import { AllAssignmentsPage } from './pages/AllAssignmentsPage'
import { CoursesPage } from './pages/CoursesPage'
import { RecurringPatternsPage } from './pages/RecurringPatternsPage'
import { GradesPage } from './pages/GradesPage'
import { CalendarPage } from './pages/CalendarPage'

export default function App() {
  const generateFromPatterns = useStore((s) => s.generateFromPatterns)
  useTheme()

  useEffect(() => {
    generateFromPatterns()
  }, [generateFromPatterns])

  return (
    <Routes>
      <Route path="/" element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="assignments" element={<AllAssignmentsPage />} />
        <Route path="courses" element={<CoursesPage />} />
        <Route path="patterns" element={<RecurringPatternsPage />} />
        <Route path="grades" element={<GradesPage />} />
        <Route path="calendar" element={<CalendarPage />} />
      </Route>
    </Routes>
  )
}
