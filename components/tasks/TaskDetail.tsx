'use client'

import { useEffect, useRef, useState } from 'react'
import {
  IconX,
  IconArchive,
  IconTrash,
  IconCircle,
  IconCircleDashed,
  IconCircleCheck,
  IconProgress,
} from '@tabler/icons-react'
import { SubtaskList } from '@/components/tasks/SubtaskList'
import { LabelPicker } from '@/components/tasks/LabelPicker'
import { useUI } from '@/lib/context/UIContext'
import { useTasks } from '@/lib/context/TasksContext'
import { useProjects } from '@/lib/context/ProjectsContext'
import type { TaskStatus, TaskPriority } from '@/lib/types'

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: 'To do' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'in_review', label: 'In review' },
  { value: 'done', label: 'Done' },
]

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'urgent', label: 'Urgent', color: '#EF4444' },
  { value: 'high', label: 'High', color: '#EA6400' },
  { value: 'medium', label: 'Medium', color: '#00B6EC' },
  { value: 'low', label: 'Low', color: '#9DBFCF' },
]

function StatusIcon({ status }: { status: TaskStatus }) {
  if (status === 'done') return <IconCircleCheck size={14} />
  if (status === 'in_progress') return <IconProgress size={14} />
  if (status === 'in_review') return <IconCircle size={14} />
  return <IconCircleDashed size={14} />
}

