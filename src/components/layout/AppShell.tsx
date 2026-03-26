import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { UpdateModal } from '../ui/UpdateModal'
import { WhatsNewModal } from '../ui/WhatsNewModal'

export function AppShell() {
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#0d0d13]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      {/* Update system — only active when running inside Electron */}
      <UpdateModal />
      <WhatsNewModal />
    </div>
  )
}
