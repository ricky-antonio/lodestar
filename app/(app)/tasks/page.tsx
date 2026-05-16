'use client'

import { useCallback, useState } from 'react'
import { IconPlus, IconList, IconLayoutKanban } from '@tabler/icons-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BoardView } from '@/components/views/BoardView'
import { ListView } from '@/components/views/ListView'
import { FilterBar } from '@/components/filters/FilterBar'
import { ViewSkeleton } from '@/components/ui/ViewSkeleton'
import { filterTasks } from '@/lib/tasks'
import { useTasks } from '@/lib/context/TasksContext'
import { useAuth } from '@/lib/context/AuthContext'
import { useProjects } from '@/lib/context/ProjectsContext'
import { useUI } from '@/lib/context/UIContext'

export default function TasksPage() {
  const { workspace, user } = useAuth()
  const { activeProject } = useProjects()
  const { tasks, taskLabelIds, labels, filters, setFilters, editTask, removeTask, archiveTask, loading } = useTasks()
  const { activeView, setActiveView, openCreate } = useUI()
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])
  const handleSelectionChange = useCallback((ids: string[]) => setSelectedTaskIds(ids), [])

  const projectTasks = tasks.filter(t =>
    t.project_id === (activeProject?.id ?? '__none__') && !t.is_archived && t.parent_id === null
  )
  const visibleTasks = filterTasks(projectTasks, filters, taskLabelIds)

  function handleToggleDone(id: string) {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    editTask(id, { status: task.status === 'done' ? 'todo' : 'done' })
  }

  return (
    <div className="flex flex-col flex-1 min-w-0 p-6 gap-4" style={{ background: 'var(--bg)' }}>
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--tx-1)' }}>
            Tasks
          </h1>
          <Badge
            variant="secondary"
            style={{
              background: 'var(--accent-bg)',
              color: 'var(--accent)',
              border: '0.5px solid var(--accent-border)',
            }}
          >
            {visibleTasks.length}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div
            className="flex items-center rounded-lg p-0.5 gap-0.5"
            style={{ background: 'var(--surface-2)', border: '0.5px solid var(--border)' }}
            role="group"
            aria-label="View toggle"
          >
            <button
              type="button"
              onClick={() => setActiveView('list')}
              aria-label="List view"
              aria-pressed={activeView === 'list'}
              className="flex items-center justify-center w-7 h-7 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#66C4FF]"
              style={{
                background: activeView === 'list' ? 'var(--surface)' : 'transparent',
                color: activeView === 'list' ? 'var(--accent)' : 'var(--tx-3)',
              }}
            >
              <IconList size={16} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => setActiveView('board')}
              aria-label="Board view"
              aria-pressed={activeView === 'board'}
              className="flex items-center justify-center w-7 h-7 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#66C4FF]"
              style={{
                background: activeView === 'board' ? 'var(--surface)' : 'transparent',
                color: activeView === 'board' ? 'var(--accent)' : 'var(--tx-3)',
              }}
            >
              <IconLayoutKanban size={16} aria-hidden />
            </button>
          </div>

          <Button
            onClick={() => openCreate({ project_id: activeProject?.id ?? null })}
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
        <FilterBar filters={filters} onChange={setFilters} workspaceId={workspace.id} userId={user?.id} selectedTaskIds={selectedTaskIds} />
      )}

      {/* View */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {!loading && !activeProject ? (
          <div className="flex items-center justify-center py-16 text-sm" style={{ color: 'var(--tx-3)' }}>
            Select a project to see its tasks.
          </div>
        ) : loading ? (
          <ViewSkeleton rows={8} />
        ) : activeView === 'board' ? (
          <BoardView
            tasks={visibleTasks}
            onMoveTask={(taskId, newStatus, newPosition) => {
              editTask(taskId, { status: newStatus, position: newPosition })
            }}
            onArchive={id => archiveTask(id)}
            onDelete={id => removeTask(id)}
            onAddTask={activeProject ? () => openCreate({ project_id: activeProject.id }) : undefined}
            onSelectionChange={handleSelectionChange}
            taskLabelIds={taskLabelIds}
            labels={labels}
          />
        ) : (
          <ListView
            tasks={visibleTasks}
            onToggleDone={handleToggleDone}
            onArchive={id => archiveTask(id)}
            onDelete={id => removeTask(id)}
            onReorder={(id, position) => editTask(id, { position })}
            onBulkArchive={async (ids) => { for (const id of ids) await archiveTask(id) }}
          />
        )}
      </div>

    </div>
  )
}
