import { nanoid } from 'nanoid'
import type { StateCreator } from 'zustand'
import type { Assignment, CanvasImportSession } from '../types'
import { nowISO } from '../utils/dateHelpers'
import { parseIcal } from '../utils/icalParser'
import { matchCourse, mapCategory } from '../utils/courseMatch'
import type { RootSlice } from './types'

export interface ImportSlice {
  importSessions: CanvasImportSession[]
  importFromIcal: (rawIcal: string, source: 'ical_url' | 'ics_file') => CanvasImportSession
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()
}

export const createImportSlice: StateCreator<RootSlice, [['zustand/immer', never]], [], ImportSlice> = (set, get) => ({
  importSessions: [],

  importFromIcal: (rawIcal, source) => {
    const events = parseIcal(rawIcal)
    const state = get()
    const courses = state.courses

    // Build fast-lookup maps
    const byCanvasUid = new Map<string, Assignment>()
    for (const a of state.assignments) {
      if (a.canvasUid) byCanvasUid.set(a.canvasUid, a)
    }

    const byCoursetitleDate = new Map<string, Assignment>()
    for (const a of state.assignments) {
      const course = courses.find((c) => c.id === a.courseId)
      if (course) {
        const k = `${a.courseId}::${normalize(a.title)}::${a.dueDate}`
        byCoursetitleDate.set(k, a)
      }
    }

    let created = 0
    let updated = 0
    let skipped = 0
    const toUpsert: Assignment[] = []
    const now = nowISO()

    for (const event of events) {
      const course = matchCourse(event, courses)
      const category = mapCategory(event)

      // Dedup check 1: Canvas UID
      if (event.uid && byCanvasUid.has(event.uid)) {
        const existing = byCanvasUid.get(event.uid)!
        const titleChanged = existing.title !== event.summary
        const dateChanged = existing.dueDate !== event.dueDate
        if (titleChanged || dateChanged) {
          toUpsert.push({
            ...existing,
            title: event.summary,
            dueDate: event.dueDate,
            dueTime: event.dueTime ?? existing.dueTime,
            category: category ?? existing.category,
            updatedAt: now,
          })
          updated++
        } else {
          skipped++
        }
        continue
      }

      // Dedup check 2: course + normalized title + due date
      if (course) {
        const dupeKey = `${course.id}::${normalize(event.summary)}::${event.dueDate}`
        if (byCoursetitleDate.has(dupeKey)) {
          const existing = byCoursetitleDate.get(dupeKey)!
          toUpsert.push({
            ...existing,
            canvasUid: event.uid || existing.canvasUid,
            source: 'canvas_import',
            updatedAt: now,
          })
          updated++
          continue
        }
      }

      // Create new
      toUpsert.push({
        id: nanoid(),
        courseId: course?.id ?? '__unmatched__',
        title: event.summary,
        dueDate: event.dueDate,
        dueTime: event.dueTime,
        status: 'not_started',
        priority: 'medium',
        category,
        notes: event.description,
        source: 'canvas_import',
        canvasUid: event.uid || undefined,
        createdAt: now,
        updatedAt: now,
      })
      created++
    }

    const session: CanvasImportSession = {
      id: nanoid(),
      importedAt: now,
      source,
      itemsTotal: events.length,
      itemsCreated: created,
      itemsUpdated: updated,
      itemsSkipped: skipped,
    }

    set((state) => {
      const byId = new Map(state.assignments.map((a) => [a.id, a]))
      for (const item of toUpsert) {
        byId.set(item.id, item)
      }
      state.assignments = Array.from(byId.values())
      state.importSessions.push(session)
    })

    return session
  },
})
