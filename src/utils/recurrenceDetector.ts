import { parseISO, differenceInDays } from 'date-fns'
import type {
  Assignment,
  RecurringPattern,
  RecurrenceSuggestion,
  AssignmentCategory,
  AssignmentPriority,
  DayOfWeek,
} from '../types'

export interface DetectedSeries {
  courseId: string
  suggestedTitle: string
  dayOfWeek: DayOfWeek
  dueTime: string | undefined
  category: AssignmentCategory | undefined
  priority: AssignmentPriority
  startDate: string
  endDate: string
  confidence: 'high' | 'medium'
  evidenceCount: number
  evidenceIds: string[]
}

// ── Constants ─────────────────────────────────────────────────────────────────

/** Minimum occurrences required to surface a recurring suggestion. */
const MIN_OCCURRENCES = 4

/**
 * Minimum calendar span (days) between the first and last occurrence.
 * Prevents a cluster of 4 assignments all due in the same week from being
 * treated as recurring.
 */
const MIN_SPAN_DAYS = 21

/**
 * Maximum gap (days) between consecutive occurrences.
 * 56 days (8 weeks) accommodates chapter-based assignments where
 * a professor assigns reading responses to chapters spread over
 * the entire semester with occasional multi-week gaps.
 */
const MAX_GAP_DAYS = 56

/**
 * Minimum fraction of occurrences on the dominant day of week.
 * 0.60 means 3 of 4 required at the minimum threshold (75%),
 * and 4 of 7 for a 7-occurrence series.
 */
const MIN_DAY_COVERAGE = 0.6

// ── Family extraction ─────────────────────────────────────────────────────────
//
// `parseImportTitle` already strips leading "Module N - " / "Week N - " into
// `contextLabel`, so `a.title` is clean of those prefixes.
// These functions strip the remaining per-occurrence context: trailing
// chapter/round numbers, colon-separated labels, embedded chapter ranges, etc.

/**
 * Returns a human-readable series name by stripping per-occurrence context.
 * Preserves original capitalization.
 *
 * Patterns stripped (in order):
 *  1. Leading "Chapter/Module/Week N[N] " before content (no separator needed)
 *     e.g. "Chapter 14 & 15 Quiz" → "Quiz"
 *  2. Trailing "[-–:] Round/Chapter/Part/Module/Week N" (with separator)
 *     e.g. "Simulation: US Deregulation - Round 6" → "Simulation: US Deregulation"
 *     e.g. "Reflection: Module 7" → "Reflection"
 *  3. Trailing "Round/Part N" without any separator
 *     e.g. "Simulation Round 6" → "Simulation"
 *  4. Trailing ", Chapter N-M" / "Chapters N & M" (no separator required)
 *     e.g. "Reading Response, Chapter 14–15" → "Reading Response"
 *  5. Trailing "Module/Week/Chapter N" (space-only separator)
 *     e.g. "Lab Module 8" → "Lab"
 *  6. Trailing bare "- N" or trailing standalone number
 *     e.g. "Discussion - 7" → "Discussion", "Discussion 7" → "Discussion"
 */
function extractFamilyName(title: string): string {
  const result = title
    // 1. Leading "Chapter/Module/Week NUMBERS " (no separator required)
    .replace(
      /^(?:chapters?|modules?|weeks?|units?|lessons?|ch\.?)\s+[\d\s&,\-–]+\s+/i,
      '',
    )
    // 2. Trailing "[-–:] Round/Chapter/Part/Module/Week N" (with separator)
    .replace(
      /\s*[-–:]\s*(?:round|chapter|part|module|week|unit|ch\.?)\s+[\d&, ]+\s*$/i,
      '',
    )
    // 3. Trailing "Round/Part N" without separator
    .replace(/\s+(?:round|part)\s+\d+[a-zA-Z]?\s*$/i, '')
    // 4. Trailing ", Chapter N-M" / "Chapter N & M" (no separator required)
    .replace(/\s*,?\s*chapters?\s+[\d\s&\-–]+\s*$/i, '')
    // 5. Trailing "Module/Week/Chapter N" (space-only separator)
    .replace(/\s*\b(?:module|week|chapter|unit|lesson)\s+\d+[a-zA-Z]?\b\s*$/i, '')
    // 6a. Trailing bare "- N"
    .replace(/\s*[-–]\s*\d+\s*$/, '')
    // 6b. Trailing standalone number
    .replace(/\s+\d+\s*$/, '')
    // Trim edge noise
    .replace(/[\s\-–:,]+$/, '')
    .replace(/^[\s\-–:,]+/, '')
    .replace(/\s+/g, ' ')
    .trim()

  return result.length >= 2 ? result : title.trim()
}

