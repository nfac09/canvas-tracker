import { useState } from 'react'
import { useStore } from '../store'
import { CourseCard } from '../components/courses/CourseCard'
import { CourseForm } from '../components/courses/CourseForm'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'

export function CoursesPage() {
  const courses = useStore((s) => s.courses)
  const [addOpen, setAddOpen] = useState(false)

  return (
    <div className="px-8 py-8 max-w-3xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Courses
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
            {courses.length} course{courses.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <Button variant="primary" onClick={() => setAddOpen(true)}>
          + Add Course
        </Button>
      </div>

      {courses.length === 0 ? (
        <EmptyState
          icon="○"
          title="No courses yet"
          description="Add your courses first, then create assignments and recurring patterns for them."
          action={{ label: '+ Add Course', onClick: () => setAddOpen(true) }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {courses.map((c) => <CourseCard key={c.id} course={c} />)}
        </div>
      )}

      <CourseForm open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}
