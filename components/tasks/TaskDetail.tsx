'use client'

import { useEffect, useRef, useState } from 'react'
import {
  IconX,
  IconArchive,
  IconTrash,
  IconSettings,
  IconCircle,
  IconCircleDashed,
  IconCircleCheck,
  IconProgress,
} from '@tabler/icons-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SubtaskList } from '@/components/tasks/SubtaskList'
import { LabelPicker } from '@/components/tasks/LabelPicker'
import { TaskDependencies } from '@/components/tasks/TaskDependencies'
import { DueDatePicker } from '@/components/tasks/DueDatePicker'
import { SnoozeMenu } from '@/components/tasks/SnoozeMenu'
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

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; color: string; bg: string; border: string }[] = [
  { value: 'urgent', label: 'Urgent', color: '#B91C1C', bg: '#FEF2F2', border: '#FECACA' },
  { value: 'high',   label: 'High',   color: '#C25200', bg: '#FFF8EC', border: '#FFD98A' },
  { value: 'medium', label: 'Medium', color: '#007DA4', bg: '#E8F8FD', border: '#B8ECFA' },
  { value: 'low',    label: 'Low',    color: '#5E7F91', bg: '#E2EDF2', border: '#9DBFCF' },
]

function StatusIcon({ status }: { status: TaskStatus }) {
  if (status === 'done') return <IconCircleCheck size={14} />
  if (status === 'in_progress') return <IconProgress size={14} />
  if (status === 'in_review') return <IconCircle size={14} />
  return <IconCircleDashed size={14} />
}

