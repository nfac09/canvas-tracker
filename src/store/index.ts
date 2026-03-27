import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { createCourseSlice } from './courseSlice'
import { createAssignmentSlice } from './assignmentSlice'
import { createRecurringPatternSlice } from './recurringPatternSlice'
import { createImportSlice } from './importSlice'
import { createSettingsSlice } from './settingsSlice'
import { createSuggestionSlice } from './suggestionSlice'
import { createResetSlice } from './resetSlice'
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
      ...createSuggestionSlice(...args),
      ...createResetSlice(...args),
    })),
    {
      name: 'canvas-tracker-v1',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (_state) => {
        // Nothing to do on rehydrate — app starts empty for new users
      },
    },
  ),
)
