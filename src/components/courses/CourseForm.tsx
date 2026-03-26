import { useState, useEffect, type FormEvent } from 'react'
import type { Course } from '../../types'
import { useStore } from '../../store'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { ColorPicker } from '../ui/ColorPicker'

interface CourseFormProps {
  open: boolean
  onClose: () => void
  course?: Course
}

const inputCls = 'w-full rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 text-sm focus:ring-indigo-500 focus:border-indigo-500'
const labelCls = 'block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5'

export function CourseForm({ open, onClose, course }: CourseFormProps) {
  const addCourse = useStore((s) => s.addCourse)
  const updateCourse = useStore((s) => s.updateCourse)
  const isEdit = !!course

  const [name, setName] = useState('')
  const [color, setColor] = useState('#6366F1')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (open) {
      if (course) {
        setName(course.name)
        setColor(course.color)
        setNotes(course.notes ?? '')
      } else {
        setName('')
        setColor('#6366F1')
        setNotes('')
      }
    }
  }, [open, course])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    if (isEdit) {
      updateCourse(course.id, { name: name.trim(), color, notes: notes.trim() || undefined })
    } else {
      addCourse({ name: name.trim(), color, notes: notes.trim() || undefined })
    }
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Course' : 'Add Course'} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelCls}>Course Name *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
            placeholder="e.g. BIOL 201"
            required
          />
        </div>

        <div>
          <label className={labelCls}>Color</label>
          <ColorPicker value={color} onChange={setColor} />
        </div>

        <div>
          <label className={labelCls}>Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className={`${inputCls} resize-none`}
            placeholder="Optional notes about this course…"
          />
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit">
            {isEdit ? 'Save Changes' : 'Add Course'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
