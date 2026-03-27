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
  // Set when a course is auto-created during a Canvas import.
  // Stores the raw name as extracted from the iCal feed, for review.
  importedName?: string
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

  // For canvas_import: the original unmodified summary from the iCal feed.
  // Only stored when parseImportTitle actually changes the title.
  rawTitle?: string

  // Structural prefix extracted during import (e.g. "Module 8", "Week 7").
  // Displayed separately from the main title.
  contextLabel?: string

  // Grade fields
  pointsEarned?: number
  pointsPossible?: number
  letterGrade?: string
  gradeFeedback?: string

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
  // Number of new courses auto-created during this import (optional for
  // backward-compatibility with sessions persisted before this field existed).
  coursesCreated?: number
}

export interface AppSettings {
  weekStartsOn: 0 | 1
  recurringGenerationWeeksAhead: number
  theme: 'light' | 'dark'
}

export interface RecurrenceSuggestion {
  id: string
  courseId: string
  suggestedTitle: string
  dayOfWeek: DayOfWeek
  dueTime?: string
  category?: AssignmentCategory
  priority: AssignmentPriority
  startDate: string   // earliest evidence date — used as pattern startDate
  endDate: string     // latest evidence date — for display only
  confidence: 'high' | 'medium'
  evidenceCount: number
  evidenceIds: string[]  // IDs of assignments that triggered this detection
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
}
