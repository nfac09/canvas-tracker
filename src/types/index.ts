export type AssignmentStatus = 'not_started' | 'in_progress' | 'done'
export type AssignmentPriority = 'low' | 'medium' | 'high'
export type AssignmentCategory =
  | 'discussion'
  | 'quiz'
  | 'lab'
  | 'exam'
  | 'homework'
  | 'other'
export type AssignmentSource = 'manual' | 'canvas_import' | 'recurring'
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6

export interface Course {
  id: string
  name: string
  color: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface RecurringPattern {
  id: string
  courseId: string
  title: string
  dayOfWeek: DayOfWeek
  dueTime: string
  category?: AssignmentCategory
  priority: AssignmentPriority
  notes?: string
  startDate: string
  endDate?: string
  active: boolean
  skippedWeekKeys: string[]
  createdAt: string
  updatedAt: string
}

export interface Assignment {
  id: string
  courseId: string
  title: string
  dueDate: string
  dueTime?: string
  status: AssignmentStatus
  priority: AssignmentPriority
  category?: AssignmentCategory
  notes?: string
  source: AssignmentSource
  recurringPatternId?: string
  weekKey?: string
  isPatternOverride?: boolean
  isSkipped?: boolean
  canvasUid?: string
  createdAt: string
  updatedAt: string
}

export interface CanvasImportSession {
  id: string
  importedAt: string
  source: 'ical_url' | 'ics_file'
  itemsTotal: number
  itemsCreated: number
  itemsUpdated: number
  itemsSkipped: number
}

export interface AppSettings {
  weekStartsOn: 0 | 1
  recurringGenerationWeeksAhead: number
  theme: 'light'
}
