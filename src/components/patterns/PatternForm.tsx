import { useState, useEffect, type FormEvent } from 'react'
import type {
  RecurringPattern,
  AssignmentCategory,
  AssignmentPriority,
  DayOfWeek,
} from '../../types'
import { useStore } from '../../store'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { formatDate } from '../../utils/dateHelpers'
import { subDays } from 'date-fns'

interface PatternFormProps {
  open: boolean
  onClose: () => void
  pattern?: RecurringPattern
  defaultCourseId?: string
}

const DAYS: { value: DayOfWeek; short: string; label: string }[] = [
  { value: 0, short: 'Su', label: 'Sunday' },
  { value: 1, short: 'Mo', label: 'Monday' },
  { value: 2, short: 'Tu', label: 'Tuesday' },
  { value: 3, short: 'We', label: 'Wednesday' },
  { value: 4, short: 'Th', label: 'Thursday' },
  { value: 5, short: 'Fr', label: 'Friday' },
  { value: 6, short: 'Sa', label: 'Saturday' },
]

const categories: AssignmentCategory[] = ['discussion', 'quiz', 'lab', 'exam', 'homework', 'other']
const priorities: AssignmentPriority[] = ['low', 'medium', 'high']

const inputCls = 'w-full rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 text-sm focus:ring-indigo-500 focus:border-indigo-500'
const labelCls = 'block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5'

export function PatternForm({ open, onClose, pattern, defaultCourseId = '' }: PatternFormProps) {
  const courses = useStore((s) => s.courses)
  const addPattern = useStore((s) => s.addPattern)
  const updatePattern = useStore((s) => s.updatePattern)
  const isEdit = !!pattern

  const defaultStart = formatDate(subDays(new Date(), 30))

  const [form, setForm] = useState({
    courseId: defaultCourseId,
    title: '',
    dayOfWeek: 0 as DayOfWeek,
    dueTime: '23:59',
    category: '' as AssignmentCategory | '',
    priority: 'medium' as AssignmentPriority,
    notes: '',
    startDate: defaultStart,
    endDate: '',
    active: true,
  })

  useEffect(() => {
    if (open) {
      if (pattern) {
        setForm({
          courseId: pattern.courseId,
          title: pattern.title,
          dayOfWeek: pattern.dayOfWeek,
          dueTime: pattern.dueTime,
          category: pattern.category ?? '',
          priority: pattern.priority,
          notes: pattern.notes ?? '',
          startDate: pattern.startDate,
          endDate: pattern.endDate ?? '',
          active: pattern.active,
        })
      } else {
        setForm({
          courseId: defaultCourseId,
          title: '',
          dayOfWeek: 0,
          dueTime: '23:59',
          category: '',
          priority: 'medium',
          notes: '',
          startDate: defaultStart,
          endDate: '',
          active: true,
        })
      }
    }
  }, [open, pattern, defaultCourseId, defaultStart])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.courseId || !form.startDate) return

    const payload = {
      courseId: form.courseId,
      title: form.title.trim(),
      dayOfWeek: form.dayOfWeek,
      dueTime: form.dueTime,
      category: (form.category || undefined) as AssignmentCategory | undefined,
      priority: form.priority,
      notes: form.notes.trim() || undefined,
      startDate: form.startDate,
      endDate: form.endDate || undefined,
      active: form.active,
    }

    if (isEdit) {
      updatePattern(pattern.id, payload, true)
    } else {
      addPattern(payload)
    }
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Pattern' : 'Add Recurring Pattern'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelCls}>Course *</label>
          <select
            value={form.courseId}
            onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value }))}
            className={inputCls}
            required
          >
            <option value="">Select course…</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label className={labelCls}>Assignment Title *</label>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className={inputCls}
            placeholder="e.g. Weekly Discussion Post"
            required
          />
        </div>

        <div>
          <label className={labelCls}>Day of Week *</label>
          <div className="flex gap-1.5">
            {DAYS.map((day) => (
              <button
                key={day.value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, dayOfWeek: day.value }))}
                title={day.label}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors
                  ${form.dayOfWeek === day.value
                    ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
              >
                {day.short}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelCls}>Due Time *</label>
          <input
            type="time"
            value={form.dueTime}
            onChange={(e) => setForm((f) => ({ ...f, dueTime: e.target.value }))}
            className={inputCls}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as AssignmentCategory | '' }))}
              className={inputCls}
            >
              <option value="">None</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Priority</label>
            <select
              value={form.priority}
              onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as AssignmentPriority }))}
              className={inputCls}
            >
              {priorities.map((p) => (
                <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Start Date *</label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              className={inputCls}
              required
            />
          </div>
          <div>
            <label className={labelCls}>End Date</label>
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            rows={2}
            className={`${inputCls} resize-none`}
            placeholder="Optional notes…"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="active"
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="active" className="text-sm text-slate-700 dark:text-slate-300">
            Active (generate assignments automatically)
          </label>
        </div>

        {isEdit && (
          <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-800">
            Changes will update future unedited occurrences only.
          </p>
        )}

        <div className="flex gap-2 justify-end pt-1">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit">
            {isEdit ? 'Save Pattern' : 'Create Pattern'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
