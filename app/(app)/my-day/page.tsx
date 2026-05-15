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

function getTodayStr(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatHeaderDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

export default function MyDayPage() {
  const { tasks, addTask, editTask, removeTask, archiveTask } = useTasks()
  const { detailTaskId, closeDetail } = useUI()

  const [pinnedTaskIds, setPinnedTaskIds] = useState<Set<string>>(new Set())
  const [formOpen, setFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined)

  const todayStr = getTodayStr()

  // Due today excludes explicitly pinned tasks (pinning moves them to "Added to My Day")
  const dueTodayTasks = tasks.filter(
    t => t.due_date === todayStr && !t.is_archived && !pinnedTaskIds.has(t.id),
  )

  const pinnedTasks = tasks.filter(
    t => pinnedTaskIds.has(t.id) && !t.is_archived,
  )

  const totalCount = dueTodayTasks.length + pinnedTasks.length
  const detailTask = detailTaskId ? tasks.find(t => t.id === detailTaskId) : undefined

  function addToMyDay(id: string) {
    setPinnedTaskIds(prev => new Set([...prev, id]))
  }

  function removeFromMyDay(id: string) {
    setPinnedTaskIds(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  function handleToggleDone(id: string) {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    editTask(id, { status: task.status === 'done' ? 'todo' : 'done' })
  }

  function handleEdit(id: string) {
    const task = tasks.find(t => t.id === id)
    setEditingTask(task)
    setFormOpen(true)
  }

  async function handleFormSubmit(values: TaskFormValues) {
    if (editingTask) {
      await editTask(editingTask.id, { ...values })
    } else {
      await addTask({ ...values, due_date: values.due_date ?? todayStr })
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
      <div className="flex flex-col flex-1 min-w-0 p-6 gap-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-semibold" style={{ color: 'var(--tx-1)' }}>
                My Day
              </h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--tx-3)' }}>
                {formatHeaderDate()}
              </p>
            </div>
            <Badge
              variant="secondary"
              style={{
                background: 'var(--accent-bg)',
                color: 'var(--accent)',
                border: '0.5px solid var(--accent-border)',
              }}
            >
              {totalCount}
            </Badge>
          </div>
          <Button onClick={handleOpenNew} className="flex items-center gap-1.5">
            <IconPlus size={16} aria-hidden />
            New task
          </Button>
        </div>

        {/* Due today section */}
        {dueTodayTasks.length > 0 && (
          <section aria-label="Due today">
            <h2
              className="text-xs font-medium uppercase tracking-widest mb-3"
              style={{ color: 'var(--tx-3)', letterSpacing: '0.06em' }}
            >
              Due today
            </h2>
            <TaskList
              tasks={dueTodayTasks}
              onToggleDone={handleToggleDone}
              onEdit={handleEdit}
              onArchive={id => archiveTask(id)}
              onDelete={id => removeTask(id)}
              onReorder={(id, position) => editTask(id, { position })}
              onAddToMyDay={addToMyDay}
            />
          </section>
        )}

        {/* Added to My Day section */}
        {pinnedTasks.length > 0 && (
          <section aria-label="Added to My Day">
            <h2
              className="text-xs font-medium uppercase tracking-widest mb-3"
              style={{ color: 'var(--tx-3)', letterSpacing: '0.06em' }}
            >
              Added to My Day
            </h2>
            <TaskList
              tasks={pinnedTasks}
              onToggleDone={handleToggleDone}
              onEdit={handleEdit}
              onArchive={id => archiveTask(id)}
              onDelete={id => removeTask(id)}
              onReorder={(id, position) => editTask(id, { position })}
              onRemoveFromMyDay={removeFromMyDay}
            />
          </section>
        )}

        {/* Empty state */}
        {dueTodayTasks.length === 0 && pinnedTasks.length === 0 && (
          <div
            className="flex items-center justify-center py-16 text-sm"
            style={{ color: 'var(--tx-3)' }}
          >
            Nothing scheduled for today. Add a task or press Q to quick-capture.
          </div>
        )}
      </div>

      {/* Task detail panel */}
      {detailTask && (
        <div
          className="w-[400px] flex-none border-l flex flex-col"
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
        initialValues={editingTask ?? { due_date: todayStr }}
        onSubmit={handleFormSubmit}
      />
    </div>
  )
}
