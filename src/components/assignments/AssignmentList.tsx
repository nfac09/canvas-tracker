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
  badgeColor = '#6366F1',
}: AssignmentListProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)

  if (collapsible && sectionTitle) {
    return (
      // Section panel: explicit surface layer. No overflow-hidden so card shadows render correctly.
      <div className="mb-3 rounded-xl border border-slate-200 dark:border-white/[0.07] bg-white dark:bg-[#0f0f1a]">
        {/* Panel header — collapses body */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="
            w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left group
            rounded-xl transition-colors duration-100
            hover:bg-slate-50/80 dark:hover:bg-white/[0.025]
            active:bg-slate-100/60 dark:active:bg-white/[0.04]
          "
        >
          <span
            className="w-[3px] h-[11px] rounded-full shrink-0"
            style={{ backgroundColor: badgeColor, opacity: 0.65 }}
          />
          <span className="text-[10px] font-semibold text-slate-500 dark:text-white/35 uppercase tracking-widest group-hover:text-slate-700 dark:group-hover:text-white/55 transition-colors duration-100">
            {sectionTitle}
          </span>
          {badge !== undefined && badge > 0 && (
            <span
              className="min-w-[17px] h-[17px] px-1.5 rounded flex items-center justify-center text-[9px] font-bold text-white tabular-nums"
              style={{ backgroundColor: badgeColor }}
            >
              {badge}
            </span>
          )}
          {/* Animated chevron — single char that rotates */}
          <span
            className={`ml-auto text-[9px] font-mono text-slate-300 dark:text-white/15 group-hover:text-slate-400 dark:group-hover:text-white/35 transition-all duration-200 inline-block ${collapsed ? 'rotate-0' : 'rotate-180'}`}
          >
            ▾
          </span>
        </button>

        {/* Panel body */}
        {!collapsed && (
          <div className="border-t border-slate-100 dark:border-white/[0.05]">
            {assignments.length === 0 ? (
              <p className="text-[11px] text-slate-400 dark:text-white/20 px-4 py-3">
                Nothing here right now.
              </p>
            ) : (
              <div className="p-2 space-y-1">
                {assignments.map((a) => (
                  <AssignmentCard key={a.id} assignment={a} />
                ))}
              </div>
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
    <div className="space-y-1">
      {assignments.map((a) => (
        <AssignmentCard key={a.id} assignment={a} />
      ))}
    </div>
  )
}
