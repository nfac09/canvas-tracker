import { nanoid } from 'nanoid'
import { parseISO } from 'date-fns'
import type { StateCreator } from 'zustand'
import type { RecurrenceSuggestion } from '../types'
import { nowISO } from '../utils/dateHelpers'
import { toWeekKey } from '../utils/weekKey'
import { detectRecurringSeries } from '../utils/recurrenceDetector'
import type { RootSlice } from './types'

export interface SuggestionSlice {
  recurrenceSuggestions: RecurrenceSuggestion[]
  detectSuggestions: () => void
  acceptSuggestion: (id: string) => void
  dismissSuggestion: (id: string) => void
}

export const createSuggestionSlice: StateCreator<
  RootSlice,
  [['zustand/immer', never]],
  [],
  SuggestionSlice
> = (set, get) => ({
  recurrenceSuggestions: [],

  detectSuggestions: () => {
    const state = get()
    const detected = detectRecurringSeries(
      state.assignments,
      state.recurringPatterns,
      state.recurrenceSuggestions,
    )
    if (detected.length === 0) return

    const now = nowISO()
    set((s) => {
      for (const d of detected) {
        s.recurrenceSuggestions.push({
          id: nanoid(),
          courseId: d.courseId,
          suggestedTitle: d.suggestedTitle,
          dayOfWeek: d.dayOfWeek,
          dueTime: d.dueTime,
          category: d.category,
          priority: d.priority,
          startDate: d.startDate,
          endDate: d.endDate,
          confidence: d.confidence,
          evidenceCount: d.evidenceCount,
          evidenceIds: d.evidenceIds,
          status: 'pending',
          createdAt: now,
        })
      }
    })
  },

  acceptSuggestion: (id) => {
    const state = get()
    const suggestion = state.recurrenceSuggestions.find((s) => s.id === id)
    if (!suggestion || suggestion.status !== 'pending') return

    const patternId = nanoid()
    const now = nowISO()

    set((s) => {
      // Create the recurring pattern
      s.recurringPatterns.push({
        id: patternId,
        courseId: suggestion.courseId,
        title: suggestion.suggestedTitle,
        dayOfWeek: suggestion.dayOfWeek,
        dueTime: suggestion.dueTime ?? '23:59',
        category: suggestion.category,
        priority: suggestion.priority,
        startDate: suggestion.startDate,
        endDate: undefined,
        active: true,
        skippedWeekKeys: [],
        createdAt: now,
        updatedAt: now,
      })

      // Stamp evidence assignments with recurringPatternId + weekKey so
      // generateFromPatterns won't re-create them as duplicates.
      const byId = new Map(s.assignments.map((a) => [a.id, a]))
      for (const evidenceId of suggestion.evidenceIds) {
        const a = byId.get(evidenceId)
        if (!a) continue
        byId.set(evidenceId, {
          ...a,
          recurringPatternId: patternId,
          weekKey: toWeekKey(parseISO(a.dueDate)),
          updatedAt: now,
        })
      }
      s.assignments = Array.from(byId.values())

      // Mark suggestion accepted
      const idx = s.recurrenceSuggestions.findIndex((sug) => sug.id === id)
      if (idx !== -1) s.recurrenceSuggestions[idx].status = 'accepted'
    })

    // Generate future occurrences from the new pattern
    get().generateFromPatterns()
  },

  dismissSuggestion: (id) => {
    set((s) => {
      const idx = s.recurrenceSuggestions.findIndex((sug) => sug.id === id)
      if (idx !== -1) s.recurrenceSuggestions[idx].status = 'rejected'
    })
  },
})
