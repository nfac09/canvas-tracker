/**
 * Parses a raw Canvas iCal event summary into structured fields.
 *
 * Two Canvas iCal formats are handled:
 *
 *  Format A (bracket-based):
 *    "Assignment Title [DEPT-NNNN-section-term | instructor]"
 *    Course code is extracted from the bracket; bracket is stripped.
 *
 *  Format B (prefix-based, legacy):
 *    "DEPT NNN - Assignment Title" or "Course Name: Assignment Title"
 *    Course name is inferred from the prefix; prefix is stripped.
 *
 * Pipeline (in order):
 *  1. Extract course code from trailing [...] (Format A)
 *  2. Strip the trailing [...] block
 *  3. Strip leading Canvas action prefix ("Submit | ", "View | ", …)
 *  4. Extract context label ("Module 8 - ", "Week 7 - ", …)
 *  5. If no bracket course, try prefix-based course inference (Format B)
 *  6. If still no course, check description for "Course: ..." label
 *  7. Normalize whitespace
 *  8. Safeguard: if result < MIN_LENGTH, return original unchanged
 */

const MIN_LENGTH = 3

// ─── Step 1: Course code from trailing bracket ────────────────────────────────

/**
 * Extracts a normalized course code from Canvas bracket metadata.
 *
 * Matches patterns like:
 *   [ENGL-1010-X14-X51-Spring 2026-XLIST | Brady]
 *   [AVSC 2150 X51 | 2026 Spring]
 *   [COMM-1020-X01-X51-Spring 2026-XLIST | ...]
 *
 * Returns "DEPT NNNN" (e.g. "ENGL 1010") or null.
 */
function extractCourseFromBracket(summary: string): string | null {
  const m = summary.match(/\[([A-Z]{2,6})[-\s](\d{3,4})\b/i)
  if (!m) return null
  return m[1].toUpperCase() + ' ' + m[2]
}

// ─── Step 2: Strip trailing bracket ──────────────────────────────────────────

function stripTrailingBracket(s: string): string {
  return s.replace(/\s*\[[^\]]*\]\s*$/, '').trim()
}

// ─── Step 3: Leading Canvas action prefix ─────────────────────────────────────

/**
 * Strips a leading "ACTION | " prefix where ACTION is a known Canvas verb.
 * Only matches known words to avoid false-positives on titles like
 * "Statistics | Chapter 5".
 */
const LEADING_ACTION_RE = /^(?:Submit|View|Take|Complete|Open|Start|Due)\s*\|\s*/i

function stripLeadingActionPrefix(s: string): string {
  return s.replace(LEADING_ACTION_RE, '').trim()
}

// ─── Step 4: Context label extraction ─────────────────────────────────────────

/**
 * Detects structured prefixes like "Module 8 - ", "Week 7 - ", "Chapter 3 - ".
 * Returns the label and the remaining title, or null if no match.
 */
const CONTEXT_LABEL_RE =
  /^(Module|Week|Chapter|Unit|Lesson|Ch\.?)\s+(\d+[a-zA-Z]?)\s*[-–]\s*(.+)$/i

interface ContextSplit {
  contextLabel: string
  rest: string
}

function extractContextLabel(s: string): ContextSplit | null {
  const m = s.match(CONTEXT_LABEL_RE)
  if (!m) return null
  const rest = m[3].trim()
  if (rest.length < MIN_LENGTH) return null
  // Normalize: "Module 8", "Week 7", "Chapter 3" — strip trailing dot from "Ch."
  const word = m[1].replace(/\.$/, '')
  const label =
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() + ' ' + m[2]
  return { contextLabel: label, rest }
}

// ─── Step 5: Prefix-based course inference (Format B fallback) ────────────────

/**
 * Words that indicate the prefix is an assignment title, not a course name.
 */
const ASSIGNMENT_PREFIX_RE =
  /^(homework|hw\b|quiz|exam|midterm|final|lab\b|discussion|problem\s*set|pset|project|reading|assignment|paper|essay|module|lesson|chapter|week|unit)\b/i

/**
 * Tries to infer a course name from a "COURSE - Title" or "Course: Title" pattern.
 * Returns { courseName, strippedTitle } or null.
 */
function inferAndStripCoursePrefix(
  s: string,
): { courseName: string; strippedTitle: string } | null {
  const m = s.match(/^(.{2,55}?)(?:\s+[-–]\s+|:\s+)(.{2,})$/)
  if (!m) return null
  const prefix = m[1].trim()
  const rest = m[2].trim()
  if (ASSIGNMENT_PREFIX_RE.test(prefix)) return null
  if (/^\d+$/.test(prefix)) return null
  if (rest.length < MIN_LENGTH) return null
  return { courseName: prefix, strippedTitle: rest }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface ParsedTitle {
  /** Clean, user-facing assignment title. */
  primaryTitle: string
  /** Structural context prefix if detected (e.g. "Module 8", "Week 7"). */
  contextLabel?: string
  /** Normalized course name/code inferred from the summary or description. */
  inferredCourseName?: string
}

/**
 * Full parsing pipeline for a Canvas iCal event summary.
 * See module-level JSDoc for the step-by-step description.
 */
export function parseImportTitle(
  rawSummary: string,
  description?: string,
): ParsedTitle {
  const raw = rawSummary.trim()
  if (raw.length <= MIN_LENGTH) return { primaryTitle: raw }

  // Step 1 — Course from trailing bracket (Format A)
  const bracketCourse = extractCourseFromBracket(raw)

  // Step 2 — Strip bracket
  let working = stripTrailingBracket(raw)

  // Step 3 — Strip leading action prefix
  working = stripLeadingActionPrefix(working)

  let contextLabel: string | undefined
  let inferredCourseName: string | undefined = bracketCourse ?? undefined

  if (bracketCourse) {
    // Format A: course already extracted. Apply context label extraction to
    // the cleaned title.
    const split = extractContextLabel(working)
    if (split) {
      contextLabel = split.contextLabel
      working = split.rest
    }
  } else {
    // Step 5 — Format B: try to extract and strip a course prefix first, then
    // look for a context label in what remains.
    const prefixResult = inferAndStripCoursePrefix(working)
    if (prefixResult) {
      inferredCourseName = prefixResult.courseName
      working = prefixResult.strippedTitle
      // Context label may follow the course prefix
      const split = extractContextLabel(working)
      if (split) {
        contextLabel = split.contextLabel
        working = split.rest
      }
    } else {
      // No course prefix — still try to extract a context label
      const split = extractContextLabel(working)
      if (split) {
        contextLabel = split.contextLabel
        working = split.rest
      }
    }

    // Step 6 — Description fallback
    if (!inferredCourseName && description) {
      const m = description.match(/Course:\s*([^\n\r,]+)/i)
      if (m) {
        const name = m[1].trim()
        if (name.length >= 2 && name.length <= 80) inferredCourseName = name
      }
    }
  }

  // Step 7 — Normalize whitespace + safeguard
  working = working.replace(/\s{2,}/g, ' ').trim()
  const primaryTitle = working.length >= MIN_LENGTH ? working : raw

  return { primaryTitle, contextLabel, inferredCourseName }
}
