import ICAL from 'ical.js'
import { format } from 'date-fns'

export interface ParsedIcalEvent {
  uid: string
  summary: string
  dtstart: Date
  dueDate: string
  dueTime: string | undefined
  description?: string
  rawText?: string
}

export function parseIcal(rawText: string): ParsedIcalEvent[] {
  let jcal: unknown
  try {
    jcal = ICAL.parse(rawText)
  } catch {
    throw new Error('Failed to parse iCal data. Please check the file or URL.')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const comp = new ICAL.Component(jcal as any)
  const vevents = comp.getAllSubcomponents('vevent')
  const results: ParsedIcalEvent[] = []

  for (const vevent of vevents) {
    try {
      const event = new ICAL.Event(vevent)
      const uid = event.uid || ''
      const summary = event.summary || 'Untitled'

      const startTime = event.startDate
      if (!startTime) continue

      const jsDate = startTime.toJSDate()
      const dueDate = format(jsDate, 'yyyy-MM-dd')

      // If the time is midnight and the event is all-day, skip the time
      const isAllDay = startTime.isDate
      const dueTime = isAllDay
        ? undefined
        : format(jsDate, 'HH:mm')

      const description = vevent.getFirstPropertyValue('description') as string | undefined

      results.push({
        uid,
        summary: summary.trim(),
        dtstart: jsDate,
        dueDate,
        dueTime,
        description: description?.trim() || undefined,
      })
    } catch {
      // Skip malformed events
    }
  }

  return results
}
