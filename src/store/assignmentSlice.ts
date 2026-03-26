import { nanoid } from 'nanoid'
import type { StateCreator } from 'zustand'
import type { Assignment, AssignmentStatus } from '../types'
import { nowISO } from '../utils/dateHelpers'
import type { RootSlice } from './types'

export interface AssignmentSlice {
  assignments: Assignment[]
  addAssignment: (payload: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateAssignment: (id: string, patch: Partial<Omit<Assignment, 'id' | 'createdAt'>>) => void
  deleteAssignment: (id: string) => void
  setStatus: (id: string, status: AssignmentStatus) => void
  skipOccurrence: (id: string) => void
  upsertAssignments: (items: Assignment[]) => void
}

export const createAssignmentSlice: StateCreator<RootSlice, [['zustand/immer', never]], [], AssignmentSlice> = (set) => ({
  assignments: [],

  addAssignment: (payload) =>
    set((state) => {
      state.assignments.push({
        ...payload,
        id: nanoid(),
        createdAt: nowISO(),
        updatedAt: nowISO(),
      })
    }),

  updateAssignment: (id, patch) =>
    set((state) => {
      const idx = state.assignments.findIndex((a) => a.id === id)
      if (idx !== -1) {
        state.assignments[idx] = { ...state.assignments[idx], ...patch, updatedAt: nowISO() }
      }
    }),

  deleteAssignment: (id) =>
    set((state) => {
      state.assignments = state.assignments.filter((a) => a.id !== id)
    }),

  setStatus: (id, status) =>
    set((state) => {
      const idx = state.assignments.findIndex((a) => a.id === id)
      if (idx !== -1) {
        state.assignments[idx].status = status
        state.assignments[idx].updatedAt = nowISO()
      }
    }),

  skipOccurrence: (id) =>
    set((state) => {
      const idx = state.assignments.findIndex((a) => a.id === id)
      if (idx !== -1) {
        state.assignments[idx].isSkipped = true
        state.assignments[idx].updatedAt = nowISO()
      }
    }),

  upsertAssignments: (items) =>
    set((state) => {
      const byId = new Map(state.assignments.map((a) => [a.id, a]))
      for (const item of items) {
        byId.set(item.id, item)
      }
      state.assignments = Array.from(byId.values())
    }),
})
