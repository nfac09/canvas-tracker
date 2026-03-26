import {
  getISOWeek,
  getISOWeekYear,
  startOfISOWeek,
  addWeeks,
  addDays,
} from 'date-fns'
import type { DayOfWeek } from '../types'

/** Returns a string like "2026-W13" for the ISO week of a date */
export function toWeekKey(date: Date): string {
  const week = getISOWeek(date)
  const year = getISOWeekYear(date)
  return `${year}-W${String(week).padStart(2, '0')}`
}

/** Given a weekKey like "2026-W13", return the Monday (start of that ISO week) */
export function weekKeyToMonday(weekKey: string): Date {
  const [yearStr, weekPart] = weekKey.split('-W')
  const year = parseInt(yearStr, 10)
  const week = parseInt(weekPart, 10)
  // ISO week 1 is the week containing the first Thursday of the year
  // Start from Jan 4 (always in week 1), get its Monday, then add weeks
  const jan4 = new Date(year, 0, 4)
  const week1Monday = startOfISOWeek(jan4)
  return addWeeks(week1Monday, week - 1)
}

/** Given a weekKey and a day of week (0=Sun, 6=Sat), return the due date */
export function dueDateForWeekAndDay(weekKey: string, dayOfWeek: DayOfWeek): Date {
  const monday = weekKeyToMonday(weekKey)
  // ISO week starts Monday. dayOfWeek 0=Sunday is the END of the week (offset +6)
  const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  return addDays(monday, offset)
}

/** Generate an array of weekKeys for current week + N ahead */
export function generateWeekKeys(weeksAhead: number): string[] {
  const now = new Date()
  const currentWeekStart = startOfISOWeek(now)
  const keys: string[] = []
  for (let i = 0; i <= weeksAhead; i++) {
    const weekDate = addWeeks(currentWeekStart, i)
    keys.push(toWeekKey(weekDate))
  }
  return keys
}
