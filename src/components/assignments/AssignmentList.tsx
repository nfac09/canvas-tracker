import { useState } from 'react'
import type { Assignment } from '../../types'
import { AssignmentCard } from './AssignmentCard'
import { EmptyState } from '../ui/EmptyState'

interface AssignmentListProps {
  assignments: Assignment[]
  emptyIcon?: string
  emptyTitle?: string
  emptyDescription?: string
  collapsible?: boolean
  defaultCollapsed?: boolean
  sectionTitle?: string
  badge?: number
  badgeColor?: string
  accent?: string
}

export function AssignmentList({
  assignments,
  emptyIcon,
  emptyTitle = 'No assignments',
  emptyDescription,
  collapsible = false,
  defaultCollapsed = false,
  sectionTitle,
  badge,
  badgeColor = '#6366F1',
}: AssignmentListProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)

  if (collapsible && sectionTitle) {
    return (
      <div className="mb-8">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center gap-2 mb-3 group w-full text-left"
        >
          <span className="text-[11px] font-semibold text-slate-400 dark:text-[#4a4a6a] uppercase tracking-widest group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors">
            {sectionTitle}
          </span>
          {badge !== undefined && badge > 0 && (
            <span
              className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-md text-[10px] font-bold text-white"
              style={{ backgroundColor: badgeColor }}
            >
              {badge}
            </span>
          )}
          <span className="ml-auto text-[10px] text-slate-300 dark:text-[#3a3a55] transition-colors group-hover:text-slate-400 dark:group-hover:text-slate-600">
            {collapsed ? '▾' : '▴'}
          </span>
        </button>

        {!collapsed && (
          <div className="space-y-2">
            {assignments.length === 0 ? (
              emptyIcon ? (
                <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
              ) : (
                <p className="text-xs text-slate-400 dark:text-[#3a3a58] px-1 py-2">
                  All clear here.
                </p>
              )
            ) : (
              assignments.map((a) => <AssignmentCard key={a.id} assignment={a} />)
            )}
          </div>
        )}
      </div>
    )
  }

  if (assignments.length === 0) {
    return <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
  }

  return (
    <div className="space-y-2">
      {assignments.map((a) => <AssignmentCard key={a.id} assignment={a} />)}
    </div>
  )
}