export function TaskDetail() {
  const { detailTaskId, isCreating, createDefaults, closeDetail } = useUI()
  const { tasks, editTask, archiveTask, removeTask, addTask } = useTasks()
  const { projects } = useProjects()

  const [isClosing, setIsClosing] = useState(false)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Edit mode state
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const titleInputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Create mode state
  const [draftTitle, setDraftTitle] = useState('')
  const [draftStatus, setDraftStatus] = useState<TaskStatus>('todo')
  const [draftPriority, setDraftPriority] = useState<TaskPriority>('medium')
  const [draftDueDate, setDraftDueDate] = useState<string | null>(null)
  const [draftProjectId, setDraftProjectId] = useState<string | null>(null)
  const [draftDescription, setDraftDescription] = useState('')
  const [draftEstimatedMins, setDraftEstimatedMins] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const createTitleRef = useRef<HTMLInputElement>(null)

  const task = (!isCreating && detailTaskId) ? tasks.find(t => t.id === detailTaskId) ?? null : null

  function handleClose() {
    setIsClosing(true)
    closeTimerRef.current = setTimeout(closeDetail, 200)
  }

  // Reset closing state and cancel any pending timer when panel changes
  useEffect(() => {
    setIsClosing(false)
    clearTimeout(closeTimerRef.current)
  }, [detailTaskId])

  // Initialize create form from defaults when entering create mode
  useEffect(() => {
    if (!isCreating) return
    setDraftTitle('')
    setDraftStatus('todo')
    setDraftPriority('medium')
    setDraftDueDate(createDefaults?.due_date ?? null)
    setDraftProjectId(createDefaults?.project_id ?? null)
    setDraftDescription('')
    setDraftEstimatedMins(null)
    setSubmitting(false)
  }, [detailTaskId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-focus title in create mode
  useEffect(() => {
    if (isCreating) createTitleRef.current?.focus()
  }, [isCreating])

  // Auto-close when task disappears (archived/deleted) — skip in create mode
  useEffect(() => {
    if (!isCreating && detailTaskId && !task) closeDetail()
  }, [detailTaskId, isCreating, task, closeDetail])

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

  if (!detailTaskId) return null
  if (!isCreating && !task) return null

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

  async function handleCreate() {
    const trimmed = draftTitle.trim()
    if (!trimmed || submitting) return
    setSubmitting(true)
    try {
      await addTask({
        title: trimmed,
        status: draftStatus,
        priority: draftPriority,
        due_date: draftDueDate,
        project_id: draftProjectId,
        description: draftDescription.trim() || null,
        estimated_mins: draftEstimatedMins,
      })
      handleClose()
    } finally {
      setSubmitting(false)
    }
  }

  const fieldClass = [
    'h-9 px-3 rounded-[var(--radius)]',
    'border border-[var(--border-2)] bg-[var(--surface)]',
    'text-sm text-[var(--tx-1)]',
    'focus:outline-none focus:border-[var(--accent)]',
    'focus:shadow-[0_0_0_3px_var(--focus-ring)]',
  ].join(' ')

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
        aria-label={isCreating ? 'New task' : 'Task detail'}
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
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-[var(--border)] shrink-0">
          {isCreating ? (
            <>
              <span className="text-sm font-medium text-[var(--tx-2)]">New task</span>
              <div className="flex-1" />
            </>
          ) : (
            <>
              {/* Left: Snooze + Gear (archive/delete) — away from close */}
              <SnoozeMenu
                taskId={task!.id}
                onSnooze={until => editTask(task!.id, { snoozed_until: until })}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="p-1.5 rounded hover:bg-[var(--surface-2)] text-[var(--tx-3)] hover:text-[var(--tx-2)] transition-colors"
                    aria-label="Task options"
                  >
                    <IconSettings size={16} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-40">
                  <DropdownMenuItem
                    onClick={() => { archiveTask(task!.id); handleClose() }}
                    className="gap-2 cursor-pointer"
                  >
                    <IconArchive size={14} />
                    Archive
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setConfirmDelete(true)}
                    className="gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <IconTrash size={14} />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="flex-1" />
            </>
          )}
          <button
            onClick={handleClose}
            className="p-1.5 rounded hover:bg-[var(--surface-2)] text-[var(--tx-3)] hover:text-[var(--tx-2)] transition-colors"
            aria-label="Close detail panel"
          >
            <IconX size={16} />
          </button>
        </div>

        {/* Delete confirmation strip */}
        {confirmDelete && !isCreating && (
          <div
            className="px-4 py-2.5 flex items-center justify-between gap-3 shrink-0"
            style={{
              background: '#FEF2F2',
              borderBottom: '1px solid #FECACA',
            }}
          >
            <span className="text-sm text-red-700">Delete this task permanently?</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="h-7 px-2.5 rounded text-xs font-medium transition-colors hover:bg-red-100 text-red-700"
              >
                Cancel
              </button>
              <button
                onClick={() => { removeTask(task!.id); handleClose() }}
                className="h-7 px-2.5 rounded text-xs font-medium text-white transition-colors"
                style={{ background: '#B91C1C' }}
                aria-label="Confirm delete"
              >
                Delete
              </button>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 px-5 py-4 flex flex-col gap-5">
          {isCreating ? (
            <>
              {/* Create mode — title */}
              <input
                ref={createTitleRef}
                value={draftTitle}
                onChange={e => setDraftTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleCreate()
                  if (e.key === 'Escape') handleClose()
                }}
                placeholder="Task title…"
                className={[
                  'w-full text-xl font-semibold tracking-tight bg-transparent',
                  'border-b border-[var(--border-2)] outline-none',
                  'text-[var(--tx-1)] pb-0.5 placeholder:text-[var(--tx-3)]',
                  'focus:border-[var(--accent)]',
                ].join(' ')}
                aria-label="Task title"
              />

              {/* Status */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--tx-3)]">
                  Status
                </label>
                <div className="relative">
                  <select
                    value={draftStatus}
                    onChange={e => setDraftStatus(e.target.value as TaskStatus)}
                    className={fieldClass + ' w-full appearance-none cursor-pointer pr-8'}
                    aria-label="Task status"
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--tx-3)]">
                    <StatusIcon status={draftStatus} />
                  </span>
                </div>
              </div>

              {/* Priority */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--tx-3)]">
                  Priority
                </label>
                <div className="flex gap-1.5">
                  {PRIORITY_OPTIONS.map(p => {
                    const active = draftPriority === p.value
                    return (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setDraftPriority(p.value)}
                        className="flex-1 h-8 text-xs font-medium rounded-[var(--radius)] transition-all"
                        style={{
                          background: p.bg,
                          color: p.color,
                          border: `1px solid ${active ? p.color : p.border}`,
                          fontWeight: active ? 600 : 400,
                          boxShadow: active ? `0 0 0 2px ${p.border}` : 'none',
                        }}
                        aria-label={`Set priority ${p.label}`}
                        aria-pressed={active}
                      >
                        {p.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Due date */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--tx-3)]">
                  Due date
                </label>
                <DueDatePicker value={draftDueDate} onChange={setDraftDueDate} />
              </div>

              {/* Project */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--tx-3)]">
                  Project
                </label>
                <select
                  value={draftProjectId ?? ''}
                  onChange={e => setDraftProjectId(e.target.value || null)}
                  className={fieldClass + ' w-full'}
                  aria-label="Project"
                >
                  <option value="">No project</option>
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
                  value={draftDescription}
                  onChange={e => setDraftDescription(e.target.value)}
                  rows={3}
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
                  value={draftEstimatedMins ?? ''}
                  onChange={e => setDraftEstimatedMins(e.target.value ? parseInt(e.target.value, 10) : null)}
                  placeholder="—"
                  className={fieldClass + ' w-32'}
                  aria-label="Estimated minutes"
                />
              </div>

              {/* Submit */}
              <button
                type="button"
                onClick={handleCreate}
                disabled={!draftTitle.trim() || submitting}
                className="h-9 px-4 rounded-[var(--radius)] text-sm font-medium transition-colors disabled:opacity-40"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                {submitting ? 'Creating…' : 'Create task'}
              </button>
            </>
          ) : (
            <>
              {/* Edit mode */}

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
                    {task!.title}
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
                    value={task!.status}
                    onChange={e => editTask(task!.id, { status: e.target.value as TaskStatus })}
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
                    <StatusIcon status={task!.status} />
                  </span>
                </div>
              </div>

              {/* Priority */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--tx-3)]">
                  Priority
                </label>
                <div className="flex gap-1.5">
                  {PRIORITY_OPTIONS.map(p => {
                    const active = task!.priority === p.value
                    return (
                      <button
                        key={p.value}
                        onClick={() => editTask(task!.id, { priority: p.value })}
                        className="flex-1 h-8 text-xs font-medium rounded-[var(--radius)] transition-all"
                        style={{
                          background: p.bg,
                          color: p.color,
                          border: `1px solid ${active ? p.color : p.border}`,
                          fontWeight: active ? 600 : 400,
                          boxShadow: active ? `0 0 0 2px ${p.border}` : 'none',
                        }}
                        aria-label={`Set priority ${p.label}`}
                        aria-pressed={active}
                      >
                        {p.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Due date */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--tx-3)]">
                  Due date
                </label>
                <DueDatePicker
                  value={task!.due_date}
                  onChange={date => editTask(task!.id, { due_date: date })}
                />
              </div>

              {/* Project */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--tx-3)]">
                  Project
                </label>
                <select
                  value={task!.project_id ?? ''}
                  onChange={e => editTask(task!.id, { project_id: e.target.value || null })}
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
                  defaultValue={task!.description ?? ''}
                  key={task!.id}
                  onBlur={e => {
                    const val = e.target.value.trim() || null
                    if (val !== task!.description) editTask(task!.id, { description: val })
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
                  defaultValue={task!.estimated_mins ?? ''}
                  key={task!.id}
                  onBlur={e => {
                    const val = e.target.value ? parseInt(e.target.value, 10) : null
                    if (val !== task!.estimated_mins) editTask(task!.id, { estimated_mins: val })
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
                <SubtaskList parentId={task!.id} workspaceId={task!.workspace_id} />
              </div>

              {/* Labels */}
              <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border)]">
                <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--tx-3)]">
                  Labels
                </p>
                <LabelPicker taskId={task!.id} workspaceId={task!.workspace_id} />
              </div>

              {/* Dependencies */}
              <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border)]">
                <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--tx-3)]">
                  Dependencies
                </p>
                <TaskDependencies taskId={task!.id} allTasks={tasks} />
              </div>

              {/* Activity stub */}
              <div className="pt-2 border-t border-[var(--border)]">
                <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--tx-3)] mb-1">
                  Activity
                </p>
                <p className="text-sm text-[var(--tx-3)]">— coming soon</p>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
