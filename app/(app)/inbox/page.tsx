'use client'

import { useState } from 'react'
import { IconPlus } from '@tabler/icons-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TaskList } from '@/components/tasks/TaskList'
import { TaskForm, type TaskFormValues } from '@/components/tasks/TaskForm'
import { useTasks } from '@/lib/context/TasksContext'
import { useUI } from '@/lib/context/UIContext'
import type { Task } from '@/lib/types'

export default function InboxPage() {
  const { tasks, addTask, editTask, removeTask, archiveTask } = useTasks()
  const { detailTaskId, closeDetail } = useUI()

  const [formOpen, setFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined)
  const [captureValue, setCaptureValue] = useState('')

  const inboxTasks = tasks.filter(t => t.project_id === null && !t.is_archived)
  const detailTask = detailTaskId ? tasks.find(t => t.id === detailTaskId) : undefined

  async function handleCapture(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return
    const title = captureValue.trim()
    if (!title) return
    await addTask({ title, project_id: null })
    setCaptureValue('')
  }

  function handleEdit(id: string) {
    const task = inboxTasks.find(t => t.id === id)
    setEditingTask(task)
    setFormOpen(true)
  }

  function handleToggleDone(id: string) {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    editTask(id, { status: task.status === 'done' ? 'todo' : 'done' })
  }

  async function handleFormSubmit(values: TaskFormValues) {
    if (editingTask) {
      await editTask(editingTask.id, { ...values })
    } else {
      await addTask({ ...values, project_id: null })
    }
  }

  function handleOpenNew() {
    setEditingTask(undefined)
    setFormOpen(true)
  }

  function handleCloseForm() {
    setFormOpen(false)
    setEditingTask(undefined)
  }

  return (
    <div className="flex h-full" style={{ background: 'var(--bg)' }}>
      <div className="flex flex-col flex-1 min-w-0 p-6 gap-4">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold" style={{ color: 'var(--tx-1)' }}>
              Inbox
            </h1>
            <Badge
              variant="secondary"
              style={{
                background: 'var(--accent-bg)',
                color: 'var(--accent)',
                border: '0.5px solid var(--accent-border)',
              }}
            >
              {inboxTasks.length}
            </Badge>
          </div>
          <Button onClick={handleOpenNew} className="flex items-center gap-1.5">
            <IconPlus size={16} aria-hidden />
            New task
          </Button>
        </div>

        {/* Quick capture */}
        <div
          className="rounded-lg px-4 py-2.5 flex items-center gap-2"
          style={{
            background: 'var(--surface)',
            border: '0.5px solid var(--border)',
          }}
        >
          <IconPlus size={16} aria-hidden style={{ color: 'var(--tx-3)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Capture a task…"
            value={captureValue}
            onChange={e => setCaptureValue(e.target.value)}
            onKeyDown={handleCapture}
            aria-label="Capture a task"
            className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-[var(--tx-3)]"
            style={{ color: 'var(--tx-1)' }}
          />
        </div>

        {/* Task list */}
        <div className="flex-1 min-h-0">
          <TaskList
            tasks={inboxTasks}
            onToggleDone={handleToggleDone}
            onEdit={handleEdit}
            onArchive={id => archiveTask(id)}
            onDelete={id => removeTask(id)}
            onReorder={(id, position) => editTask(id, { position })}
            emptyMessage="No unscheduled tasks. Capture something above."
          />
        </div>
      </div>

      {/* Task detail panel — placeholder until TaskDetail component is built */}
      {detailTask && (
        <div
          className="w-[400px] flex-none border-l flex flex-col md:flex md:w-full md:max-w-none"
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--border)',
            transition: 'transform 200ms ease',
          }}
        >
          <div
            className="flex items-center justify-between p-4 border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            <h2 className="font-medium text-sm truncate" style={{ color: 'var(--tx-1)' }}>
              {detailTask.title}
            </h2>
            <button
              type="button"
              onClick={closeDetail}
              aria-label="Close detail"
              className="w-7 h-7 flex items-center justify-center rounded text-lg leading-none hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#66C4FF]"
              style={{ color: 'var(--tx-3)' }}
            >
              ×
            </button>
          </div>
          <div className="p-4 text-sm" style={{ color: 'var(--tx-2)' }}>
            {detailTask.description ?? 'No description'}
          </div>
        </div>
      )}

      {/* Task form dialog */}
      <TaskForm
        open={formOpen}
        onClose={handleCloseForm}
        initialValues={editingTask}
        onSubmit={handleFormSubmit}
      />
    </div>
  )
}
