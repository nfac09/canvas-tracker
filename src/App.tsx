import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useStore } from './store'
import { AppShell } from './components/layout/AppShell'
import { DashboardPage } from './pages/DashboardPage'
import { AllAssignmentsPage } from './pages/AllAssignmentsPage'
import { CoursesPage } from './pages/CoursesPage'
import { RecurringPatternsPage } from './pages/RecurringPatternsPage'

export default function App() {
  const generateFromPatterns = useStore((s) => s.generateFromPatterns)

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
      </Route>
    </Routes>
  )
}
