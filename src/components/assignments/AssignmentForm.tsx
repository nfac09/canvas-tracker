import { useState, useEffect, type FormEvent } from 'react'
import type { Assignment, AssignmentCategory, AssignmentPriority, AssignmentStatus } from '../../types'
import { useStore } from '../../store'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { todayStr } from '../../utils/dateHelpers'

interface AssignmentFormProps {
  open: boolean
  onClose: () => void
  assignment?: Assignment
  defaultCourseId?: string
  defaultDueDate?: string
}

const categories: AssignmentCategory[] = ['discussion', 'quiz', 'lab', 'exam', 'homework', 'other']
const priorities: AssignmentPriority[] = ['low', 'medium', 'high']
const statuses: AssignmentStatus[] = ['not_started', 'in_progress', 'done']

const statusLabels: Record<AssignmentStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  done: 'Done',
}

export function AssignmentForm({
  open,
  onClose,
  assignment,
  defaultCourseId = '',
  defaultDueDate,
}: AssignmentFormProps) {
  const courses = useStore((s) => s.courses)
  const addAssignment = useStore((s) => s.addAssignment)
  const updateAssignment = useStore((s) => s.updateAssignment)

  const isEdit = !!assignment
  const isRecurring = !!assignment?.recurringPatternId && !assignment.isPatternOverride

  const [form, setForm] = useState({
    title: '',
    courseId: defaultCourseId,
    dueDate: defaultDueDate ?? todayStr(),
    dueTime: '',
    status: 'not_started' as AssignmentStatus,
    priority: 'medium' as AssignmentPriority,
    category: '' as AssignmentCategory | '',
    notes: '',
  })

  useEffect(() => {
    if (open) {
      if (assignment) {
        setForm({
          title: assignment.title,
          courseId: assignment.courseId,
          dueDate: assignment.dueDate,
          dueTime: assignment.dueTime ?? '',
          status: assignment.status,
          priority: assignment.priority,
          category: assignment.category ?? '',
          notes: assignment.notes ?? '',
        })
      } else {
        setForm({
          title: '',
          courseId: defaultCourseId,
          dueDate: defaultDueDate ?? todayStr(),
          dueTime: '',
          status: 'not_started',
          priority: 'medium',
          category: '',
          notes: '',
        })
      }
    }
  }, [open, assignment, defaultCourseId, defaultDueDate])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.courseId || !form.dueDate) return

    const payload = {
      title: form.title.trim(),
      courseId: form.courseId,
      dueDate: form.dueDate,
      dueTime: form.dueTime || undefined,
      status: form.status,
      priority: form.priority,
      category: form.category || undefined,
      notes: form.notes.trim() || undefined,
      source: (isEdit ? assignment.source : 'manual') as Assignment['source'],
    }

    if (isEdit) {
      updateAssignment(assignment.id, {
        ...payload,
        isPatternOverride: isRecurring ? true : assignment.isPatternOverride,
      })
    } else {
      addAssignment(payload)
    }
    onClose()
  }

  const field = (name: keyof typeof form) => ({
    value: form[name] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [name]: e.target.value })),
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Assignment' : 'Add Assignment'}
    >
      {isRecurring && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
          ↺ This is a recurring assignment. Saving will edit only this occurrence.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
          <input
            {...field('title')}
            className="w-full rounded-lg border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Assignment title"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Course *</label>
          <select
            {...field('courseId')}
            className="w-full rounded-lg border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
            required
          >
            <option value="">Select course…</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Due Date *</label>
            <input
              type="date"
              {...field('dueDate')}
              className="w-full rounded-lg border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Due Time</label>
            <input
              type="time"
              {...field('dueTime')}
              className="w-full rounded-lg border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
            <select
              {...field('status')}
              className="w-full rounded-lg border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>{statusLabels[s]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
            <select
              {...field('priority')}
              className="w-full rounded-lg border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              {priorities.map((p) => (
                <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
          <select
            {...field('category')}
            className="w-full rounded-lg border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            {...field('notes')}
            rows={2}
            className="w-full rounded-lg border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            placeholder="Optional notes…"
          />
        </div>

        <div className="flex gap-2 justify-end pt-1">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            {isEdit ? 'Save Changes' : 'Add Assignment'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
