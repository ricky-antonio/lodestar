'use client'

import { useEffect, useState } from 'react'
import { IconX } from '@tabler/icons-react'
import { getDependencies, addDependency, removeDependency } from '@/lib/dependencies'
import { getLinkedTasks, addLink, removeLink } from '@/lib/links'
import type { Task, TaskStatus } from '@/lib/types'

const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: '#9DBFCF',
  in_progress: '#00B6EC',
  in_review: '#A855F7',
  done: '#22C55E',
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  in_review: 'In review',
  done: 'Done',
}

interface Props {
  taskId: string
  allTasks: Task[]
  onBlockersChange?: (blockers: Task[]) => void
}

export function TaskDependencies({ taskId, allTasks, onBlockersChange }: Props) {
  const [blockedBy, setBlockedBy] = useState<Task[]>([])
  const [blocking, setBlocking] = useState<Task[]>([])
  const [linkedTasks, setLinkedTasks] = useState<Task[]>([])

  const currentTask = allTasks.find(t => t.id === taskId)
  const workspaceId = currentTask?.workspace_id ?? ''
  const projectId = currentTask?.project_id ?? null

  useEffect(() => {
    let active = true
    getDependencies(taskId).then(({ blockedBy: bb, blocking: bl }) => {
      if (!active) return
      setBlockedBy(bb)
      setBlocking(bl)
      onBlockersChange?.(bb)
    })
    getLinkedTasks(taskId).then(linked => {
      if (!active) return
      setLinkedTasks(linked)
    })
    return () => { active = false }
  // onBlockersChange intentionally omitted — stable ref via parent useRef pattern
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId])

  const blockedByIds = new Set(blockedBy.map(t => t.id))
  const blockingIds = new Set(blocking.map(t => t.id))
  const linkedIds = new Set(linkedTasks.map(t => t.id))

  // Only show tasks from the same project in the "Blocked by" picker
  const availableForDep = allTasks.filter(
    t =>
      t.id !== taskId &&
      t.project_id === projectId &&
      t.parent_id === null &&
      !blockedByIds.has(t.id) &&
      !blockingIds.has(t.id) &&
      !t.is_archived
  )
  const availableForLink = allTasks.filter(
    t => t.id !== taskId && !linkedIds.has(t.id) && !t.is_archived
  )

  async function handleAddDep(dependsOnId: string) {
    if (!dependsOnId) return
    const task = allTasks.find(t => t.id === dependsOnId)
    if (!task) return
    const next = [...blockedBy, task]
    setBlockedBy(next)
    onBlockersChange?.(next)
    try {
      await addDependency(workspaceId, taskId, dependsOnId)
    } catch {
      setBlockedBy(blockedBy)
      onBlockersChange?.(blockedBy)
    }
  }

  async function handleRemoveDep(dependsOnId: string) {
    const next = blockedBy.filter(t => t.id !== dependsOnId)
    setBlockedBy(next)
    onBlockersChange?.(next)
    try {
      await removeDependency(taskId, dependsOnId)
    } catch {
      setBlockedBy(blockedBy)
      onBlockersChange?.(blockedBy)
    }
  }

  async function handleAddLink(linkedTaskId: string) {
    if (!linkedTaskId) return
    const task = allTasks.find(t => t.id === linkedTaskId)
    if (!task) return
    setLinkedTasks(prev => [...prev, task])
    try {
      await addLink(workspaceId, taskId, linkedTaskId)
    } catch {
      setLinkedTasks(prev => prev.filter(t => t.id !== linkedTaskId))
    }
  }

  async function handleRemoveLink(linkedTaskId: string) {
    setLinkedTasks(prev => prev.filter(t => t.id !== linkedTaskId))
    try {
      await removeLink(taskId, linkedTaskId)
    } catch {
      const task = allTasks.find(t => t.id === linkedTaskId)
      if (task) setLinkedTasks(prev => [...prev, task])
    }
  }

  const selectClass = [
    'h-8 px-2 text-sm rounded-[var(--radius)]',
    'border border-[var(--border-2)] bg-[var(--surface)]',
    'text-[var(--tx-2)] w-full',
  ].join(' ')

  return (
    <div className="flex flex-col gap-4">

      {/* Blocked by */}
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--tx-3)] mb-2">
          Blocked by
        </p>
        {blockedBy.length > 0 && (
          <ul className="flex flex-col gap-1 mb-2" aria-label="Blocked by">
            {blockedBy.map(t => (
              <li key={t.id} className="flex items-center gap-2 text-sm">
                <span
                  className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium text-white"
                  style={{ backgroundColor: STATUS_COLORS[t.status] }}
                >
                  {STATUS_LABELS[t.status]}
                </span>
                <span className="flex-1 truncate text-[var(--tx-1)]">{t.title}</span>
                <button
                  onClick={() => handleRemoveDep(t.id)}
                  className="p-0.5 rounded hover:bg-[var(--surface-2)] text-[var(--tx-3)] hover:text-[var(--tx-1)] transition-colors shrink-0"
                  aria-label={`Remove dependency on ${t.title}`}
                >
                  <IconX size={12} />
                </button>
              </li>
            ))}
          </ul>
        )}
        {availableForDep.length > 0 && (
          <select
            value=""
            onChange={e => handleAddDep(e.target.value)}
            className={selectClass}
            aria-label="Add blocked-by dependency"
          >
            <option value="" disabled>Add blocked by…</option>
            {availableForDep.map(t => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        )}
      </div>

      {/* Blocking (read-only) */}
      {blocking.length > 0 && (
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--tx-3)] mb-2">
            Blocking
          </p>
          <ul className="flex flex-col gap-1" aria-label="Blocking">
            {blocking.map(t => (
              <li key={t.id} className="flex items-center gap-2 text-sm">
                <span
                  className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium text-white"
                  style={{ backgroundColor: STATUS_COLORS[t.status] }}
                >
                  {STATUS_LABELS[t.status]}
                </span>
                <span className="flex-1 truncate text-[var(--tx-1)]">{t.title}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Related tasks */}
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--tx-3)] mb-2">
          Related tasks
        </p>
        {linkedTasks.length > 0 && (
          <ul className="flex flex-col gap-1 mb-2" aria-label="Related tasks">
            {linkedTasks.map(t => (
              <li key={t.id} className="flex items-center gap-2 text-sm">
                <span className="flex-1 truncate text-[var(--tx-1)]">{t.title}</span>
                <button
                  onClick={() => handleRemoveLink(t.id)}
                  className="p-0.5 rounded hover:bg-[var(--surface-2)] text-[var(--tx-3)] hover:text-[var(--tx-1)] transition-colors shrink-0"
                  aria-label={`Remove link to ${t.title}`}
                >
                  <IconX size={12} />
                </button>
              </li>
            ))}
          </ul>
        )}
        {availableForLink.length > 0 && (
          <select
            value=""
            onChange={e => handleAddLink(e.target.value)}
            className={selectClass}
            aria-label="Add related task"
          >
            <option value="" disabled>Add related task…</option>
            {availableForLink.map(t => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        )}
      </div>

    </div>
  )
}