export function TaskDetail() {
  const { detailTaskId, closeDetail } = useUI()
  const { tasks, editTask, archiveTask, removeTask } = useTasks()
  const { projects } = useProjects()

  const [isClosing, setIsClosing] = useState(false)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const titleInputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const task = detailTaskId ? tasks.find(t => t.id === detailTaskId) ?? null : null

  function handleClose() {
    setIsClosing(true)
    closeTimerRef.current = setTimeout(closeDetail, 200)
  }

  // Reset closing state and cancel any pending timer when a new task is opened
  useEffect(() => {
    setIsClosing(false)
    clearTimeout(closeTimerRef.current)
  }, [detailTaskId])

  // Auto-close when task disappears from context (archived/deleted) — no animation needed
  useEffect(() => {
    if (detailTaskId && !task) closeDetail()
  }, [detailTaskId, task, closeDetail])

  // Escape key closes panel
  useEffect(() => {
    if (!detailTaskId) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [detailTaskId])

  // Focus title input when editing starts
  useEffect(() => {
    if (editingTitle) titleInputRef.current?.focus()
  }, [editingTitle])

  if (!detailTaskId || !task) return null

  function handleTitleClick() {
    if (!task) return
    setTitleDraft(task.title)
    setEditingTitle(true)
  }

  function handleTitleBlur() {
    setEditingTitle(false)
    const trimmed = titleDraft.trim()
    if (trimmed && trimmed !== task!.title) {
      editTask(task!.id, { title: trimmed })
    }
  }

  function handleTitleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') titleInputRef.current?.blur()
    if (e.key === 'Escape') {
      setEditingTitle(false)
      setTitleDraft(task!.title)
    }
  }

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    removeTask(task!.id)
    handleClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Task detail"
        className={[
          'fixed z-50 top-0 right-0 h-full overflow-y-auto',
          'w-full md:w-[400px]',
          'bg-[var(--surface)] border-l border-[var(--border)]',
          'flex flex-col',
          isClosing ? 'animate-slide-out-right' : 'animate-slide-in-right',
        ].join(' ')}
        style={{ boxShadow: '-4px 0 24px rgba(0,0,0,0.08)' }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)] shrink-0">
          <div className="flex-1" />
          <button
            onClick={() => { archiveTask(task.id); handleClose() }}
            className="p-1.5 rounded hover:bg-[var(--surface-2)] text-[var(--tx-3)] hover:text-[var(--tx-2)] transition-colors"
            aria-label="Archive task"
          >
            <IconArchive size={16} />
          </button>
          <button
            onClick={handleDelete}
            className={[
              'p-1.5 rounded transition-colors',
              confirmDelete
                ? 'bg-[var(--action-bg)] text-[var(--action)] border border-[var(--action-border)]'
                : 'hover:bg-[var(--surface-2)] text-[var(--tx-3)] hover:text-[var(--action)]',
            ].join(' ')}
            aria-label={confirmDelete ? 'Confirm delete' : 'Delete task'}
          >
            <IconTrash size={16} />
          </button>
          <button
            onClick={handleClose}
            className="p-1.5 rounded hover:bg-[var(--surface-2)] text-[var(--tx-3)] hover:text-[var(--tx-2)] transition-colors"
            aria-label="Close detail panel"
          >
            <IconX size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 px-5 py-4 flex flex-col gap-5">
          {/* Title */}
          <div>
            {editingTitle ? (
              <input
                ref={titleInputRef}
                value={titleDraft}
                onChange={e => setTitleDraft(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={handleTitleKeyDown}
                className={[
                  'w-full text-xl font-semibold tracking-tight bg-transparent',
                  'border-b border-[var(--accent)] outline-none',
                  'text-[var(--tx-1)] pb-0.5',
                ].join(' ')}
                aria-label="Edit task title"
              />
            ) : (
              <h2
                className="text-xl font-semibold tracking-tight text-[var(--tx-1)] cursor-text"
                onClick={handleTitleClick}
              >
                {task.title}
              </h2>
            )}
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--tx-3)]">
              Status
            </label>
            <div className="relative">
              <select
                value={task.status}
                onChange={e => editTask(task.id, { status: e.target.value as TaskStatus })}
                className={[
                  'w-full h-9 pl-3 pr-8 rounded-[var(--radius)]',
                  'border border-[var(--border-2)] bg-[var(--surface)]',
                  'text-sm text-[var(--tx-1)] appearance-none cursor-pointer',
                  'focus:outline-none focus:border-[var(--accent)]',
                  'focus:shadow-[0_0_0_3px_var(--focus-ring)]',
                ].join(' ')}
                aria-label="Task status"
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--tx-3)]">
                <StatusIcon status={task.status} />
              </span>
            </div>
          </div>

          {/* Priority */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--tx-3)]">
              Priority
            </label>
            <div className="flex gap-1.5">
              {PRIORITY_OPTIONS.map(p => (
                <button
                  key={p.value}
                  onClick={() => editTask(task.id, { priority: p.value })}
                  className={[
                    'flex-1 h-8 text-xs font-medium rounded-[var(--radius)] border transition-colors',
                    task.priority === p.value
                      ? 'border-transparent text-white'
                      : 'border-[var(--border-2)] text-[var(--tx-2)] bg-[var(--surface)] hover:bg-[var(--surface-2)]',
                  ].join(' ')}
                  style={task.priority === p.value ? { backgroundColor: p.color } : undefined}
                  aria-label={`Set priority ${p.label}`}
                  aria-pressed={task.priority === p.value}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Due date */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--tx-3)]">
              Due date
            </label>
            <input
              type="date"
              value={task.due_date ?? ''}
              onChange={e => editTask(task.id, { due_date: e.target.value || null })}
              className={[
                'h-9 px-3 rounded-[var(--radius)]',
                'border border-[var(--border-2)] bg-[var(--surface)]',
                'text-sm text-[var(--tx-1)]',
                'focus:outline-none focus:border-[var(--accent)]',
                'focus:shadow-[0_0_0_3px_var(--focus-ring)]',
              ].join(' ')}
              aria-label="Due date"
            />
          </div>

          {/* Project */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--tx-3)]">
              Project
            </label>
            <select
              value={task.project_id ?? ''}
              onChange={e => editTask(task.id, { project_id: e.target.value || null })}
              className={[
                'h-9 px-3 rounded-[var(--radius)]',
                'border border-[var(--border-2)] bg-[var(--surface)]',
                'text-sm text-[var(--tx-1)]',
                'focus:outline-none focus:border-[var(--accent)]',
                'focus:shadow-[0_0_0_3px_var(--focus-ring)]',
              ].join(' ')}
              aria-label="Project"
            >
              <option value="">Inbox</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--tx-3)]">
              Description
            </label>
            <textarea
              defaultValue={task.description ?? ''}
              key={task.id}
              onBlur={e => {
                const val = e.target.value.trim() || null
                if (val !== task.description) editTask(task.id, { description: val })
              }}
              rows={4}
              placeholder="Add a description…"
              className={[
                'px-3 py-2 rounded-[var(--radius)] resize-none',
                'border border-[var(--border-2)] bg-[var(--surface)]',
                'text-sm text-[var(--tx-1)] placeholder:text-[var(--tx-3)]',
                'focus:outline-none focus:border-[var(--accent)]',
                'focus:shadow-[0_0_0_3px_var(--focus-ring)]',
              ].join(' ')}
              aria-label="Description"
            />
          </div>

          {/* Estimated minutes */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--tx-3)]">
              Estimated minutes
            </label>
            <input
              type="number"
              min={0}
              defaultValue={task.estimated_mins ?? ''}
              key={task.id}
              onBlur={e => {
                const val = e.target.value ? parseInt(e.target.value, 10) : null
                if (val !== task.estimated_mins) editTask(task.id, { estimated_mins: val })
              }}
              placeholder="—"
              className={[
                'h-9 px-3 rounded-[var(--radius)] w-32',
                'border border-[var(--border-2)] bg-[var(--surface)]',
                'text-sm text-[var(--tx-1)] placeholder:text-[var(--tx-3)]',
                'focus:outline-none focus:border-[var(--accent)]',
                'focus:shadow-[0_0_0_3px_var(--focus-ring)]',
              ].join(' ')}
              aria-label="Estimated minutes"
            />
          </div>

          {/* Subtasks */}
          <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border)]">
            <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--tx-3)]">
              Subtasks
            </p>
            <SubtaskList parentId={task.id} workspaceId={task.workspace_id} />
          </div>

          {/* Labels */}
          <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border)]">
            <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--tx-3)]">
              Labels
            </p>
            <LabelPicker taskId={task.id} workspaceId={task.workspace_id} />
          </div>

          {/* Stub sections */}
          <div className="flex flex-col gap-4">
            {(['Dependencies', 'Activity'] as const).map(section => (
              <div key={section}>
                <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--tx-3)] mb-1">
                  {section}
                </p>
                <p className="text-sm text-[var(--tx-3)]">— coming soon</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
