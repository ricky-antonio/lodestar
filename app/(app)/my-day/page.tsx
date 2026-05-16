'use client'

import { useState } from 'react'
import { IconPlus, IconList, IconTable } from '@tabler/icons-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TaskList } from '@/components/tasks/TaskList'
import { ListView } from '@/components/views/ListView'
import { FilterBar } from '@/components/filters/FilterBar'
import { ViewSkeleton } from '@/components/ui/ViewSkeleton'
import { filterTasks } from '@/lib/tasks'
import { useTasks } from '@/lib/context/TasksContext'
import { useAuth } from '@/lib/context/AuthContext'
import { useProjects } from '@/lib/context/ProjectsContext'
import { useUI } from '@/lib/context/UIContext'

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
  const { tasks, filters, setFilters, editTask, removeTask, archiveTask, loading } = useTasks()
  const { workspace, user } = useAuth()
  const { activeProject } = useProjects()
  const { openCreate } = useUI()

  const [pinnedTaskIds, setPinnedTaskIds] = useState<Set<string>>(new Set())
  const [tableView, setTableView] = useState(false)

  const todayStr = getTodayStr()

  const scopedTasks = activeProject
    ? tasks.filter(t => t.project_id === activeProject.id)
    : []

  // Due today excludes explicitly pinned tasks (pinning moves them to "Added to My Day")
  const dueTodayTasks = filterTasks(
    scopedTasks.filter(t => t.due_date === todayStr && !t.is_archived && t.parent_id === null && !pinnedTaskIds.has(t.id)),
    filters,
  )

  const pinnedTasks = scopedTasks.filter(
    t => pinnedTaskIds.has(t.id) && !t.is_archived && t.parent_id === null,
  )

  const totalCount = dueTodayTasks.length + pinnedTasks.length

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
            <Button
              onClick={() => openCreate({ project_id: activeProject?.id ?? null, due_date: todayStr })}
              disabled={!activeProject}
              title={!activeProject ? 'Select a project first' : undefined}
              className="flex items-center gap-1.5"
            >
              <IconPlus size={16} aria-hidden />
              New task
            </Button>
          </div>
        </div>

        {/* Filter bar */}
        {workspace && (
          <FilterBar filters={filters} onChange={setFilters} workspaceId={workspace.id} userId={user?.id} />
        )}

        {loading ? (
          <ViewSkeleton rows={8} />
        ) : tableView ? (
          /* Table view: combine all tasks into one ListView */
          <ListView
            tasks={[...dueTodayTasks, ...pinnedTasks]}
            onToggleDone={handleToggleDone}
            onArchive={id => archiveTask(id)}
            onDelete={id => removeTask(id)}
            onReorder={(id, position) => editTask(id, { position })}
            onBulkArchive={async (ids) => { for (const id of ids) await archiveTask(id) }}
          />
        ) : (
          <>
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
                  onArchive={id => archiveTask(id)}
                  onDelete={id => removeTask(id)}
                  onReorder={(id, position) => editTask(id, { position })}
                  onRemoveFromMyDay={removeFromMyDay}
                />
              </section>
            )}
          </>
        )}

        {/* Empty state */}
        {!loading && !activeProject && (
          <div className="flex items-center justify-center py-16 text-sm" style={{ color: 'var(--tx-3)' }}>
            Select a project to see today&apos;s tasks.
          </div>
        )}
        {!loading && activeProject && dueTodayTasks.length === 0 && pinnedTasks.length === 0 && (
          <div
            className="flex items-center justify-center py-16 text-sm"
            style={{ color: 'var(--tx-3)' }}
          >
            Nothing scheduled for today. Add a task or press Q to quick-capture.
          </div>
        )}
      </div>

    </div>
  )
}
