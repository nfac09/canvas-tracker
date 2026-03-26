import { format, subDays, addDays } from 'date-fns'
import type {
  Course,
  RecurringPattern,
  Assignment,
  AppSettings,
  CanvasImportSession,
} from '../types'

function today(): string {
  return format(new Date(), 'yyyy-MM-dd')
}
function daysAgo(n: number): string {
  return format(subDays(new Date(), n), 'yyyy-MM-dd')
}
function daysFromNow(n: number): string {
  return format(addDays(new Date(), n), 'yyyy-MM-dd')
}
function now(): string {
  return new Date().toISOString()
}

export const SEED_COURSES: Course[] = [
  { id: 'c1', name: 'BIOL 201', color: '#10B981', createdAt: now(), updatedAt: now() },
  { id: 'c2', name: 'CS 350',   color: '#3B82F6', createdAt: now(), updatedAt: now() },
  { id: 'c3', name: 'HIST 110', color: '#F59E0B', createdAt: now(), updatedAt: now() },
  { id: 'c4', name: 'MATH 240', color: '#8B5CF6', createdAt: now(), updatedAt: now() },
]

export const SEED_PATTERNS: RecurringPattern[] = [
  {
    id: 'p1',
    courseId: 'c2',
    title: 'Film Lab',
    dayOfWeek: 0,
    dueTime: '23:59',
    category: 'lab',
    priority: 'medium',
    startDate: daysAgo(30),
    active: true,
    skippedWeekKeys: [],
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'p2',
    courseId: 'c3',
    title: 'Weekly Discussion Post',
    dayOfWeek: 3,
    dueTime: '23:59',
    category: 'discussion',
    priority: 'low',
    startDate: daysAgo(30),
    active: true,
    skippedWeekKeys: [],
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'p3',
    courseId: 'c4',
    title: 'Problem Set',
    dayOfWeek: 5,
    dueTime: '17:00',
    category: 'homework',
    priority: 'high',
    startDate: daysAgo(30),
    active: true,
    skippedWeekKeys: [],
    createdAt: now(),
    updatedAt: now(),
  },
]

export const SEED_ASSIGNMENTS: Assignment[] = [
  // 2 overdue
  {
    id: 'a1',
    courseId: 'c1',
    title: 'Lab Report: Cellular Respiration',
    dueDate: daysAgo(5),
    dueTime: '23:59',
    status: 'not_started',
    priority: 'high',
    category: 'lab',
    source: 'manual',
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'a2',
    courseId: 'c3',
    title: 'Reading Response: Chapter 4',
    dueDate: daysAgo(3),
    dueTime: '23:59',
    status: 'not_started',
    priority: 'medium',
    category: 'homework',
    source: 'manual',
    createdAt: now(),
    updatedAt: now(),
  },
  // 2 due today
  {
    id: 'a3',
    courseId: 'c2',
    title: 'Algorithm Analysis Homework',
    dueDate: today(),
    dueTime: '17:00',
    status: 'not_started',
    priority: 'high',
    category: 'homework',
    source: 'manual',
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'a4',
    courseId: 'c4',
    title: 'Quiz 3: Eigenvalues',
    dueDate: today(),
    dueTime: '11:59',
    status: 'not_started',
    priority: 'high',
    category: 'quiz',
    source: 'manual',
    createdAt: now(),
    updatedAt: now(),
  },
  // 2 in progress due this week
  {
    id: 'a5',
    courseId: 'c1',
    title: 'Genetics Study Guide',
    dueDate: daysFromNow(2),
    dueTime: '23:59',
    status: 'in_progress',
    priority: 'medium',
    category: 'homework',
    source: 'manual',
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'a6',
    courseId: 'c2',
    title: 'Project Proposal',
    dueDate: daysFromNow(3),
    dueTime: '11:59',
    status: 'in_progress',
    priority: 'high',
    category: 'other',
    source: 'manual',
    createdAt: now(),
    updatedAt: now(),
  },
  // 1 done
  {
    id: 'a7',
    courseId: 'c3',
    title: 'Introductory Essay',
    dueDate: daysAgo(7),
    dueTime: '23:59',
    status: 'done',
    priority: 'medium',
    category: 'homework',
    source: 'manual',
    createdAt: now(),
    updatedAt: now(),
  },
  // 1 future exam
  {
    id: 'a8',
    courseId: 'c1',
    title: 'Midterm Exam',
    dueDate: daysFromNow(10),
    dueTime: '10:00',
    status: 'not_started',
    priority: 'high',
    category: 'exam',
    notes: 'Covers chapters 1–6. Bring #2 pencil.',
    source: 'manual',
    createdAt: now(),
    updatedAt: now(),
  },
]

export const SEED_SETTINGS: AppSettings = {
  weekStartsOn: 0,
  recurringGenerationWeeksAhead: 8,
  theme: 'light',
}

export interface SeedState {
  courses: Course[]
  recurringPatterns: RecurringPattern[]
  assignments: Assignment[]
  importSessions: CanvasImportSession[]
  settings: AppSettings
  schemaVersion: number
}

export function getSeedData(): SeedState {
  return {
    courses: SEED_COURSES,
    recurringPatterns: SEED_PATTERNS,
    assignments: SEED_ASSIGNMENTS,
    importSessions: [],
    settings: SEED_SETTINGS,
    schemaVersion: 1,
  }
}
