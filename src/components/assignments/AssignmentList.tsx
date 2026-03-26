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
  badgeColor,
}: AssignmentListProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)

  if (collapsible && sectionTitle) {
    return (
      <div className="mb-6">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center gap-2 mb-3 group w-full text-left"
        >
          <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900">
            {sectionTitle}
          </span>
          {badge !== undefined && badge > 0 && (
            <span
              className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: badgeColor ?? '#6366F1' }}
            >
              {badge}
            </span>
          )}
          <span className="ml-auto text-gray-400 text-xs">{collapsed ? '▶' : '▼'}</span>
        </button>
        {!collapsed && (
          <div className="space-y-2">
            {assignments.length === 0 ? (
              emptyIcon ? (
                <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
              ) : (
                <p className="text-sm text-gray-400 px-1">All clear here!</p>
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
