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
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Courses</h1>
        <Button variant="primary" onClick={() => setAddOpen(true)}>
          + Add Course
        </Button>
      </div>

      {courses.length === 0 ? (
        <EmptyState
          icon="📚"
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
