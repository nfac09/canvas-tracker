import type { AssignmentCategory, Course } from '../types'
import type { ParsedIcalEvent } from './icalParser'

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()
}

export function matchCourse(event: ParsedIcalEvent, courses: Course[]): Course | null {
  if (courses.length === 0) return null

  const candidates: { course: Course; score: number }[] = []
  const summaryNorm = normalize(event.summary)
  const descNorm = event.description ? normalize(event.description) : ''

  for (const course of courses) {
    const courseNorm = normalize(course.name)
    if (!courseNorm) continue

    if (summaryNorm.includes(courseNorm) || courseNorm.includes(summaryNorm.split(' ')[0])) {
      candidates.push({ course, score: 2 })
    } else if (descNorm && descNorm.includes(courseNorm)) {
      candidates.push({ course, score: 1 })
    }
  }

  if (candidates.length === 0) return null
  candidates.sort((a, b) => b.score - a.score)
  return candidates[0].course
}

export function mapCategory(event: ParsedIcalEvent): AssignmentCategory | undefined {
  const text = [event.summary, event.description ?? ''].join(' ').toLowerCase()

  if (/\bquiz\b/.test(text)) return 'quiz'
  if (/\b(exam|midterm|final)\b/.test(text)) return 'exam'
  if (/\blab\b/.test(text)) return 'lab'
  if (/\bdiscussion\b/.test(text)) return 'discussion'
  if (/\b(homework|hw|problem set|pset|assignment)\b/.test(text)) return 'homework'
  return undefined
}
