import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { UpdateBanner } from '../ui/UpdateBanner'

export function AppShell() {
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <UpdateBanner />
    </div>
  )
}
