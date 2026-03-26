import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { createCourseSlice } from './courseSlice'
import { createAssignmentSlice } from './assignmentSlice'
import { createRecurringPatternSlice } from './recurringPatternSlice'
import { createImportSlice } from './importSlice'
import { createSettingsSlice } from './settingsSlice'
import { getSeedData } from '../utils/seedData'
import type { RootSlice } from './types'

export const useStore = create<RootSlice>()(
  persist(
    immer((...args) => ({
      schemaVersion: 1,
      ...createCourseSlice(...args),
      ...createAssignmentSlice(...args),
      ...createRecurringPatternSlice(...args),
      ...createImportSlice(...args),
      ...createSettingsSlice(...args),
    })),
    {
      name: 'canvas-tracker-v1',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state && state.courses.length === 0 && state.assignments.length === 0) {
          const seed = getSeedData()
          state.courses = seed.courses
          state.assignments = seed.assignments
          state.recurringPatterns = seed.recurringPatterns
          state.importSessions = seed.importSessions
          state.settings = seed.settings
          state.schemaVersion = seed.schemaVersion
        }
      },
    },
  ),
)
