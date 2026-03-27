import type { StateCreator } from 'zustand'
import { nowISO } from '../utils/dateHelpers'
import type { RootSlice } from './types'

export interface ResetSlice {
  /** ISO timestamp set when the user intentionally resets data. Persisted to
   *  prevent the seed-data loader from repopulating on the next page load. */
  dataResetAt?: string
  /** Wipes all user data. Settings (theme, week start, etc.) are preserved. */
  resetAllData: () => void
  /** Removes only Canvas-imported assignments and import history.
   *  Manually-created assignments, courses, and patterns are kept. */
  resetImportData: () => void
}

export const createResetSlice: StateCreator<RootSlice, [['zustand/immer', never]], [], ResetSlice> = (set) => ({
  dataResetAt: undefined,

  resetAllData: () => {
    set((state) => {
      state.assignments = []
      state.courses = []
      state.recurringPatterns = []
      state.importSessions = []
      state.recurrenceSuggestions = []
      state.dataResetAt = nowISO()
    })
  },

  resetImportData: () => {
    set((state) => {
      // Remove canvas-imported assignments
      state.assignments = state.assignments.filter((a) => a.source !== 'canvas_import')
      // Clear all import sessions
      state.importSessions = []
      // Clear pending recurrence suggestions (accepted ones stay; their
      // patterns and stamped assignments already belong to the user)
      state.recurrenceSuggestions = state.recurrenceSuggestions.filter(
        (s) => s.status !== 'pending',
      )
      state.dataResetAt = nowISO()
    })
  },
})
