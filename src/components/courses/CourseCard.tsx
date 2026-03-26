import { useState } from 'react'
import type { Course } from '../../types'
import { useStore } from '../../store'
import { getAssignmentCountByCourse } from '../../store/selectors'
import { Button } from '../ui/Button'
import { CourseForm } from './CourseForm'
import { ConfirmDialog } from '../ui/ConfirmDialog'

interface CourseCardProps {
  course: Course
}

export function CourseCard({ course }: CourseCardProps) {
  const assignments = useStore((s) => s.assignments)
  const deleteCourse = useStore((s) => s.deleteCourse)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const count = getAssignmentCountByCourse(assignments, course.id)
  const pending = assignments.filter(
    (a) => a.courseId === course.id && !a.isSkipped && a.status !== 'done',
  ).length

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl" style={{ backgroundColor: course.color }} />
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">{course.name}</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {pending > 0 ? (
                  <span className="text-amber-600 font-medium">{pending} pending</span>
                ) : (
                  `${count} total`
                )}
              </p>
            </div>
          </div>
          <div className="flex gap-1.5">
            <Button size="sm" variant="ghost" onClick={() => setEditOpen(true)}>✎</Button>
            <Button size="sm" variant="ghost" onClick={() => setDeleteOpen(true)}>✕</Button>
          </div>
        </div>

        {course.notes && (
          <p className="text-xs text-gray-400 line-clamp-2">{course.notes}</p>
        )}

        {/* Progress bar */}
        {count > 0 && (
          <div className="mt-3">
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.round(((count - pending) / count) * 100)}%`,
                  backgroundColor: course.color,
                }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {count - pending} of {count} completed
            </p>
          </div>
        )}
      </div>

      <CourseForm open={editOpen} onClose={() => setEditOpen(false)} course={course} />
      <ConfirmDialog
        open={deleteOpen}
        title="Delete Course"
        description={`Delete "${course.name}"? This will also delete all its assignments and recurring patterns.`}
        confirmLabel="Delete Course"
        danger
        onConfirm={() => {
          deleteCourse(course.id)
          setDeleteOpen(false)
        }}
        onCancel={() => setDeleteOpen(false)}
      />
    </>
  )
}
