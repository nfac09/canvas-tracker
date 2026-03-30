import { useState, useMemo } from 'react'
import { useStore } from '../store'
import { getCourseById } from '../store/selectors'
import { EmptyState } from '../components/ui/EmptyState'
import { GradeBadge, CategoryBadge } from '../components/ui/Badge'
import { GradeEntryModal } from '../components/assignments/GradeEntryModal'
import { formatDisplayDate } from '../utils/dateHelpers'
import type { Assignment } from '../types'

// ─── Grade helpers ───────────────────────────────────────────────────────────

function letterFromPercent(pct: number): string {
  if (pct >= 93) return 'A'
  if (pct >= 90) return 'A-'
  if (pct >= 87) return 'B+'
  if (pct >= 83) return 'B'
  if (pct >= 80) return 'B-'
  if (pct >= 77) return 'C+'
  if (pct >= 73) return 'C'
  if (pct >= 70) return 'C-'
  if (pct >= 67) return 'D+'
  if (pct >= 60) return 'D'
  return 'F'
}

function gradeTextColor(pct: number): string {
  if (pct >= 90) return 'text-emerald-600 dark:text-emerald-400'
  if (pct >= 80) return 'text-blue-600 dark:text-blue-400'
  if (pct >= 70) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

function gradeBarColor(pct: number): string {
  if (pct >= 90) return '#10b981'
  if (pct >= 80) return '#3b82f6'
  if (pct >= 70) return '#f59e0b'
  return '#ef4444'
}

interface CourseSummary {
  totalEarned: number
  totalPossible: number
  pct: number
  letter: string
}

function calcCourseSummary(list: Assignment[]): CourseSummary | null {
  let totalEarned = 0
  let totalPossible = 0
  let hasPoints = false
  for (const a of list) {
    if (a.pointsEarned !== undefined && a.pointsPossible) {
      totalEarned += a.pointsEarned
      totalPossible += a.pointsPossible
      hasPoints = true
    }
  }
  if (!hasPoints || totalPossible === 0) return null
  const pct = Math.round((totalEarned / totalPossible) * 100)
  return { totalEarned, totalPossible, pct, letter: letterFromPercent(pct) }
}

// ─── Section panel (collapsible) ─────────────────────────────────────────────

interface SectionPanelProps {
  title: string
  badge?: number
  badgeColor?: string
  defaultCollapsed?: boolean
  children: React.ReactNode
}

function SectionPanel({
  title,
  badge,
  badgeColor = '#6366f1',
  defaultCollapsed = false,
  children,
}: SectionPanelProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  return (
    <div className="mb-3 rounded-xl border border-slate-200 dark:border-white/[0.07] bg-white dark:bg-[#0f0f1a]">
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left group rounded-xl transition-colors duration-100 hover:bg-slate-50/80 dark:hover:bg-white/[0.025] active:bg-slate-100/60 dark:active:bg-white/[0.04]"
      >
        <span
          className="w-[3px] h-[11px] rounded-full shrink-0"
          style={{ backgroundColor: badgeColor, opacity: 0.9 }}
        />
        <span className="text-[10px] font-semibold text-slate-500 dark:text-white/35 uppercase tracking-widest group-hover:text-slate-700 dark:group-hover:text-white/55 transition-colors duration-100">
          {title}
        </span>
        {badge !== undefined && badge > 0 && (
          <span
            className="min-w-[17px] h-[17px] px-1.5 rounded flex items-center justify-center text-[9px] font-bold text-white tabular-nums"
            style={{ backgroundColor: badgeColor }}
          >
            {badge}
          </span>
        )}
        <span
          className={`ml-auto text-[9px] font-mono text-slate-300 dark:text-white/15 group-hover:text-slate-400 dark:group-hover:text-white/35 transition-all duration-200 inline-block ${collapsed ? 'rotate-0' : 'rotate-180'}`}
        >
          ▾
        </span>
      </button>

      {!collapsed && (
        <div className="border-t border-slate-100 dark:border-white/[0.05]">
          {children}
        </div>
      )}
    </div>
  )
}

// ─── Needs-grade row ──────────────────────────────────────────────────────────

interface NeedsGradeRowProps {
  assignment: Assignment
  onGrade: (a: Assignment) => void
}

function NeedsGradeRow({ assignment, onGrade }: NeedsGradeRowProps) {
  const courses = useStore((s) => s.courses)
  const course = getCourseById(courses, assignment.courseId)

  return (
    <div className="group flex items-center gap-3 px-3.5 py-[9px] hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors duration-100">
      {/* Course dot */}
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: course?.color ?? '#94a3b8' }}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-slate-800 dark:text-white/75 truncate leading-snug">
          {assignment.title}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {course && (
            <span className="text-[11px] text-slate-400 dark:text-white/25 font-medium">
              {course.name}
            </span>
          )}
          {assignment.category && (
            <>
              <span className="text-slate-200 dark:text-white/[0.09] text-[10px]">·</span>
              <CategoryBadge category={assignment.category} />
            </>
          )}
        </div>
      </div>

      {/* Due date */}
      <span className="text-[11px] text-slate-400 dark:text-white/25 tabular-nums shrink-0">
        {formatDisplayDate(assignment.dueDate)}
      </span>

      {/* Grade button */}
      <button
        onClick={() => onGrade(assignment)}
        className="shrink-0 text-[11px] font-medium px-2.5 py-[5px] rounded-md
          text-indigo-600 dark:text-indigo-400
          bg-indigo-50 dark:bg-indigo-500/10
          hover:bg-indigo-100 dark:hover:bg-indigo-500/20
          active:scale-[0.93] active:bg-indigo-100 dark:active:bg-indigo-500/25
          transition-all duration-100"
      >
        + Grade
      </button>
    </div>
  )
}

