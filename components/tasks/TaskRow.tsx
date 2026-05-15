'use client'

import { useState, useRef } from 'react'
import { IconGripVertical, IconDotsVertical } from '@tabler/icons-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Task, TaskPriority } from '@/lib/types'
import { useUI } from '@/lib/context/UIContext'
import { useTasks } from '@/lib/context/TasksContext'

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  urgent: '#EF4444',
  high:   '#EA6400',
  medium: '#00B6EC',
  low:    '#9DBFCF',
}

function formatDueDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function isOverdue(dateStr: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day) < today
}

interface Props {
  task: Task
  onToggleDone: (id: string) => void
  onEdit: (id: string) => void
  onArchive: (id: string) => void
  onDelete: (id: string) => void
  dragHandleProps?: React.HTMLAttributes<HTMLElement>
}

export function TaskRow({
  task,
  onToggleDone,
  onEdit,
  onArchive,
  onDelete,
  dragHandleProps,
}: Props) {
  const { pushUndo } = useUI()
  const { editTask } = useTasks()

  const [editingTitle, setEditingTitle] = useState(false)
  const [editValue, setEditValue] = useState(task.title)
  const inputRef = useRef<HTMLInputElement>(null)

  const isDone = task.status === 'done'
  const overdue = !isDone && task.due_date != null && isOverdue(task.due_date)

  function startEdit() {
    setEditValue(task.title)
    setEditingTitle(true)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  function commitEdit() {
    setEditingTitle(false)
    if (editValue.trim() && editValue.trim() !== task.title) {
      onEdit(task.id)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') inputRef.current?.blur()
    else if (e.key === 'Escape') {
      setEditValue(task.title)
      setEditingTitle(false)
    }
  }

  return (
    <div
      className="group flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
      style={{
        minHeight: 44,
        background: 'var(--surface)',
        border: '0.5px solid var(--border)',
      }}
    >
      {/* Drag handle — hidden on desktop until hover, always visible on mobile */}
      <span
        {...dragHandleProps}
        role="button"
        tabIndex={0}
        aria-label="Drag to reorder"
        className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity cursor-grab touch-none flex-none flex items-center justify-center p-1"
        style={{ color: 'var(--tx-3)' }}
      >
        <IconGripVertical size={16} aria-hidden />
      </span>

      {/* Checkbox */}
      <button
        type="button"
        onClick={() => onToggleDone(task.id)}
        aria-label={isDone ? 'Mark as not done' : 'Mark as done'}
        className="flex-none flex items-center justify-center w-5 h-5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#66C4FF]"
        style={{
          border: `1.5px solid ${isDone ? '#22C55E' : 'var(--border-2)'}`,
          background: isDone ? '#22C55E' : 'transparent',
        }}
      >
        {isDone && (
          <svg width="10" height="7" viewBox="0 0 10 7" fill="none" aria-hidden>
            <path
              d="M1 3.5L3.8 6 9 1"
              stroke="#fff"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {/* Priority dot */}
      <span
        aria-hidden
        className="flex-none rounded-full"
        style={{ width: 8, height: 8, background: PRIORITY_COLORS[task.priority] }}
      />

      {/* Title */}
      <div className="flex-1 min-w-0">
        {editingTitle ? (
          <input
            ref={inputRef}
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            className="w-full text-sm bg-transparent focus:outline-none"
            style={{ color: 'var(--tx-1)' }}
            aria-label="Edit task title"
          />
        ) : (
          <button
            type="button"
            onClick={startEdit}
            className="w-full text-left text-sm truncate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#66C4FF] rounded"
            style={{
              color: isDone ? 'var(--tx-3)' : 'var(--tx-1)',
              textDecoration: isDone ? 'line-through' : 'none',
            }}
          >
            {task.title}
          </button>
        )}
      </div>

      {/* Due date */}
      {task.due_date && (
        <span
          data-testid="task-due-date"
          className="flex-none text-xs px-1.5 py-0.5 rounded whitespace-nowrap"
          style={{
            color: overdue ? '#EF4444' : 'var(--tx-3)',
            background: overdue ? '#FEF2F2' : 'var(--surface-2)',
          }}
        >
          {formatDueDate(task.due_date)}
        </span>
      )}

      {/* Three-dot menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Task actions"
            className="flex-none flex items-center justify-center w-7 h-7 rounded transition-colors hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#66C4FF]"
            style={{ color: 'var(--tx-3)' }}
          >
            <IconDotsVertical size={16} aria-hidden />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => onEdit(task.id)}>Edit</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => {
            onArchive(task.id)
            pushUndo({
              label: `Archived "${task.title}"`,
              message: `Archived "${task.title}"`,
              undo: () => editTask(task.id, { is_archived: false }),
            })
          }}>Archive</DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              onDelete(task.id)
              pushUndo({
                label: `Deleted "${task.title}"`,
                message: `Deleted "${task.title}"`,
                canUndo: false,
              })
            }}
            style={{ color: '#EF4444' }}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
