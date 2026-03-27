import { useState } from 'react'
import { useStore } from '../../store'
import { getAllFamilyCandidates, type FamilyCandidate, type CandidateStatus } from '../../utils/recurrenceDetector'
import { getCourseById } from '../../store/selectors'

// Only rendered in development builds
if (!import.meta.env.DEV) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(globalThis as any).__recurrenceAuditDevOnly = true
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const STATUS_META: Record<CandidateStatus, { label: string; color: string }> = {
  accepted:             { label: '✓ Accepted',         color: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40' },
  below_threshold:      { label: `< 4 occurrences`,    color: 'text-slate-500 dark:text-slate-500 bg-slate-100 dark:bg-white/[0.05]' },
  insufficient_span:    { label: 'Span < 21 days',     color: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40' },
  gap_too_large:        { label: 'Gap > 56 days',      color: 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40' },
  inconsistent_day:     { label: 'Day inconsistent',   color: 'text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40' },
  duplicate_pattern:    { label: 'Dup: pattern',       color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40' },
  duplicate_suggestion: { label: 'Dup: suggestion',    color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40' },
  no_title:             { label: 'No clean title',     color: 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40' },
}

function logToConsole(candidates: FamilyCandidate[], courseNameMap: Map<string, string>) {
  const rows = candidates.map((c) => ({
    course: courseNameMap.get(c.courseId) ?? c.courseId,
    familyKey: c.familyKey,
    n: c.occurrenceCount,
    span: `${c.spanDays}d`,
    maxGap: `${c.maxGapDays}d`,
    day: c.dominantDayOfWeek !== null ? DAY_NAMES[c.dominantDayOfWeek] : '—',
    'day%': `${(c.dayCoverage * 100).toFixed(0)}%`,
    status: c.status,
    reason: c.rejectionReason ?? '',
    suggestedTitle: c.suggestedTitle ?? '',
    titles: c.titles.join(' | '),
  }))
  // eslint-disable-next-line no-console
  console.table(rows)
}

export function RecurrenceAuditPanel() {
  if (!import.meta.env.DEV) return null

  const assignments = useStore((s) => s.assignments)
  const courses = useStore((s) => s.courses)
  const patterns = useStore((s) => s.recurringPatterns)
  const suggestions = useStore((s) => s.recurrenceSuggestions)

  const [open, setOpen] = useState(false)
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set())

  const candidates = getAllFamilyCandidates(assignments, patterns, suggestions)

  const courseNameMap = new Map(courses.map((c) => [c.id, c.name]))

  const accepted = candidates.filter((c) => c.status === 'accepted')
  const rejected = candidates.filter((c) => c.status !== 'accepted')

  function toggleExpand(key: string) {
    setExpandedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <div className="mb-8 border border-dashed border-slate-300 dark:border-white/[0.12] rounded-xl overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 bg-slate-50 dark:bg-white/[0.03] hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors text-left"
      >
        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/20 bg-slate-200 dark:bg-white/[0.08] px-1.5 py-0.5 rounded">
          DEV
        </span>
        <span className="text-[12px] font-medium text-slate-600 dark:text-slate-400">
          Recurrence Audit
        </span>
        <span className="text-[11px] text-slate-400 dark:text-white/25">
          {accepted.length} accepted · {rejected.length} rejected · {candidates.length} total families
        </span>
        <span className="ml-auto text-[11px] text-slate-400 dark:text-white/20">
          {open ? '▲' : '▼'}
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-3 space-y-3">
          {/* Console output button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => logToConsole(candidates, courseNameMap)}
              className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-slate-100 dark:bg-white/[0.07] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/[0.12] transition-colors"
            >
              console.table() all candidates
            </button>
            <span className="text-[11px] text-slate-400 dark:text-white/20">
              Open DevTools → Console to see the full table
            </span>
          </div>

          {candidates.length === 0 && (
            <p className="text-[12px] text-slate-400 dark:text-white/25 py-2">
              No canvas_import assignments found. Import data to see the audit.
            </p>
          )}

          {candidates.length > 0 && (
            <div className="space-y-px">
              {/* Table header */}
              <div className="grid grid-cols-[1fr_2fr_36px_52px_52px_140px] gap-2 px-3 py-1 text-[9px] font-semibold uppercase tracking-wider text-slate-400 dark:text-white/20 border-b border-slate-100 dark:border-white/[0.06]">
                <span>Course</span>
                <span>Family key</span>
                <span className="text-right">N</span>
                <span className="text-right">Day%</span>
                <span className="text-right">MaxGap</span>
                <span>Status</span>
              </div>

              {candidates.map((c) => {
                const rowKey = `${c.courseId}::${c.familyKey}`
                const isExpanded = expandedKeys.has(rowKey)
                const courseName = courseNameMap.get(c.courseId) ?? c.courseId
                const course = getCourseById(courses, c.courseId)
                const meta = STATUS_META[c.status]

                return (
                  <div key={rowKey}>
                    <button
                      onClick={() => toggleExpand(rowKey)}
                      className="w-full grid grid-cols-[1fr_2fr_36px_52px_52px_140px] gap-2 px-3 py-[5px] text-left hover:bg-slate-50 dark:hover:bg-white/[0.03] rounded transition-colors"
                    >
                      {/* Course */}
                      <span className="flex items-center gap-1.5 min-w-0">
                        {course && (
                          <span
                            className="w-[5px] h-[5px] rounded-full shrink-0"
                            style={{ backgroundColor: course.color }}
                          />
                        )}
                        <span className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                          {courseName}
                        </span>
                      </span>

                      {/* Family key */}
                      <span className="text-[11px] font-mono text-slate-500 dark:text-white/35 truncate">
                        {c.familyKey}
                      </span>

                      {/* Count */}
                      <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 text-right tabular-nums">
                        {c.occurrenceCount}
                      </span>

                      {/* Day coverage */}
                      <span className={`text-[11px] text-right tabular-nums ${c.dayCoverage >= MIN_DAY_COVERAGE_DISPLAY ? 'text-slate-500 dark:text-white/30' : 'text-amber-600 dark:text-amber-500'}`}>
                        {c.dominantDayOfWeek !== null ? `${(c.dayCoverage * 100).toFixed(0)}%` : '—'}
                        {c.dominantDayOfWeek !== null ? ` ${DAY_NAMES[c.dominantDayOfWeek]}` : ''}
                      </span>

                      {/* Max gap */}
                      <span className={`text-[11px] text-right tabular-nums ${c.maxGapDays > 56 ? 'text-red-500 dark:text-red-400' : 'text-slate-400 dark:text-white/20'}`}>
                        {c.maxGapDays}d
                      </span>

                      {/* Status */}
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded truncate ${meta.color}`}>
                        {meta.label}
                      </span>
                    </button>

                    {/* Expanded: titles + reason */}
                    {isExpanded && (
                      <div className="mx-3 mb-1 px-3 py-2 bg-slate-50 dark:bg-white/[0.03] rounded-lg space-y-1.5">
                        {c.rejectionReason && (
                          <p className="text-[11px] text-amber-700 dark:text-amber-400">
                            ↳ {c.rejectionReason}
                          </p>
                        )}
                        {c.suggestedTitle && (
                          <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                            Suggested title: <span className="font-medium">"{c.suggestedTitle}"</span>
                          </p>
                        )}
                        <div className="space-y-0.5">
                          {c.titles.map((t, i) => (
                            <p key={i} className="text-[11px] text-slate-500 dark:text-white/30 font-mono">
                              · {t}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Used by the column display to highlight below-threshold day coverage
const MIN_DAY_COVERAGE_DISPLAY = 0.6
