import type { CourseSlice } from './courseSlice'
import type { AssignmentSlice } from './assignmentSlice'
import type { RecurringPatternSlice } from './recurringPatternSlice'
import type { ImportSlice } from './importSlice'
import type { SettingsSlice } from './settingsSlice'
import type { SuggestionSlice } from './suggestionSlice'
import type { ResetSlice } from './resetSlice'

export type RootSlice = CourseSlice &
  AssignmentSlice &
  RecurringPatternSlice &
  ImportSlice &
  SettingsSlice &
  SuggestionSlice &
  ResetSlice & {
    schemaVersion: number
  }
