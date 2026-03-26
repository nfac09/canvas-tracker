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
  const completed = count - pending
  const pct = count > 0 ? Math.round((completed / count) * 100) : 0

  return (
    <>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md dark:hover:shadow-none dark:hover:border-slate-700 transition-all">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: course.color + '22' }}
            >
              <div
                className="w-5 h-5 rounded-lg"
                style={{ backgroundColor: course.color }}
              />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-tight">
                {course.name}
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-600 mt-0.5">
                {pending > 0 ? (
                  <span className="text-amber-600 dark:text-amber-500 font-medium">
                    {pending} pending
                  </span>
                ) : (
                  `${count} assignment${count !== 1 ? 's' : ''}`
                )}
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={() => setEditOpen(true)}>✎</Button>
            <Button size="sm" variant="ghost" onClick={() => setDeleteOpen(true)}>✕</Button>
          </div>
        </div>

        {course.notes && (
          <p className="text-xs text-slate-400 dark:text-slate-600 line-clamp-2 mb-3 leading-relaxed">
            {course.notes}
          </p>
        )}

        {count > 0 && (
          <div>
            <div className="flex justify-between text-xs text-slate-400 dark:text-slate-600 mb-1.5">
              <span>Progress</span>
              <span>{pct}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: course.color }}
              />
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-600 mt-1.5">
              {completed} of {count} completed
            </p>
          </div>
        )}
      </div>

      <CourseForm open={editOpen} onClose={() => setEditOpen(false)} course={course} />
      <ConfirmDialog
        open={deleteOpen}
        title="Delete Course"
        description={`Delete "${course.name}"? This will also delete all its assignments and patterns.`}
        confirmLabel="Delete Course"
        danger
        onConfirm={() => { deleteCourse(course.id); setDeleteOpen(false) }}
        onCancel={() => setDeleteOpen(false)}
      />
    </>
  )
}
