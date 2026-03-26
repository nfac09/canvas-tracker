import { useState } from 'react'
import { useStore } from '../store'
import { PatternCard } from '../components/patterns/PatternCard'
import { PatternForm } from '../components/patterns/PatternForm'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { getCourseById } from '../store/selectors'

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
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Recurring Patterns</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Weekly assignment templates that auto-generate upcoming assignments
          </p>
        </div>
        <Button variant="primary" onClick={() => setAddOpen(true)}>
          + Add Pattern
        </Button>
      </div>

      {/* Filter */}
      {courses.length > 0 && (
        <div className="mb-5">
          <select
            value={filterCourseId}
            onChange={(e) => setFilterCourseId(e.target.value)}
            className="text-sm rounded-lg border-gray-300 py-1.5 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      {patterns.length === 0 ? (
        <EmptyState
          icon="↺"
          title="No recurring patterns yet"
          description="Create patterns for assignments that repeat every week, like labs, discussions, or problem sets."
          action={{ label: '+ Add Pattern', onClick: () => setAddOpen(true) }}
        />
      ) : visible.length === 0 ? (
        <EmptyState icon="🔍" title="No patterns for this course" />
      ) : (
        <div className="space-y-6">
          {Array.from(byCourse.entries()).map(([courseId, coursePatterns]) => {
            const course = getCourseById(courses, courseId)
            return (
              <div key={courseId}>
                {course && (
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: course.color }}
                    />
                    <h2 className="text-sm font-semibold text-gray-700">{course.name}</h2>
                    <span className="text-xs text-gray-400">({coursePatterns.length} pattern{coursePatterns.length !== 1 ? 's' : ''})</span>
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
