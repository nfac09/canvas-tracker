import type { Assignment, Course } from '../types'
import {
  isOverdue,
  isDueToday,
  isDueThisWeek,
  isDueNextTwoWeeks,
} from '../utils/dateHelpers'

function visible(a: Assignment): boolean {
  return !a.isSkipped && a.status !== 'done'
}

export function selectOverdue(assignments: Assignment[]): Assignment[] {
  return assignments
    .filter((a) => visible(a) && isOverdue(a.dueDate))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
}

export function selectDueToday(assignments: Assignment[]): Assignment[] {
  return assignments
    .filter((a) => visible(a) && isDueToday(a.dueDate))
    .sort((a, b) => (a.dueTime ?? '').localeCompare(b.dueTime ?? ''))
}

export function selectDueThisWeek(assignments: Assignment[]): Assignment[] {
  return assignments
    .filter((a) => visible(a) && isDueThisWeek(a.dueDate) && !isDueToday(a.dueDate))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
}

export function selectUpcoming(assignments: Assignment[]): Assignment[] {
  return assignments
    .filter((a) => visible(a) && isDueNextTwoWeeks(a.dueDate))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
}

export function selectAllVisible(assignments: Assignment[]): Assignment[] {
  return assignments
    .filter((a) => !a.isSkipped)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
}

export function getCourseById(courses: Course[], id: string): Course | undefined {
  return courses.find((c) => c.id === id)
}

export function getAssignmentCountByCourse(
  assignments: Assignment[],
  courseId: string,
): number {
  return assignments.filter((a) => a.courseId === courseId && !a.isSkipped).length
}
