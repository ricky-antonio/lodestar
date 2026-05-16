'use client'

import { useState } from 'react'
import { IconChevronUp, IconChevronDown, IconDotsVertical } from '@tabler/icons-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { sortTasks, type SortField } from '@/lib/tasks'
import { useTasks } from '@/lib/context/TasksContext'
import { useProjects } from '@/lib/context/ProjectsContext'
import { useUI } from '@/lib/context/UIContext'
import type { Task, TaskStatus, TaskPriority } from '@/lib/types'

interface Props {
  tasks: Task[]
  onArchive: (id: string) => void
  onDelete: (id: string) => void
  onToggleDone: (id: string) => void
  onBulkArchive: (ids: string[]) => void
  onReorder: (taskId: string, newPosition: number) => void
}

type ListSortField = Extract<SortField, 'priority' | 'title' | 'status' | 'due_date'>

const COLS: { field: ListSortField; label: string }[] = [
  { field: 'priority', label: 'Priority' },
  { field: 'title', label: 'Title' },
  { field: 'status', label: 'Status' },
  { field: 'due_date', label: 'Due Date' },
]

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  in_review: 'In review',
  done: 'Done',
}

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

export function ListView({
  tasks, onArchive, onDelete, onToggleDone, onBulkArchive,
}: Props) {
  const { editTask } = useTasks()
  const { projects } = useProjects()
  const { openDetail } = useUI()

  const [sortField, setSortField] = useState<ListSortField>('priority')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null)
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null)
  const [editingPriorityId, setEditingPriorityId] = useState<string | null>(null)
  const [titleDraft, setTitleDraft] = useState('')

  const sorted = sortTasks(tasks, sortField, sortDir)
  const allSelected = sorted.length > 0 && selectedIds.size === sorted.length

  function handleHeaderClick(field: ListSortField) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  function toggleRow(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelectedIds(allSelected ? new Set() : new Set(sorted.map(t => t.id)))
  }

  function commitTitle(id: string) {
    const v = titleDraft.trim()
    if (v) editTask(id, { title: v })
    setEditingTitleId(null)
  }

  function handleBulkArchive() {
    onBulkArchive(Array.from(selectedIds))
    setSelectedIds(new Set())
  }

  return (
    <div className="flex flex-col gap-2">
      {selectedIds.size > 0 && (
        <div
          className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm"
          style={{ background: 'var(--accent-bg)', border: '0.5px solid var(--accent-border)' }}
        >
          <span style={{ color: 'var(--accent)' }}>{selectedIds.size} selected</span>
          <button
            type="button"
            onClick={handleBulkArchive}
            className="px-3 py-1 rounded text-sm font-medium"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            Archive {selectedIds.size} tasks
          </button>
        </div>
      )}

      <div
        className="rounded-lg overflow-hidden"
        style={{ border: '0.5px solid var(--border)', background: 'var(--surface)' }}
      >
        <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
              <th className="w-10 px-3 py-2.5 text-left">
                <input
                  type="checkbox"
                  aria-label="Select all"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="cursor-pointer"
                />
              </th>
              {COLS.map(col => (
                <th
                  key={col.field}
                  className="px-3 py-2.5 text-left font-medium cursor-pointer select-none"
                  style={{ color: 'var(--tx-3)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}
                  onClick={() => handleHeaderClick(col.field)}
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    {sortField === col.field && (
                      sortDir === 'asc'
                        ? <IconChevronUp size={12} aria-hidden />
                        : <IconChevronDown size={12} aria-hidden />
                    )}
                  </span>
                </th>
              ))}
              <th
                className="px-3 py-2.5 text-left font-medium"
                style={{ color: 'var(--tx-3)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}
              >
                Project
              </th>
              <th className="w-10 px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {sorted.map(task => {
              const project = projects.find(p => p.id === task.project_id)
              const selected = selectedIds.has(task.id)
              return (
                <tr
                  key={task.id}
                  style={{
                    borderBottom: '0.5px solid var(--border)',
                    background: selected ? 'var(--accent-bg)' : 'transparent',
                  }}
                >
                  <td className="px-3 py-2.5">
                    <input
                      type="checkbox"
                      aria-label={`Select ${task.title}`}
                      checked={selected}
                      onChange={() => toggleRow(task.id)}
                      className="cursor-pointer"
                    />
                  </td>

                  {/* Priority */}
                  <td className="px-3 py-2.5">
                    {editingPriorityId === task.id ? (
                      <select
                        autoFocus
                        value={task.priority}
                        onChange={e => {
                          editTask(task.id, { priority: e.target.value as TaskPriority })
                          setEditingPriorityId(null)
                        }}
                        onBlur={() => setEditingPriorityId(null)}
                        aria-label="Priority"
                        className="text-xs"
                      >
                        {(Object.entries(PRIORITY_LABELS) as [TaskPriority, string][]).map(([v, l]) => (
                          <option key={v} value={v}>{l}</option>
                        ))}
                      </select>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditingPriorityId(task.id)}
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{ color: 'var(--tx-2)' }}
                      >
                        {PRIORITY_LABELS[task.priority]}
                      </button>
                    )}
                  </td>

                  {/* Title */}
                  <td className="px-3 py-2.5 max-w-[240px]">
                    {editingTitleId === task.id ? (
                      <input
                        autoFocus
                        value={titleDraft}
                        onChange={e => setTitleDraft(e.target.value)}
                        onBlur={() => commitTitle(task.id)}
                        onKeyDown={e => e.key === 'Enter' && commitTitle(task.id)}
                        aria-label="Task title"
                        className="w-full bg-transparent border-b focus:outline-none"
                        style={{ borderColor: 'var(--accent)', color: 'var(--tx-1)' }}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => { setEditingTitleId(task.id); setTitleDraft(task.title) }}
                        className="text-left w-full truncate"
                        style={{ color: 'var(--tx-1)' }}
                      >
                        {task.title}
                      </button>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-3 py-2.5">
                    {editingStatusId === task.id ? (
                      <select
                        autoFocus
                        value={task.status}
                        onChange={e => {
                          editTask(task.id, { status: e.target.value as TaskStatus })
                          setEditingStatusId(null)
                        }}
                        onBlur={() => setEditingStatusId(null)}
                        aria-label="Status"
                        className="text-xs"
                      >
                        {(Object.entries(STATUS_LABELS) as [TaskStatus, string][]).map(([v, l]) => (
                          <option key={v} value={v}>{l}</option>
                        ))}
                      </select>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditingStatusId(task.id)}
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{ color: 'var(--tx-2)' }}
                      >
                        {STATUS_LABELS[task.status]}
                      </button>
                    )}
                  </td>

                  {/* Due date */}
                  <td className="px-3 py-2.5 text-xs" style={{ color: task.due_date ? 'var(--tx-2)' : 'var(--tx-3)' }}>
                    {task.due_date ?? '—'}
                  </td>

                  {/* Project */}
                  <td className="px-3 py-2.5 text-xs" style={{ color: 'var(--tx-3)' }}>
                    {project?.name ?? '—'}
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-2.5">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          aria-label={`Actions for ${task.title}`}
                          className="flex items-center justify-center w-7 h-7 rounded hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#66C4FF]"
                          style={{ color: 'var(--tx-3)' }}
                        >
                          <IconDotsVertical size={15} aria-hidden />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openDetail(task.id)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onToggleDone(task.id)}>
                          {task.status === 'done' ? 'Mark as to do' : 'Mark as done'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onArchive(task.id)}>Archive</DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete(task.id)}
                          style={{ color: 'var(--action)' }}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              )
            })}
            {sorted.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-sm"
                  style={{ color: 'var(--tx-3)' }}
                >
                  No tasks
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
