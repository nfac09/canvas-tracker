import { nanoid } from 'nanoid'
import type { StateCreator } from 'zustand'
import type { RecurringPattern } from '../types'
import { nowISO } from '../utils/dateHelpers'
import {
  computeRecurringUpdates,
  computePatternEditUpdates,
} from '../utils/recurringGenerator'
import type { RootSlice } from './types'

export interface RecurringPatternSlice {
  recurringPatterns: RecurringPattern[]
  addPattern: (
    payload: Omit<RecurringPattern, 'id' | 'createdAt' | 'updatedAt' | 'skippedWeekKeys'>,
  ) => void
  updatePattern: (
    id: string,
    patch: Partial<Omit<RecurringPattern, 'id' | 'createdAt'>>,
    affectFutureOnly?: boolean,
  ) => void
  deletePattern: (id: string, deleteGenerated?: boolean) => void
  generateFromPatterns: () => void
}

export const createRecurringPatternSlice: StateCreator<
  RootSlice,
  [['zustand/immer', never]],
  [],
  RecurringPatternSlice
> = (set, get) => ({
  recurringPatterns: [],

  addPattern: (payload) => {
    set((state) => {
      state.recurringPatterns.push({
        ...payload,
        id: nanoid(),
        skippedWeekKeys: [],
        createdAt: nowISO(),
        updatedAt: nowISO(),
      })
    })
    get().generateFromPatterns()
  },

  updatePattern: (id, patch, affectFutureOnly = true) => {
    set((state) => {
      const idx = state.recurringPatterns.findIndex((p) => p.id === id)
      if (idx === -1) return
      const updated = { ...state.recurringPatterns[idx], ...patch, updatedAt: nowISO() }
      state.recurringPatterns[idx] = updated

      if (affectFutureOnly) {
        const futurePatchedUpdates = computePatternEditUpdates(
          id,
          updated,
          state.assignments,
        )
        const byId = new Map(state.assignments.map((a) => [a.id, a]))
        for (const u of futurePatchedUpdates) {
          byId.set(u.id, u)
        }
        state.assignments = Array.from(byId.values())
      }
    })
    get().generateFromPatterns()
  },

  deletePattern: (id, deleteGenerated = false) =>
    set((state) => {
      state.recurringPatterns = state.recurringPatterns.filter((p) => p.id !== id)
      if (deleteGenerated) {
        state.assignments = state.assignments.filter((a) => a.recurringPatternId !== id)
      } else {
        // Detach generated assignments (keep them but remove linkage)
        for (let i = 0; i < state.assignments.length; i++) {
          if (state.assignments[i].recurringPatternId === id) {
            state.assignments[i] = {
              ...state.assignments[i],
              recurringPatternId: undefined,
              weekKey: undefined,
              source: 'manual',
            }
          }
        }
      }
    }),

  generateFromPatterns: () =>
    set((state) => {
      const { toCreate, toUpdate } = computeRecurringUpdates(
        state.recurringPatterns,
        state.assignments,
        state.settings.recurringGenerationWeeksAhead,
      )
      const byId = new Map(state.assignments.map((a) => [a.id, a]))
      for (const a of [...toCreate, ...toUpdate]) {
        byId.set(a.id, a)
      }
      state.assignments = Array.from(byId.values())
    }),
})