/**
 * Lowercase, punctuation-stripped grouping key from `extractFamilyName`.
 * Used to cluster assignments into recurring series.
 */
function extractFamilyKey(title: string): string {
  return extractFamilyName(title)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Derives the best human-readable series title for a group of assignments.
 * Picks the most-common `extractFamilyName` result; breaks ties by shorter length.
 */
function bestFamilyName(assignments: Assignment[]): string {
  const freq = new Map<string, number>()
  for (const a of assignments) {
    const name = extractFamilyName(a.title)
    freq.set(name, (freq.get(name) ?? 0) + 1)
  }
  let best = ''
  let bestCount = 0
  for (const [name, count] of freq) {
    if (count > bestCount || (count === bestCount && name.length < best.length)) {
      best = name
      bestCount = count
    }
  }
  return best
}

// ── Calendar helpers ──────────────────────────────────────────────────────────

function getDayOfWeek(dateStr: string): DayOfWeek {
  return parseISO(dateStr).getDay() as DayOfWeek
}

/**
 * Finds the most-common day of week across dates and returns it with
 * the fraction of dates that fall on that day.
 */
function findDominantDay(dates: string[]): { dayOfWeek: DayOfWeek; coverage: number } | null {
  if (dates.length === 0) return null
  const freq = new Map<DayOfWeek, number>()
  for (const d of dates) {
    const day = getDayOfWeek(d)
    freq.set(day, (freq.get(day) ?? 0) + 1)
  }
  let bestDay: DayOfWeek = 0
  let bestCount = 0
  for (const [day, count] of freq) {
    if (count > bestCount) { bestDay = day; bestCount = count }
  }
  return { dayOfWeek: bestDay, coverage: bestCount / dates.length }
}

/**
 * Returns true if the sorted dates plausibly represent a recurring series:
 *  - Total span ≥ MIN_SPAN_DAYS  (not a single-week cluster)
 *  - No single gap > MAX_GAP_DAYS  (not two separate semesters)
 */
function isPlausibleSeries(sortedDates: string[]): { ok: boolean; reason?: string } {
  if (sortedDates.length < 2) return { ok: false, reason: 'fewer than 2 dates' }

  const totalSpan = differenceInDays(
    parseISO(sortedDates[sortedDates.length - 1]),
    parseISO(sortedDates[0]),
  )
  if (totalSpan < MIN_SPAN_DAYS) {
    return { ok: false, reason: `span ${totalSpan}d < ${MIN_SPAN_DAYS}d minimum` }
  }

  for (let i = 1; i < sortedDates.length; i++) {
    const gap = differenceInDays(parseISO(sortedDates[i]), parseISO(sortedDates[i - 1]))
    if (gap > MAX_GAP_DAYS) {
      return {
        ok: false,
        reason: `gap of ${gap}d between ${sortedDates[i - 1]} and ${sortedDates[i]} exceeds ${MAX_GAP_DAYS}d`,
      }
    }
  }

  return { ok: true }
}

// ── Dedup helpers ─────────────────────────────────────────────────────────────

function isDuplicateOfPattern(
  courseId: string,
  familyKey: string,
  dayOfWeek: DayOfWeek,
  patterns: RecurringPattern[],
): boolean {
  return patterns.some(
    (p) =>
      p.courseId === courseId &&
      p.dayOfWeek === dayOfWeek &&
      extractFamilyKey(p.title) === familyKey,
  )
}

function isDuplicateOfSuggestion(
  courseId: string,
  familyKey: string,
  dayOfWeek: DayOfWeek,
  suggestions: RecurrenceSuggestion[],
): boolean {
  return suggestions
    .filter((s) => s.status !== 'rejected')
    .some(
      (s) =>
        s.courseId === courseId &&
        s.dayOfWeek === dayOfWeek &&
        extractFamilyKey(s.suggestedTitle) === familyKey,
    )
}

// ── Diagnostic types ──────────────────────────────────────────────────────────

export type CandidateStatus =
  | 'accepted'
  | 'below_threshold'
  | 'insufficient_span'
  | 'gap_too_large'
  | 'inconsistent_day'
  | 'duplicate_pattern'
  | 'duplicate_suggestion'
  | 'no_title'

export interface FamilyCandidate {
  courseId: string
  familyKey: string
  titles: string[]          // a.title values (after parseImportTitle, before family extraction)
  contextLabels: string[]   // a.contextLabel values if present
  category: AssignmentCategory | undefined
  occurrenceCount: number
  firstDate: string
  lastDate: string
  spanDays: number
  maxGapDays: number
  dominantDayOfWeek: DayOfWeek | null
  dayCoverage: number       // 0–1
  status: CandidateStatus
  rejectionReason: string | null
  suggestedTitle: string | null
}

// ── Build family groups (shared between both exports) ─────────────────────────

function buildFamilyGroups(assignments: Assignment[]): Map<string, Map<string, Assignment[]>> {
  const candidates = assignments.filter(
    (a) => a.source === 'canvas_import' && !a.recurringPatternId && !a.isSkipped,
  )
  const byCourse = new Map<string, Map<string, Assignment[]>>()
  for (const a of candidates) {
    if (!byCourse.has(a.courseId)) byCourse.set(a.courseId, new Map())
    const byFamily = byCourse.get(a.courseId)!
    const key = extractFamilyKey(a.title)
    if (!key || key.length < 2) continue
    const list = byFamily.get(key) ?? []
    list.push(a)
    byFamily.set(key, list)
  }
  return byCourse
}

// ── Full audit export ─────────────────────────────────────────────────────────

/**
 * Returns diagnostic information for every candidate family across all courses,
 * including families that were rejected and the reason why.
 *
 * Used by the dev-mode RecurrenceAuditPanel to give full visibility into
 * what the detector is doing with the live dataset.
 */
export function getAllFamilyCandidates(
  assignments: Assignment[],
  existingPatterns: RecurringPattern[],
  existingSuggestions: RecurrenceSuggestion[],
): FamilyCandidate[] {
  const results: FamilyCandidate[] = []
  const byCourse = buildFamilyGroups(assignments)

  for (const [courseId, byFamily] of byCourse) {
    for (const [familyKey, members] of byFamily) {
      const sorted = [...members].sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      const dates = sorted.map((a) => a.dueDate)
      const firstDate = dates[0]
      const lastDate = dates[dates.length - 1]
      const spanDays = differenceInDays(parseISO(lastDate), parseISO(firstDate))
      const maxGap = dates.length < 2 ? 0 : Math.max(
        ...dates.slice(1).map((d, i) => differenceInDays(parseISO(d), parseISO(dates[i])))
      )

      const dominant = findDominantDay(dates)
      const titles = sorted.map((a) => a.title)
      const contextLabels = sorted.map((a) => a.contextLabel).filter(Boolean) as string[]
      const category = sorted[0].category

      let status: CandidateStatus = 'accepted'
      let rejectionReason: string | null = null
      let suggestedTitle: string | null = null

      if (members.length < MIN_OCCURRENCES) {
        status = 'below_threshold'
        rejectionReason = `${members.length} occurrence(s) — need ≥ ${MIN_OCCURRENCES}`
      } else {
        const plausibility = isPlausibleSeries(dates)
        if (!plausibility.ok) {
          if (spanDays < MIN_SPAN_DAYS) {
            status = 'insufficient_span'
          } else {
            status = 'gap_too_large'
          }
          rejectionReason = plausibility.reason ?? null
        } else if (!dominant || dominant.coverage < MIN_DAY_COVERAGE) {
          status = 'inconsistent_day'
          rejectionReason = `day coverage ${((dominant?.coverage ?? 0) * 100).toFixed(0)}% < ${MIN_DAY_COVERAGE * 100}% required`
        } else {
          const dayOfWeek = dominant.dayOfWeek
          if (isDuplicateOfPattern(courseId, familyKey, dayOfWeek, existingPatterns)) {
            status = 'duplicate_pattern'
            rejectionReason = 'already covered by an accepted recurring pattern'
          } else if (isDuplicateOfSuggestion(courseId, familyKey, dayOfWeek, existingSuggestions)) {
            status = 'duplicate_suggestion'
            rejectionReason = 'already exists as a pending/accepted suggestion'
          } else {
            const title = bestFamilyName(sorted)
            if (!title || title.length < 2) {
              status = 'no_title'
              rejectionReason = 'could not derive a clean series title'
            } else {
              suggestedTitle = title
            }
          }
        }
      }

      results.push({
        courseId,
        familyKey,
        titles,
        contextLabels,
        category,
        occurrenceCount: members.length,
        firstDate,
        lastDate,
        spanDays,
        maxGapDays: maxGap,
        dominantDayOfWeek: dominant?.dayOfWeek ?? null,
        dayCoverage: dominant?.coverage ?? 0,
        status,
        rejectionReason,
        suggestedTitle,
      })
    }
  }

  // Sort: accepted first, then by occurrence count descending
  return results.sort((a, b) => {
    if (a.status === 'accepted' && b.status !== 'accepted') return -1
    if (b.status === 'accepted' && a.status !== 'accepted') return 1
    return b.occurrenceCount - a.occurrenceCount
  })
}

// ── Main detection export ─────────────────────────────────────────────────────

/**
 * Analyzes canvas_import assignments to find recurring series.
 *
 * Acceptance criteria (applied in order):
 *  1. ≥ MIN_OCCURRENCES (4) assignments in the family
 *  2. Total span ≥ MIN_SPAN_DAYS (21 days) and no gap > MAX_GAP_DAYS (56 days)
 *  3. Dominant day of week has ≥ MIN_DAY_COVERAGE (60%) of occurrences
 *  4. Not already covered by an existing pattern or non-rejected suggestion
 *
 * Confidence:
 *  - "high"   ≥ 5 occurrences
 *  - "medium" = exactly 4 occurrences
 */
export function detectRecurringSeries(
  assignments: Assignment[],
  existingPatterns: RecurringPattern[],
  existingSuggestions: RecurrenceSuggestion[],
): DetectedSeries[] {
  const results: DetectedSeries[] = []
  const byCourse = buildFamilyGroups(assignments)

  for (const [courseId, byFamily] of byCourse) {
    for (const [familyKey, members] of byFamily) {
      if (members.length < MIN_OCCURRENCES) continue

      const sorted = [...members].sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      const dates = sorted.map((a) => a.dueDate)

      const plausibility = isPlausibleSeries(dates)
      if (!plausibility.ok) continue

      const dominant = findDominantDay(dates)
      if (!dominant || dominant.coverage < MIN_DAY_COVERAGE) continue

      const { dayOfWeek } = dominant

      if (isDuplicateOfPattern(courseId, familyKey, dayOfWeek, existingPatterns)) continue
      if (isDuplicateOfSuggestion(courseId, familyKey, dayOfWeek, existingSuggestions)) continue

      const suggestedTitle = bestFamilyName(sorted)
      if (!suggestedTitle || suggestedTitle.length < 2) continue

      if (import.meta.env.DEV) {
        const pct = (dominant.coverage * 100).toFixed(0)
        console.debug(
          `[recurrence] ACCEPT "${suggestedTitle}" | course=${courseId} key="${familyKey}" n=${sorted.length} day=${dayOfWeek} day%=${pct}%`,
        )
      }

      results.push({
        courseId,
        suggestedTitle,
        dayOfWeek,
        dueTime: sorted[0].dueTime,
        category: sorted[0].category,
        priority: sorted[0].priority,
        startDate: sorted[0].dueDate,
        endDate: sorted[sorted.length - 1].dueDate,
        confidence: sorted.length >= 5 ? 'high' : 'medium',
        evidenceCount: sorted.length,
        evidenceIds: sorted.map((a) => a.id),
      })
    }
  }

  return results
}
