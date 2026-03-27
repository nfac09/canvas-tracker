import { useState } from 'react'
import { useStore } from '../store'
import { PatternCard } from '../components/patterns/PatternCard'
import { PatternForm } from '../components/patterns/PatternForm'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { getCourseById } from '../store/selectors'
import { RecurrenceSuggestionsPanel } from '../components/patterns/RecurrenceSuggestionsPanel'
import { RecurrenceAuditPanel } from '../components/patterns/RecurrenceAuditPanel'

export function RecurringPatternsPage() {
  const patterns = useStore((s) => s.recurringPatterns)
  const courses = useStore((s) => s.courses)
  const [addOpen, setAddOpen] = useState(false)
  const [filterCourseId, setFilterCourseId] = useState('')

  const visible = filterCourseId
    ? patterns.filter((p) => p.courseId === filterCourseId)
    : patterns

  // Group by course
  const byCourse = new Map<string, typeof patterns>()
  for (const p of visible) {
    const list = byCourse.get(p.courseId) ?? []
    list.push(p)
    byCourse.set(p.courseId, list)
  }

  return (
    <div className="px-8 py-8 max-w-3xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Recurring
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
            Weekly templates that auto-generate assignments
          </p>
        </div>
        <Button variant="primary" onClick={() => setAddOpen(true)}>
          + Add Pattern
        </Button>
      </div>

      {/* Course filter */}
      {courses.length > 0 && (
        <div className="mb-7">
          <select
            value={filterCourseId}
            onChange={(e) => setFilterCourseId(e.target.value)}
            className="text-sm rounded-lg border-slate-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.05] text-slate-700 dark:text-slate-300 py-1.5 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
          >
            <option value="">All courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      {import.meta.env.DEV && <RecurrenceAuditPanel />}
      <RecurrenceSuggestionsPanel />

      {patterns.length === 0 ? (
        <EmptyState
          icon="○"
          title="No recurring patterns yet"
          description="Create patterns for assignments that repeat every week, like labs, discussions, or problem sets."
          action={{ label: '+ Add Pattern', onClick: () => setAddOpen(true) }}
        />
      ) : visible.length === 0 ? (
        <EmptyState icon="○" title="No patterns for this course" />
      ) : (
        <div className="space-y-8">
          {Array.from(byCourse.entries()).map(([courseId, coursePatterns]) => {
            const course = getCourseById(courses, courseId)
            return (
              <div key={courseId}>
                {course && (
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: course.color }}
                    />
                    <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {course.name}
                    </h2>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {coursePatterns.length} pattern{coursePatterns.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
                <div className="space-y-3">
                  {coursePatterns.map((p) => <PatternCard key={p.id} pattern={p} />)}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <PatternForm open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}
