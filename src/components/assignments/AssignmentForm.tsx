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

const inputCls = 'w-full rounded-lg border-slate-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.06] text-slate-900 dark:text-slate-100 dark:placeholder-slate-600 text-sm focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors'
const labelCls = 'block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5'

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
    pointsEarned: '',
    pointsPossible: '',
    letterGrade: '',
    gradeFeedback: '',
  })
  const [gradeOpen, setGradeOpen] = useState(false)

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
          pointsEarned: assignment.pointsEarned !== undefined ? String(assignment.pointsEarned) : '',
          pointsPossible: assignment.pointsPossible !== undefined ? String(assignment.pointsPossible) : '',
          letterGrade: assignment.letterGrade ?? '',
          gradeFeedback: assignment.gradeFeedback ?? '',
        })
        setGradeOpen(!!(assignment.pointsEarned !== undefined || assignment.letterGrade))
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
          pointsEarned: '',
          pointsPossible: '',
          letterGrade: '',
          gradeFeedback: '',
        })
        setGradeOpen(false)
      }
    }
  }, [open, assignment, defaultCourseId, defaultDueDate])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.courseId || !form.dueDate) return

    const payload: Partial<Assignment> = {
      title: form.title.trim(),
      courseId: form.courseId,
      dueDate: form.dueDate,
      dueTime: form.dueTime || undefined,
      status: form.status,
      priority: form.priority,
      category: (form.category || undefined) as AssignmentCategory | undefined,
      notes: form.notes.trim() || undefined,
      source: isEdit ? assignment.source : 'manual',
      pointsEarned: form.pointsEarned !== '' ? Number(form.pointsEarned) : undefined,
      pointsPossible: form.pointsPossible !== '' ? Number(form.pointsPossible) : undefined,
      letterGrade: form.letterGrade.trim() || undefined,
      gradeFeedback: form.gradeFeedback.trim() || undefined,
    }

    if (isEdit) {
      updateAssignment(assignment.id, {
        ...payload,
        isPatternOverride: isRecurring ? true : assignment.isPatternOverride,
      })
    } else {
      addAssignment(payload as Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'>)
    }
    onClose()
  }

  const set = (name: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [name]: e.target.value }))

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Assignment' : 'Add Assignment'}
    >
      {isRecurring && (
        <div className="mb-4 px-3 py-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-400">
          ↺ This is a recurring assignment. Saving will edit only this occurrence.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className={labelCls}>Title *</label>
          <input
            value={form.title}
            onChange={set('title')}
            className={inputCls}
            placeholder="Assignment title"
            required
          />
        </div>

        {/* Course */}
        <div>
          <label className={labelCls}>Course *</label>
          <select value={form.courseId} onChange={set('courseId')} className={inputCls} required>
            <option value="">Select course…</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Date + Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Due Date *</label>
            <input type="date" value={form.dueDate} onChange={set('dueDate')} className={inputCls} required />
          </div>
          <div>
            <label className={labelCls}>Due Time</label>
            <input type="time" value={form.dueTime} onChange={set('dueTime')} className={inputCls} />
          </div>
        </div>

        {/* Status + Priority */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Status</label>
            <select value={form.status} onChange={set('status')} className={inputCls}>
              {statuses.map((s) => <option key={s} value={s}>{statusLabels[s]}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Priority</label>
            <select value={form.priority} onChange={set('priority')} className={inputCls}>
              {priorities.map((p) => (
                <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Category */}
        <div>
          <label className={labelCls}>Category</label>
          <select value={form.category} onChange={set('category')} className={inputCls}>
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className={labelCls}>Notes</label>
          <textarea
            value={form.notes}
            onChange={set('notes')}
            rows={2}
            className={`${inputCls} resize-none`}
            placeholder="Optional notes…"
          />
        </div>

        {/* Grade section (collapsible) */}
        <div className="border-t border-slate-100 dark:border-white/[0.06] pt-3">
          <button
            type="button"
            onClick={() => setGradeOpen((v) => !v)}
            className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors w-full text-left"
          >
            <span>{gradeOpen ? '▼' : '▶'}</span>
            Grade (optional)
            {(form.pointsEarned || form.letterGrade) && (
              <span className="text-indigo-500 ml-1">•</span>
            )}
          </button>

          {gradeOpen && (
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Points Earned</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.pointsEarned}
                    onChange={set('pointsEarned')}
                    className={inputCls}
                    placeholder="e.g. 87"
                  />
                </div>
                <div>
                  <label className={labelCls}>Points Possible</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.pointsPossible}
                    onChange={set('pointsPossible')}
                    className={inputCls}
                    placeholder="e.g. 100"
                  />
                </div>
              </div>
              {form.pointsEarned && form.pointsPossible && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Score: {Math.round((Number(form.pointsEarned) / Number(form.pointsPossible)) * 100)}%
                </p>
              )}
              <div>
                <label className={labelCls}>Letter Grade</label>
                <input
                  value={form.letterGrade}
                  onChange={set('letterGrade')}
                  className={inputCls}
                  placeholder="e.g. A, B+, 92%"
                  maxLength={10}
                />
              </div>
              <div>
                <label className={labelCls}>Feedback / Comments</label>
                <textarea
                  value={form.gradeFeedback}
                  onChange={set('gradeFeedback')}
                  rows={2}
                  className={`${inputCls} resize-none`}
                  placeholder="Instructor feedback or your notes about this grade…"
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-1">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit">
            {isEdit ? 'Save Changes' : 'Add Assignment'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
