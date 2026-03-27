import type { StateCreator } from 'zustand'
import type { AppSettings } from '../types'
import type { RootSlice } from './types'

export interface SettingsSlice {
  settings: AppSettings
  updateSettings: (patch: Partial<AppSettings>) => void
}

export const createSettingsSlice: StateCreator<RootSlice, [['zustand/immer', never]], [], SettingsSlice> = (set) => ({
  settings: {
    weekStartsOn: 1,
    recurringGenerationWeeksAhead: 8,
    theme: 'light',
  },

  updateSettings: (patch) =>
    set((state) => {
      state.settings = { ...state.settings, ...patch }
    }),
})
