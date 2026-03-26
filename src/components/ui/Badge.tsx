import type { ReactNode } from 'react'
import type { AssignmentPriority, AssignmentStatus, AssignmentCategory } from '../../types'

interface BadgeProps {
  children: ReactNode
  className?: string
}

export function Badge({ children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}
    >
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: AssignmentStatus }) {
  const classes = {
    not_started: 'bg-gray-100 text-gray-600',
    in_progress: 'bg-blue-100 text-blue-700',
    done: 'bg-green-100 text-green-700',
  }
  const labels = {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    done: 'Done',
  }
  return <Badge className={classes[status]}>{labels[status]}</Badge>
}

export function PriorityBadge({ priority }: { priority: AssignmentPriority }) {
  const classes = {
    low: 'bg-green-50 text-green-700',
    medium: 'bg-yellow-50 text-yellow-700',
    high: 'bg-red-50 text-red-700',
  }
  const dots = { low: '●', medium: '●', high: '●' }
  const dotColors = { low: 'text-green-500', medium: 'text-yellow-500', high: 'text-red-500' }
  return (
    <Badge className={classes[priority]}>
      <span className={`mr-1 ${dotColors[priority]}`}>{dots[priority]}</span>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Badge>
  )
}

export function CategoryBadge({ category }: { category: AssignmentCategory }) {
  const classes: Record<AssignmentCategory, string> = {
    discussion: 'bg-purple-50 text-purple-700',
    quiz: 'bg-orange-50 text-orange-700',
    lab: 'bg-cyan-50 text-cyan-700',
    exam: 'bg-red-50 text-red-700',
    homework: 'bg-indigo-50 text-indigo-700',
    other: 'bg-gray-50 text-gray-600',
  }
  return <Badge className={classes[category]}>{category.charAt(0).toUpperCase() + category.slice(1)}</Badge>
}

export function CourseBadge({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
      style={{ backgroundColor: color }}
    >
      {name}
    </span>
  )
}