// ─── Graded assignment row ────────────────────────────────────────────────────

interface GradedRowProps {
  assignment: Assignment
  onEdit: (a: Assignment) => void
}

function GradedRow({ assignment, onEdit }: GradedRowProps) {
  const pct =
    assignment.pointsEarned !== undefined && assignment.pointsPossible
      ? Math.round((assignment.pointsEarned / assignment.pointsPossible) * 100)
      : null

  return (
    <div className="group flex items-center gap-3 px-3.5 py-[9px] hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors duration-100">
      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-slate-800 dark:text-white/75 truncate leading-snug">
          {assignment.title}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[11px] text-slate-400 dark:text-white/25 tabular-nums">
            {formatDisplayDate(assignment.dueDate)}
          </span>
          {assignment.category && (
            <>
              <span className="text-slate-200 dark:text-white/[0.09] text-[10px]">·</span>
              <CategoryBadge category={assignment.category} />
            </>
          )}
          {assignment.gradeFeedback && (
            <>
              <span className="text-slate-200 dark:text-white/[0.09] text-[10px]">·</span>
              <span
                className="text-[11px] text-slate-400 dark:text-white/25 truncate max-w-[140px]"
                title={assignment.gradeFeedback}
              >
                {assignment.gradeFeedback}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Points */}
      {assignment.pointsEarned !== undefined && assignment.pointsPossible && (
        <span className="text-[11px] text-slate-400 dark:text-white/25 tabular-nums shrink-0">
          {assignment.pointsEarned}/{assignment.pointsPossible}
        </span>
      )}

      {/* Grade badge */}
      <div className="shrink-0">
        <GradeBadge
          pointsEarned={assignment.pointsEarned}
          pointsPossible={assignment.pointsPossible}
          letterGrade={
            assignment.letterGrade ??
            (pct !== null ? letterFromPercent(pct) : undefined)
          }
        />
      </div>

      {/* Edit button (hover only) */}
      <button
        onClick={() => onEdit(assignment)}
        className="opacity-0 group-hover:opacity-100 shrink-0 p-[5px] rounded-md
          text-slate-400 dark:text-white/20
          hover:text-slate-700 dark:hover:text-white/70
          hover:bg-slate-100 dark:hover:bg-white/[0.08]
          active:scale-90 active:bg-slate-200 dark:active:bg-white/[0.12]
          text-[11px] leading-none transition-all duration-100"
        title="Edit grade"
      >
        ✎
      </button>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function GradesPage() {
  const assignments = useStore((s) => s.assignments)
  const courses = useStore((s) => s.courses)
  const [gradeTarget, setGradeTarget] = useState<Assignment | null>(null)

  const { graded, needsGrade } = useMemo(() => {
    const done = assignments.filter((a) => a.status === 'done' && !a.isSkipped)
    const graded = done.filter((a) => a.pointsEarned !== undefined || !!a.letterGrade)
    const needsGrade = done.filter((a) => a.pointsEarned === undefined && !a.letterGrade)
    return { graded, needsGrade }
  }, [assignments])

  const byCourse = useMemo(() => {
    const map = new Map<string, Assignment[]>()
    for (const a of graded) {
      const list = map.get(a.courseId) ?? []
      list.push(a)
      map.set(a.courseId, list)
    }
    return map
  }, [graded])

  // Overall weighted average (across all graded assignments with points)
  const overallSummary = useMemo(() => calcCourseSummary(graded), [graded])

  // Per-course summaries ordered by courses array
  const courseSummaries = useMemo(() => {
    return courses
      .filter((c) => byCourse.has(c.id))
      .map((c) => ({
        course: c,
        list: byCourse.get(c.id)!.sort((a, b) => b.dueDate.localeCompare(a.dueDate)),
        summary: calcCourseSummary(byCourse.get(c.id)!),
      }))
  }, [courses, byCourse])

  const isEmpty = graded.length === 0 && needsGrade.length === 0

  return (
    <div>
      {/* ─── Sticky 2-tier header ──────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-slate-50 dark:bg-[#0d0d13] border-b border-slate-200 dark:border-white/[0.06]">
        {/* Tier 1 */}
        <div className="px-7 pt-4 pb-3 flex items-center justify-between gap-6">
          <div className="min-w-0">
            <h1 className="text-[15px] font-semibold tracking-tight text-slate-900 dark:text-white/88 leading-none">
              Grades
            </h1>
            <p className="text-[11px] text-slate-400 dark:text-white/28 mt-[5px] tabular-nums">
              {graded.length} graded
              {needsGrade.length > 0 && (
                <span className="text-amber-500 dark:text-amber-400 ml-1.5 font-medium">
                  · {needsGrade.length} need{needsGrade.length === 1 ? 's' : ''} grade
                </span>
              )}
            </p>
          </div>
          {overallSummary && (
            <div className="flex items-center gap-2.5 shrink-0">
              <span className={`text-[22px] font-bold tabular-nums leading-none ${gradeTextColor(overallSummary.pct)}`}>
                {overallSummary.pct}%
              </span>
              <span className={`text-[14px] font-semibold ${gradeTextColor(overallSummary.pct)}`}>
                {overallSummary.letter}
              </span>
            </div>
          )}
        </div>

        {/* Tier 2 — course bar */}
        {courseSummaries.length > 1 && (
          <div className="px-7 py-[9px] border-t border-slate-100 dark:border-white/[0.04] bg-slate-50/60 dark:bg-black/[0.12] flex items-center gap-3 overflow-x-auto">
            {courseSummaries.map(({ course, summary }) => (
              <div key={course.id} className="flex items-center gap-1.5 shrink-0">
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: course.color }}
                />
                <span className="text-[11px] font-medium text-slate-500 dark:text-white/35 truncate max-w-[80px]">
                  {course.name}
                </span>
                {summary ? (
                  <span className={`text-[11px] font-semibold tabular-nums ${gradeTextColor(summary.pct)}`}>
                    {summary.pct}%
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-300 dark:text-white/15">—</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Content ───────────────────────────────────────────────────── */}
      {isEmpty ? (
        <div className="px-7 pt-10">
          <EmptyState
            icon="○"
            title="No grades yet"
            description="Grades appear here once you mark assignments as done and record a score. Start on the Assignments page."
          />
        </div>
      ) : (
        <div className="flex items-start gap-5 px-7 pt-4 pb-10">

          {/* ── Left: sections ──────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Needs Grade queue */}
            {needsGrade.length > 0 && (
              <SectionPanel
                title="Needs Grade"
                badge={needsGrade.length}
                badgeColor="#f59e0b"
                defaultCollapsed={false}
              >
                <div className="divide-y divide-slate-50 dark:divide-white/[0.03]">
                  {needsGrade
                    .sort((a, b) => b.dueDate.localeCompare(a.dueDate))
                    .map((a) => (
                      <NeedsGradeRow key={a.id} assignment={a} onGrade={setGradeTarget} />
                    ))}
                </div>
              </SectionPanel>
            )}

            {/* Graded by course */}
            {courseSummaries.map(({ course, list, summary }) => (
              <SectionPanel
                key={course.id}
                title={course.name}
                badge={list.length}
                badgeColor={course.color}
                defaultCollapsed={false}
              >
                {/* Course summary row */}
                {summary && (
                  <div className="flex items-center gap-3 px-3.5 py-2 border-b border-slate-50 dark:border-white/[0.03]">
                    <div className="flex-1">
                      <div className="w-full h-[4px] bg-slate-100 dark:bg-white/[0.07] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${summary.pct}%`,
                            backgroundColor: gradeBarColor(summary.pct),
                            boxShadow: `0 0 6px ${gradeBarColor(summary.pct)}88`,
                          }}
                        />
                      </div>
                    </div>
                    <span className={`text-[12px] font-bold tabular-nums shrink-0 ${gradeTextColor(summary.pct)}`}>
                      {summary.letter} · {summary.pct}%
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-white/25 tabular-nums shrink-0">
                      {summary.totalEarned}/{summary.totalPossible} pts
                    </span>
                  </div>
                )}

                <div className="divide-y divide-slate-50 dark:divide-white/[0.03]">
                  {list.map((a) => (
                    <GradedRow key={a.id} assignment={a} onEdit={setGradeTarget} />
                  ))}
                </div>
              </SectionPanel>
            ))}

            {/* Graded without a known course */}
            {(() => {
              const knownCourseIds = new Set(courses.map((c) => c.id))
              const orphaned = graded.filter((a) => !knownCourseIds.has(a.courseId))
              if (orphaned.length === 0) return null
              return (
                <SectionPanel title="Other" badge={orphaned.length} badgeColor="#94a3b8">
                  <div className="divide-y divide-slate-50 dark:divide-white/[0.03]">
                    {orphaned
                      .sort((a, b) => b.dueDate.localeCompare(a.dueDate))
                      .map((a) => (
                        <GradedRow key={a.id} assignment={a} onEdit={setGradeTarget} />
                      ))}
                  </div>
                </SectionPanel>
              )
            })()}
          </div>

          {/* ── Right: stats panel ──────────────────────────────────────── */}
          <div className="w-52 shrink-0 space-y-3 pt-0.5">

            {/* Overall summary */}
            {overallSummary && (
              <div className="rounded-xl border border-slate-200 dark:border-white/[0.07] overflow-hidden bg-white dark:bg-[#0f0f1a]">
                <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-white/[0.05]">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-white/25">
                    Overall
                  </p>
                </div>
                <div className="px-3.5 py-3">
                  <div className="flex items-end gap-2 mb-2">
                    <span className={`text-[32px] font-bold tabular-nums leading-none ${gradeTextColor(overallSummary.pct)}`}>
                      {overallSummary.letter}
                    </span>
                    <span className={`text-[14px] font-semibold mb-0.5 ${gradeTextColor(overallSummary.pct)}`}>
                      {overallSummary.pct}%
                    </span>
                  </div>
                  <div className="w-full h-[4px] bg-slate-100 dark:bg-white/[0.07] rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${overallSummary.pct}%`,
                        backgroundColor: gradeBarColor(overallSummary.pct),
                        boxShadow: `0 0 6px ${gradeBarColor(overallSummary.pct)}88`,
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-white/25 tabular-nums">
                    {overallSummary.totalEarned}/{overallSummary.totalPossible} pts · {graded.length} graded
                  </p>
                </div>
              </div>
            )}

            {/* Courses breakdown */}
            {courseSummaries.length > 0 && (
              <div className="rounded-xl border border-slate-200 dark:border-white/[0.07] overflow-hidden bg-white dark:bg-[#0f0f1a]">
                <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-white/[0.05]">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-white/25">
                    By Course
                  </p>
                </div>
                <div className="px-2 py-1.5">
                  {courseSummaries.map(({ course, list, summary }) => (
                    <div
                      key={course.id}
                      className="flex items-center gap-2 px-2 py-[5px] rounded-md hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors duration-100"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: course.color }}
                      />
                      <span className="flex-1 truncate text-[12px] text-slate-600 dark:text-white/45 font-medium">
                        {course.name}
                      </span>
                      {summary ? (
                        <span className={`text-[11px] font-semibold tabular-nums shrink-0 ${gradeTextColor(summary.pct)}`}>
                          {summary.pct}%
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 dark:text-white/25 tabular-nums shrink-0">
                          {list.length} graded
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Needs grade summary */}
            {needsGrade.length > 0 && (
              <div className="rounded-xl border border-amber-200/60 dark:border-amber-500/[0.15] overflow-hidden bg-amber-50/50 dark:bg-amber-950/[0.12]">
                <div className="px-3.5 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400/70 mb-1">
                    Needs Grade
                  </p>
                  <p className="text-[22px] font-bold tabular-nums leading-none text-amber-600 dark:text-amber-400">
                    {needsGrade.length}
                  </p>
                  <p className="text-[11px] text-amber-600/60 dark:text-amber-400/40 mt-0.5">
                    assignment{needsGrade.length !== 1 ? 's' : ''} awaiting
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <GradeEntryModal
        open={gradeTarget !== null}
        onClose={() => setGradeTarget(null)}
        assignment={gradeTarget}
      />
    </div>
  )
}
