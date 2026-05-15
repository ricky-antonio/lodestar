'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useProjects } from '@/lib/context/ProjectsContext'
import { IconLoader2 } from '@tabler/icons-react'
import type { Task, TaskPriority } from '@/lib/types'

export interface TaskFormValues {
  title: string
  description?: string
  priority: TaskPriority
  due_date?: string
  project_id?: string | null
  estimated_mins?: number | null
}

interface Props {
  open: boolean
  onClose: () => void
  initialValues?: Partial<Task>
  onSubmit: (values: TaskFormValues) => Promise<void>
}

const PRIORITIES: {
  value: TaskPriority
  label: string
  color: string
  bg: string
  border: string
}[] = [
  { value: 'urgent', label: 'Urgent', color: '#B91C1C', bg: '#FEF2F2', border: '#FECACA' },
  { value: 'high',   label: 'High',   color: '#C25200', bg: '#FFF8EC', border: '#FFD98A' },
  { value: 'medium', label: 'Medium', color: '#007DA4', bg: '#E8F8FD', border: '#B8ECFA' },
  { value: 'low',    label: 'Low',    color: '#5E7F91', bg: '#E2EDF2', border: '#9DBFCF' },
]

function FormBody({
  initialValues,
  onClose,
  onSubmit,
}: Pick<Props, 'initialValues' | 'onClose' | 'onSubmit'>) {
  const { projects } = useProjects()
  const [title, setTitle] = useState(initialValues?.title ?? '')
  const [description, setDescription] = useState(initialValues?.description ?? '')
  const [priority, setPriority] = useState<TaskPriority>(initialValues?.priority ?? 'medium')
  const [dueDate, setDueDate] = useState(initialValues?.due_date ?? '')
  const [projectId, setProjectId] = useState<string>(initialValues?.project_id ?? '')
  const [estimatedMins, setEstimatedMins] = useState(
    initialValues?.estimated_mins != null ? String(initialValues.estimated_mins) : ''
  )
  const [titleError, setTitleError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isEditing = !!initialValues?.id

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setTitleError('Title is required')
      return
    }
    setTitleError('')
    setSubmitting(true)
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        due_date: dueDate || undefined,
        project_id: projectId || null,
        estimated_mins: estimatedMins ? Number(estimatedMins) : null,
      })
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label
          htmlFor="task-title"
          className="text-sm font-medium"
          style={{ color: 'var(--tx-2)' }}
        >
          Title
        </label>
        <Input
          id="task-title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Task title"
          autoFocus
        />
        {titleError && (
          <p className="text-xs" role="alert" style={{ color: '#EF4444' }}>
            {titleError}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="task-description"
          className="text-sm font-medium"
          style={{ color: 'var(--tx-2)' }}
        >
          Description
        </label>
        <Textarea
          id="task-description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Optional description"
          rows={3}
        />
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium" style={{ color: 'var(--tx-2)' }}>
          Priority
        </span>
        <div className="flex gap-2" role="group" aria-label="Priority">
          {PRIORITIES.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPriority(opt.value)}
              aria-pressed={priority === opt.value}
              className="flex-1 py-1.5 rounded text-xs font-medium transition-all"
              style={{
                background: opt.bg,
                color: opt.color,
                border: `1px solid ${priority === opt.value ? opt.color : opt.border}`,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="task-due-date"
            className="text-sm font-medium"
            style={{ color: 'var(--tx-2)' }}
          >
            Due date
          </label>
          <Input
            id="task-due-date"
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label
            htmlFor="task-est-mins"
            className="text-sm font-medium"
            style={{ color: 'var(--tx-2)' }}
          >
            Est. mins
          </label>
          <Input
            id="task-est-mins"
            type="number"
            min={0}
            value={estimatedMins}
            onChange={e => setEstimatedMins(e.target.value)}
            placeholder="—"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="task-project"
          className="text-sm font-medium"
          style={{ color: 'var(--tx-2)' }}
        >
          Project
        </label>
        <select
          id="task-project"
          value={projectId}
          onChange={e => setProjectId(e.target.value)}
          className="h-9 rounded-md px-3 text-sm transition-colors focus:outline-none"
          style={{
            background: 'var(--surface)',
            color: 'var(--tx-1)',
            border: '0.5px solid var(--border-2)',
          }}
        >
          <option value="">No project</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting && (
            <IconLoader2 className="animate-spin w-4 h-4 mr-2" aria-hidden />
          )}
          {isEditing ? 'Save changes' : 'Create task'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function TaskForm({ open, onClose, initialValues, onSubmit }: Props) {
  return (
    <Dialog open={open} onOpenChange={isOpen => { if (!isOpen) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialValues?.id ? 'Edit task' : 'New task'}</DialogTitle>
        </DialogHeader>
        <FormBody
          key={String(open)}
          initialValues={initialValues}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      </DialogContent>
    </Dialog>
  )
}
