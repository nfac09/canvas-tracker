import {
  format,
  parseISO,
  isToday,
  isBefore,
  startOfDay,
  startOfWeek,
  endOfWeek,
  addWeeks,
  isWithinInterval,
  isSameDay,
} from 'date-fns'

export function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function parseDate(dateStr: string): Date {
  return parseISO(dateStr)
}

export function todayStr(): string {
  return formatDate(new Date())
}

export function nowISO(): string {
  return new Date().toISOString()
}

export function isOverdue(dueDate: string): boolean {
  const d = parseISO(dueDate)
  return isBefore(d, startOfDay(new Date())) && !isToday(d)
}

export function isDueToday(dueDate: string): boolean {
  return isToday(parseISO(dueDate))
}

export function isDueThisWeek(dueDate: string): boolean {
  const d = parseISO(dueDate)
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 0 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 0 })
  return isWithinInterval(d, { start: weekStart, end: weekEnd })
}

export function isDueNextTwoWeeks(dueDate: string): boolean {
  const d = parseISO(dueDate)
  const now = new Date()
  const nextWeekStart = addWeeks(startOfWeek(now, { weekStartsOn: 0 }), 1)
  const twoWeeksEnd = endOfWeek(addWeeks(now, 2), { weekStartsOn: 0 })
  return isWithinInterval(d, { start: nextWeekStart, end: twoWeeksEnd })
}

export function isSameDateStr(a: string, b: string): boolean {
  return isSameDay(parseISO(a), parseISO(b))
}

export function formatDisplayDate(dueDate: string, dueTime?: string): string {
  const d = parseISO(dueDate)
  const datePart = format(d, 'MMM d')
  if (!dueTime) return datePart
  const [h, m] = dueTime.split(':').map(Number)
  const timeDate = new Date()
  timeDate.setHours(h, m, 0, 0)
  return `${datePart} at ${format(timeDate, 'h:mm a')}`
}

export function formatDayOfWeek(day: 0 | 1 | 2 | 3 | 4 | 5 | 6): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[day]
}

export function formatTimeDisplay(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return format(d, 'h:mm a')
}
