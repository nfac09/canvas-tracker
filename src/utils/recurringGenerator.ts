import { parseISO, isBefore, isAfter, startOfISOWeek } from 'date-fns'
import { nanoid } from 'nanoid'
import type { Assignment, RecurringPattern } from '../types'
import {
  generateWeekKeys,
  toWeekKey,
  dueDateForWeekAndDay,
} from './weekKey'
import { formatDate, nowISO } from './dateHelpers'

/**
 * Given the current list of recurring patterns and all existing assignments,
 * returns arrays of assignments to create and assignments to update.
 * Does NOT mutate state — the caller is responsible for applying changes.
 */
export function computeRecurringUpdates(
  patterns: RecurringPattern[],
  existingAssignments: Assignment[],
  weeksAhead: number,
): { toCreate: Assignment[]; toUpdate: Assignment[] } {
  const weekKeys = generateWeekKeys(weeksAhead)

  // Build fast lookup: patternId::weekKey → existing assignment
  const existingByKey = new Map<string, Assignment>()
  for (const a of existingAssignments) {
    if (a.recurringPatternId && a.weekKey) {
      existingByKey.set(`${a.recurringPatternId}::${a.weekKey}`, a)
    }
  }

  const toCreate: Assignment[] = []
  const toUpdate: Assignment[] = []
  const now = nowISO()

  for (const pattern of patterns) {
    if (!pattern.active) continue

    const patternStart = parseISO(pattern.startDate)
    const patternEnd = pattern.endDate ? parseISO(pattern.endDate) : null

    for (const weekKey of weekKeys) {
      const dueDate = dueDateForWeekAndDay(weekKey, pattern.dayOfWeek)

      // Boundary checks
      if (isBefore(dueDate, patternStart)) continue
      if (patternEnd && isAfter(dueDate, patternEnd)) continue

      const dueDateStr = formatDate(dueDate)
      const key = `${pattern.id}::${weekKey}`
      const existing = existingByKey.get(key)

      if (existing) {
        // User-edited or skipped: leave it alone
        if (existing.isPatternOverride || existing.isSkipped) continue

        // Check if pattern metadata changed — update if so
        const needsUpdate =
          existing.title !== pattern.title ||
          existing.dueTime !== pattern.dueTime ||
          existing.category !== pattern.category ||
          existing.priority !== pattern.priority ||
          existing.dueDate !== dueDateStr

        if (needsUpdate) {
          toUpdate.push({
            ...existing,
            title: pattern.title,
            dueDate: dueDateStr,
            dueTime: pattern.dueTime,
            category: pattern.category,
            priority: pattern.priority,
            updatedAt: now,
          })
        }
        continue
      }

      // Not yet generated — create
      toCreate.push({
        id: nanoid(),
        courseId: pattern.courseId,
        title: pattern.title,
        dueDate: dueDateStr,
        dueTime: pattern.dueTime,
        status: 'not_started',
        priority: pattern.priority,
        category: pattern.category,
        notes: pattern.notes,
        source: 'recurring',
        recurringPatternId: pattern.id,
        weekKey,
        isPatternOverride: false,
        isSkipped: false,
        createdAt: now,
        updatedAt: now,
      })
    }
  }

  return { toCreate, toUpdate }
}

/**
 * When a pattern is edited (future only), returns updated assignment objects
 * for all future unoverridden occurrences of that pattern.
 */
export function computePatternEditUpdates(
  patternId: string,
  patchedPattern: RecurringPattern,
  existingAssignments: Assignment[],
): Assignment[] {
  const today = formatDate(startOfISOWeek(new Date()))
  const now = nowISO()

  return existingAssignments
    .filter(
      (a) =>
        a.recurringPatternId === patternId &&
        !a.isPatternOverride &&
        !a.isSkipped &&
        a.dueDate >= today,
    )
    .map((a) => ({
      ...a,
      title: patchedPattern.title,
      dueTime: patchedPattern.dueTime,
      category: patchedPattern.category,
      priority: patchedPattern.priority,
      courseId: patchedPattern.courseId,
      updatedAt: now,
    }))
}

/** Preview upcoming occurrences for a pattern (for the UI preview list) */
export function previewPatternOccurrences(
  pattern: RecurringPattern,
  count = 8,
): string[] {
  const weekKeys = generateWeekKeys(count + 2)
  const patternStart = parseISO(pattern.startDate)
  const patternEnd = pattern.endDate ? parseISO(pattern.endDate) : null

  const dates: string[] = []
  for (const weekKey of weekKeys) {
    if (dates.length >= count) break
    const dueDate = dueDateForWeekAndDay(weekKey, pattern.dayOfWeek)
    if (isBefore(dueDate, patternStart)) continue
    if (patternEnd && isAfter(dueDate, patternEnd)) break
    if (pattern.skippedWeekKeys.includes(weekKey)) continue
    dates.push(`${toWeekKey(dueDate)}::${formatDate(dueDate)}`)
  }
  return dates
}
