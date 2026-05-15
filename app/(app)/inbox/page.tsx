'use client'

import { useState } from 'react'
import { IconPlus, IconList, IconTable } from '@tabler/icons-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TaskList } from '@/components/tasks/TaskList'
import { ListView } from '@/components/views/ListView'
import { TaskForm, type TaskFormValues } from '@/components/tasks/TaskForm'
import { FilterBar } from '@/components/filters/FilterBar'
import { filterTasks } from '@/lib/tasks'
import { useTasks } from '@/lib/context/TasksContext'
import { useAuth } from '@/lib/context/AuthContext'
import type { Task } from '@/lib/types'

export default function InboxPage() {
  const { tasks, filters, setFilters, addTask, editTask, removeTask, archiveTask } = useTasks()
  const { workspace } = useAuth()

  const [formOpen, setFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined)
  const [captureValue, setCaptureValue] = useState('')
  const [tableView, setTableView] = useState(false)

  const allInboxTasks = tasks.filter(t => t.project_id === null && !t.is_archived)
  const inboxTasks = filterTasks(allInboxTasks, filters)

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
    <div className="flex flex-col flex-1 min-w-0 p-6 gap-4" style={{ background: 'var(--bg)' }}>
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
          <div className="flex items-center gap-2">
            <div
              className="flex items-center rounded-lg p-0.5 gap-0.5"
              style={{ background: 'var(--surface-2)', border: '0.5px solid var(--border)' }}
              role="group"
              aria-label="View toggle"
            >
              <button
                type="button"
                onClick={() => setTableView(false)}
                aria-label="Simple list"
                aria-pressed={!tableView}
                className="flex items-center justify-center w-7 h-7 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#66C4FF]"
                style={{
                  background: !tableView ? 'var(--surface)' : 'transparent',
                  color: !tableView ? 'var(--accent)' : 'var(--tx-3)',
                }}
              >
                <IconList size={16} aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => setTableView(true)}
                aria-label="Table view"
                aria-pressed={tableView}
                className="flex items-center justify-center w-7 h-7 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#66C4FF]"
                style={{
                  background: tableView ? 'var(--surface)' : 'transparent',
                  color: tableView ? 'var(--accent)' : 'var(--tx-3)',
                }}
              >
                <IconTable size={16} aria-hidden />
              </button>
            </div>
            <Button onClick={handleOpenNew} className="flex items-center gap-1.5">
              <IconPlus size={16} aria-hidden />
              New task
            </Button>
          </div>
        </div>

        {/* Filter bar */}
        {workspace && (
          <FilterBar filters={filters} onChange={setFilters} workspaceId={workspace.id} />
        )}

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
          {tableView ? (
            <ListView
              tasks={inboxTasks}
              onToggleDone={handleToggleDone}
              onEdit={handleEdit}
              onArchive={id => archiveTask(id)}
              onDelete={id => removeTask(id)}
              onReorder={(id, position) => editTask(id, { position })}
              onBulkArchive={async (ids) => { for (const id of ids) await archiveTask(id) }}
            />
          ) : (
            <TaskList
              tasks={inboxTasks}
              onToggleDone={handleToggleDone}
              onEdit={handleEdit}
              onArchive={id => archiveTask(id)}
              onDelete={id => removeTask(id)}
              onReorder={(id, position) => editTask(id, { position })}
              emptyMessage="No unscheduled tasks. Capture something above."
            />
          )}
        </div>

      <TaskForm
        open={formOpen}
        onClose={handleCloseForm}
        initialValues={editingTask}
        onSubmit={handleFormSubmit}
      />
    </div>
  )
}
