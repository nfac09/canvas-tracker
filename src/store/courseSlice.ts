import { nanoid } from 'nanoid'
import type { StateCreator } from 'zustand'
import type { Course } from '../types'
import { nowISO } from '../utils/dateHelpers'
import type { RootSlice } from './types'

export interface CourseSlice {
  courses: Course[]
  addCourse: (payload: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateCourse: (id: string, patch: Partial<Omit<Course, 'id' | 'createdAt'>>) => void
  deleteCourse: (id: string) => void
}

export const createCourseSlice: StateCreator<RootSlice, [['zustand/immer', never]], [], CourseSlice> = (set) => ({
  courses: [],

  addCourse: (payload) =>
    set((state) => {
      state.courses.push({
        ...payload,
        id: nanoid(),
        createdAt: nowISO(),
        updatedAt: nowISO(),
      })
    }),

  updateCourse: (id, patch) =>
    set((state) => {
      const idx = state.courses.findIndex((c) => c.id === id)
      if (idx !== -1) {
        state.courses[idx] = { ...state.courses[idx], ...patch, updatedAt: nowISO() }
      }
    }),

  deleteCourse: (id) =>
    set((state) => {
      state.courses = state.courses.filter((c) => c.id !== id)
      state.assignments = state.assignments.filter((a) => a.courseId !== id)
      state.recurringPatterns = state.recurringPatterns.filter((p) => p.courseId !== id)
    }),
})
