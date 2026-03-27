import { nanoid } from 'nanoid'
import type { StateCreator } from 'zustand'
import type { Assignment, CanvasImportSession, Course } from '../types'
import { nowISO } from '../utils/dateHelpers'
import { parseIcal } from '../utils/icalParser'
import {
  findMatchingCourse,
  mapCategory,
} from '../utils/courseMatch'
import { parseImportTitle } from '../utils/titleNormalizer'
import type { RootSlice } from './types'

// ─── Course color palette (cycling) ──────────────────────────────────────────

const COURSE_COLORS = [
  '#6366f1', // indigo
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#3b82f6', // blue
  '#ef4444', // red
  '#8b5cf6', // violet
  '#14b8a6', // teal
  '#f97316', // orange
  '#84cc16', // lime
  '#06b6d4', // cyan
  '#a855f7', // purple
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Normalize a string to a compact alphanumeric key for dedup lookups. */
function normKey(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

/** Normalize for assignment title dedup (keeps spaces). */
function normTitle(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()
}

// ─── Slice ────────────────────────────────────────────────────────────────────

export interface ImportSlice {
  importSessions: CanvasImportSession[]
  importFromIcal: (rawIcal: string, source: 'ical_url' | 'ics_file') => CanvasImportSession
}

export const createImportSlice: StateCreator<RootSlice, [['zustand/immer', never]], [], ImportSlice> = (set, get) => ({
  importSessions: [],

  importFromIcal: (rawIcal, source) => {
    const events = parseIcal(rawIcal)
    const state = get()
    const now = nowISO()

    // ── Working course list ────────────────────────────────────────────────
    // Starts as a copy of existing courses and grows as new ones are inferred.
    // Every call to resolveOrCreateCourse searches this list, so events later
    // in the feed automatically reuse courses created by earlier events.
    let workingCourses: Course[] = [...state.courses]

    // Courses created during this import pass, keyed by normKey(inferredName).
    // Used for collecting what needs to be persisted.
    const pendingCourses = new Map<string, Course>()

    /**
     * Given an inferred course name, either:
     *  1. Returns an existing course that scores ≥ 0.5 against the name, or
     *  2. Creates a new Course, registers it in workingCourses and pendingCourses,
     *     and returns it.
     * Returns null if inferredName is empty/null.
     */
    function resolveOrCreateCourse(inferredName: string | null): Course | null {
      if (!inferredName || !inferredName.trim()) return null

      // Try fuzzy match against working list (existing + already-pending this pass)
      const match = findMatchingCourse(inferredName, workingCourses)
      if (match) return match

      // No match — create a new course
      const colorIdx = workingCourses.length % COURSE_COLORS.length
      const newCourse: Course = {
        id: nanoid(),
        name: inferredName.trim(),
        color: COURSE_COLORS[colorIdx],
        importedName: inferredName.trim(),
        createdAt: now,
        updatedAt: now,
      }

      pendingCourses.set(normKey(inferredName), newCourse)
      workingCourses = [...workingCourses, newCourse]
      return newCourse
    }

    // ── Assignment dedup maps ──────────────────────────────────────────────

    const byCanvasUid = new Map<string, Assignment>()
    for (const a of state.assignments) {
      if (a.canvasUid) byCanvasUid.set(a.canvasUid, a)
    }

    // Key: courseId::normalizedTitle::dueDate
    // Uses rawTitle when available so previously-cleaned titles still match.
    const byCoursetitleDate = new Map<string, Assignment>()
    for (const a of state.assignments) {
      const course = state.courses.find((c) => c.id === a.courseId)
      if (course) {
        const k = `${a.courseId}::${normTitle(a.rawTitle ?? a.title)}::${a.dueDate}`
        byCoursetitleDate.set(k, a)
      }
    }

    // ── Main import loop ───────────────────────────────────────────────────

    let created = 0
    let updated = 0
    let skipped = 0
    const toUpsert: Assignment[] = []

    for (const event of events) {
      const parsed = parseImportTitle(event.summary, event.description)
      const course = resolveOrCreateCourse(parsed.inferredCourseName ?? null)
      const category = mapCategory(event)
      const cleanTitle = parsed.primaryTitle
      const rawTitle = cleanTitle !== event.summary ? event.summary : undefined
      const contextLabel = parsed.contextLabel

      // Dedup 1: Canvas UID match — update if title or date changed
      if (event.uid && byCanvasUid.has(event.uid)) {
        const existing = byCanvasUid.get(event.uid)!
        const prevRaw = existing.rawTitle ?? existing.title
        const titleChanged = prevRaw !== event.summary
        const dateChanged = existing.dueDate !== event.dueDate
        if (titleChanged || dateChanged) {
          toUpsert.push({
            ...existing,
            title: cleanTitle,
            rawTitle,
            contextLabel,
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

      // Dedup 2: course + normalized title + due date
      if (course) {
        const dupeKey = `${course.id}::${normTitle(event.summary)}::${event.dueDate}`
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

      // New assignment
      toUpsert.push({
        id: nanoid(),
        courseId: course?.id ?? '__unmatched__',
        title: cleanTitle,
        rawTitle,
        contextLabel,
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

    // ── Persist ────────────────────────────────────────────────────────────

    const session: CanvasImportSession = {
      id: nanoid(),
      importedAt: now,
      source,
      itemsTotal: events.length,
      itemsCreated: created,
      itemsUpdated: updated,
      itemsSkipped: skipped,
      coursesCreated: pendingCourses.size,
    }

    set((state) => {
      // Add auto-created courses first so assignments can reference their IDs
      for (const course of pendingCourses.values()) {
        state.courses.push(course)
      }
      // Upsert assignments
      const byId = new Map(state.assignments.map((a) => [a.id, a]))
      for (const item of toUpsert) {
        byId.set(item.id, item)
      }
      state.assignments = Array.from(byId.values())
      state.importSessions.push(session)
    })

    // Trigger recurrence detection on newly imported data
    get().detectSuggestions()

    return session
  },
})
