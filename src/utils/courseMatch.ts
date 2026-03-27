import type { AssignmentCategory, Course } from '../types'
import type { ParsedIcalEvent } from './icalParser'
import { parseImportTitle } from './titleNormalizer'

// ─── Shared normalizer ────────────────────────────────────────────────────────

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()
}

// ─── Course-name inference ────────────────────────────────────────────────────

/**
 * Tries to extract a course name from the event summary and/or description.
 * Delegates to the full parseImportTitle pipeline, which handles both the
 * bracket-based format (Format A) and the prefix-based format (Format B).
 */
export function inferCourseNameFromEvent(event: ParsedIcalEvent): string | null {
  const parsed = parseImportTitle(event.summary, event.description)
  return parsed.inferredCourseName ?? null
}

// ─── Course matching ──────────────────────────────────────────────────────────

/**
 * Extracts a compact course code like "cs101" from a string.
 * Matches patterns like "CS 101", "MATH201", "BIO 101A".
 */
function extractCourseCode(name: string): string | null {
  const m = name.match(/\b([A-Za-z]{2,8})\s*(\d{2,4})\b/)
  if (!m) return null
  return m[1].toLowerCase() + m[2]
}

/**
 * Returns the set of meaningful letter tokens (≥ 2 chars) from a course name.
 */
function courseWordSet(name: string): Set<string> {
  return new Set(name.toLowerCase().match(/[a-z]{2,}/g) ?? [])
}

/**
 * Scores how well candidateName matches existingName on a 0–1 scale.
 *
 * Tiers:
 *  1.0 — exact after stripping non-alphanumeric ("CS 101" = "CS101")
 *  0.9 — shared course code ("CS 101" ~ "CS101 - Algorithms")
 *  0–1 — Jaccard similarity on word tokens (fallback for name-only courses)
 */
function scoreCourseName(existing: string, candidate: string): number {
  // 1. Exact (ignoring spaces/punctuation)
  const strip = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (strip(existing) === strip(candidate)) return 1.0

  // 2. Shared course code
  const codeA = extractCourseCode(existing)
  const codeB = extractCourseCode(candidate)
  if (codeA && codeB && codeA === codeB) return 0.9

  // 3. Jaccard on word tokens
  const wA = courseWordSet(existing)
  const wB = courseWordSet(candidate)
  if (wA.size === 0 || wB.size === 0) return 0

  const intersection = [...wA].filter((w) => wB.has(w)).length
  const union = new Set([...wA, ...wB]).size
  return intersection / union
}

const MATCH_THRESHOLD = 0.5

/**
 * Returns the best-scoring Course from courses whose score is at or above
 * MATCH_THRESHOLD, or null if nothing matches well enough.
 */
export function findMatchingCourse(
  candidateName: string,
  courses: Course[],
): Course | null {
  let best: { course: Course; score: number } | null = null

  for (const course of courses) {
    const score = scoreCourseName(course.name, candidateName)
    if (score >= MATCH_THRESHOLD && (!best || score > best.score)) {
      best = { course, score }
    }
  }

  return best?.course ?? null
}

/**
 * Backward-compatible entry point used outside the import slice.
 * Infers the course name from the event then fuzzy-matches against courses.
 * Falls back to a direct substring search on the summary/description.
 */
export function matchCourse(event: ParsedIcalEvent, courses: Course[]): Course | null {
  if (courses.length === 0) return null

  // Primary: infer name from event and score against courses
  const inferred = inferCourseNameFromEvent(event)
  if (inferred) {
    const match = findMatchingCourse(inferred, courses)
    if (match) return match
  }

  // Fallback: any course name appearing directly in the summary or description
  const summaryNorm = norm(event.summary)
  const descNorm = event.description ? norm(event.description) : ''

  let best: { course: Course; nameLen: number } | null = null
  for (const course of courses) {
    const courseNorm = norm(course.name)
    if (!courseNorm) continue
    if (summaryNorm.includes(courseNorm) || (descNorm && descNorm.includes(courseNorm))) {
      // Prefer the longer (more specific) match to avoid false positives on short names
      if (!best || courseNorm.length > best.nameLen) {
        best = { course, nameLen: courseNorm.length }
      }
    }
  }

  return best?.course ?? null
}

// ─── Category mapping ─────────────────────────────────────────────────────────

export function mapCategory(event: ParsedIcalEvent): AssignmentCategory | undefined {
  const text = [event.summary, event.description ?? ''].join(' ').toLowerCase()
  if (/\bquiz\b/.test(text)) return 'quiz'
  if (/\b(exam|midterm|final)\b/.test(text)) return 'exam'
  if (/\blab\b/.test(text)) return 'lab'
  if (/\bdiscussion\b/.test(text)) return 'discussion'
  if (/\b(homework|hw|problem set|pset|assignment)\b/.test(text)) return 'homework'
  return undefined
}
