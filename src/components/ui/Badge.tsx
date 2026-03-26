import type { ReactNode } from 'react'
import type { AssignmentPriority, AssignmentStatus, AssignmentCategory } from '../../types'

interface BadgeProps {
  children: ReactNode
  className?: string
}

export function Badge({ children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${className}`}
    >
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: AssignmentStatus }) {
  const classes = {
    not_started: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
    in_progress: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
    done: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  }
  const labels = {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    done: 'Done',
  }
  return <Badge className={classes[status]}>{labels[status]}</Badge>
}

export function PriorityDot({ priority }: { priority: AssignmentPriority }) {
  const colors = {
    low: 'bg-emerald-400',
    medium: 'bg-amber-400',
    high: 'bg-red-400',
  }
  const titles = { low: 'Low priority', medium: 'Medium priority', high: 'High priority' }
  return (
    <span
      className={`inline-block w-1.5 h-1.5 rounded-full ${colors[priority]} shrink-0`}
      title={titles[priority]}
    />
  )
}

export function PriorityBadge({ priority }: { priority: AssignmentPriority }) {
  const classes = {
    low: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
    medium: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
    high: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400',
  }
  const dotColors = {
    low: 'bg-emerald-400',
    medium: 'bg-amber-400',
    high: 'bg-red-400',
  }
  return (
    <Badge className={classes[priority]}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColors[priority]}`} />
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Badge>
  )
}

export function CategoryBadge({ category }: { category: AssignmentCategory }) {
  const classes: Record<AssignmentCategory, string> = {
    discussion: 'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
    quiz: 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
    lab: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400',
    exam: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400',
    homework: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400',
    other: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  }
  return (
    <Badge className={classes[category]}>
      {category.charAt(0).toUpperCase() + category.slice(1)}
    </Badge>
  )
}

export function CourseBadge({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
      style={{ backgroundColor: color }}
    >
      {name}
    </span>
  )
}

export function GradeBadge({ pointsEarned, pointsPossible, letterGrade }: {
  pointsEarned?: number
  pointsPossible?: number
  letterGrade?: string
}) {
  if (letterGrade && !pointsPossible) {
    return <Badge className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400">{letterGrade}</Badge>
  }
  if (pointsEarned !== undefined && pointsPossible) {
    const pct = Math.round((pointsEarned / pointsPossible) * 100)
    const color =
      pct >= 90 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' :
      pct >= 80 ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400' :
      pct >= 70 ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400' :
      'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400'
    return (
      <Badge className={color}>
        {letterGrade ? `${letterGrade} · ` : ''}{pct}%
      </Badge>
    )
  }
  return null
}
