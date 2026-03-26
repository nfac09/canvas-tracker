import { useMemo } from 'react'
import { useStore } from '../store'
import { EmptyState } from '../components/ui/EmptyState'
import { GradeBadge } from '../components/ui/Badge'
import { getCourseById } from '../store/selectors'
import { formatDisplayDate } from '../utils/dateHelpers'

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

function gradeColor(pct: number): string {
  if (pct >= 90) return 'text-emerald-600 dark:text-emerald-400'
  if (pct >= 80) return 'text-blue-600 dark:text-blue-400'
  if (pct >= 70) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

export function GradesPage() {
  const assignments = useStore((s) => s.assignments)
  const courses = useStore((s) => s.courses)

  const graded = useMemo(
    () => assignments.filter(
      (a) => a.pointsEarned !== undefined || a.letterGrade
    ),
    [assignments]
  )

  const byCourse = useMemo(() => {
    const map = new Map<string, typeof graded>()
    for (const a of graded) {
      const list = map.get(a.courseId) ?? []
      list.push(a)
      map.set(a.courseId, list)
    }
    return map
  }, [graded])

  function courseSummary(courseId: string) {
    const list = byCourse.get(courseId) ?? []
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

  return (
    <div className="px-8 py-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Grades
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
          {graded.length} graded assignment{graded.length !== 1 ? 's' : ''} across {byCourse.size} course{byCourse.size !== 1 ? 's' : ''}
        </p>
      </div>

      {graded.length === 0 ? (
        <EmptyState
          icon="○"
          title="No grades recorded yet"
          description="Open any assignment and expand the Grade section to record points or a letter grade."
        />
      ) : (
        <div className="space-y-8">
          {Array.from(byCourse.entries()).map(([courseId, list]) => {
            const course = getCourseById(courses, courseId)
            const summary = courseSummary(courseId)

            return (
              <div key={courseId}>
                {/* Course header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    {course && (
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: course.color }}
                      />
                    )}
                    <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {course?.name ?? 'Unknown Course'}
                    </h2>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {list.length} graded
                    </span>
                  </div>

                  {summary && (
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${gradeColor(summary.pct)}`}>
                        {summary.letter}
                      </span>
                      <span className={`text-xs font-medium ${gradeColor(summary.pct)}`}>
                        {summary.pct}%
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {summary.totalEarned}/{summary.totalPossible} pts
                      </span>
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                {summary && (
                  <div className="mb-3">
                    <div className="w-full h-1 bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${summary.pct}%`,
                          backgroundColor: course?.color ?? '#6366F1',
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Assignment rows */}
                <div className="space-y-1.5">
                  {list
                    .sort((a, b) => b.dueDate.localeCompare(a.dueDate))
                    .map((assignment) => {
                      const pct =
                        assignment.pointsEarned !== undefined && assignment.pointsPossible
                          ? Math.round((assignment.pointsEarned / assignment.pointsPossible) * 100)
                          : null

                      return (
                        <div
                          key={assignment.id}
                          className="flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-[#13131e] rounded-xl border border-slate-200 dark:border-white/[0.07]"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 dark:text-[#e8e8f2] truncate">
                              {assignment.title}
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                              {formatDisplayDate(assignment.dueDate)}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {assignment.pointsEarned !== undefined && assignment.pointsPossible && (
                              <span className="text-xs text-slate-400 dark:text-slate-500">
                                {assignment.pointsEarned}/{assignment.pointsPossible}
                              </span>
                            )}
                            <GradeBadge
                              pointsEarned={assignment.pointsEarned}
                              pointsPossible={assignment.pointsPossible}
                              letterGrade={assignment.letterGrade ?? (pct !== null ? letterFromPercent(pct) : undefined)}
                            />
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
