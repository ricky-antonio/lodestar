'use client'

import { useState, useEffect, useRef } from 'react'
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { IconDotsVertical, IconPlus, IconX } from '@tabler/icons-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getFractionalPosition } from '@/lib/tasks'
import { useUI } from '@/lib/context/UIContext'
import type { Task, TaskStatus, TaskPriority, Label } from '@/lib/types'

const COLUMNS: TaskStatus[] = ['todo', 'in_progress', 'done']

const STATUS_LABEL: Record<string, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
}

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: '#EF4444',
  high: '#EA6400',
  medium: '#00B6EC',
  low: '#9DBFCF',
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

function findTaskStatus(
  taskId: string,
  cols: Record<string, Task[]>,
): TaskStatus | undefined {
  return COLUMNS.find(s => cols[s]?.some((t: Task) => t.id === taskId))
}

// ─── Card UI ──────────────────────────────────────────────────────────────────

interface CardUIProps {
  task: Task
  onArchive: (id: string) => void
  onDelete: (id: string) => void
  isSelected?: boolean
  onSingleClick?: (id: string, shiftKey: boolean) => void
  onDoubleClick?: (id: string) => void
  taskLabelIds?: Record<string, string[]>
  labels?: Label[]
}

function CardUI({ task, onArchive, onDelete, isSelected = false, onSingleClick, onDoubleClick, taskLabelIds, labels }: CardUIProps) {
  const { openDetail } = useUI()
  const isDone = task.status === 'done'
  const overdue = !isDone && task.due_date != null && isOverdue(task.due_date)

  return (
    <div
      data-testid={`card-${task.id}`}
      aria-selected={isSelected}
      onClick={e => onSingleClick?.(task.id, e.shiftKey)}
      onDoubleClick={() => onDoubleClick?.(task.id)}
      style={{
        background: 'var(--surface)',
        border: isSelected
          ? '0.5px solid var(--accent)'
          : '0.5px solid var(--border)',
        borderLeft: `3px solid ${PRIORITY_COLORS[task.priority]}`,
        borderRadius: 12,
        cursor: onSingleClick ? 'pointer' : 'grab',
        outline: isSelected ? '2px solid var(--accent)' : undefined,
        outlineOffset: isSelected ? '-1px' : undefined,
      }}
      className="p-3"
    >
      <div className="flex items-start gap-2">
        <p
          className="text-[13px] font-medium leading-snug flex-1 min-w-0"
          style={{
            color: 'var(--tx-1)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {task.title}
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Task actions"
              onClick={e => e.stopPropagation()}
              className="flex-none flex items-center justify-center w-6 h-6 rounded hover:bg-[var(--surface-2)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#66C4FF]"
              style={{ color: 'var(--tx-3)' }}
            >
              <IconDotsVertical size={14} aria-hidden />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => openDetail(task.id)}>Edit</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onArchive(task.id)}>Archive</DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => onDelete(task.id)}
              style={{ color: '#EF4444' }}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-2 mt-2">
        {(() => {
          const labelIds = taskLabelIds?.[task.id] ?? []
          const taskLabels = labelIds
            .map(id => labels?.find(l => l.id === id))
            .filter((l): l is Label => l != null)
          if (taskLabels.length === 0) return null
          return (
            <div className="flex items-center gap-1" aria-label="Labels">
              {taskLabels.map(label => (
                <span
                  key={label.id}
                  aria-hidden
                  className="rounded-full flex-none"
                  title={label.name}
                  style={{ width: 8, height: 8, background: label.color }}
                />
              ))}
            </div>
          )
        })()}
        {task.due_date && (
          <span
            className="text-[11px] px-1.5 py-0.5 rounded whitespace-nowrap"
            style={{
              color: overdue ? '#EF4444' : 'var(--tx-3)',
              background: overdue ? '#FEF2F2' : 'var(--surface-2)',
            }}
          >
            {formatDueDate(task.due_date)}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Sortable card wrapper ────────────────────────────────────────────────────

interface SortableCardProps {
  task: Task
  isDragActive: boolean
  onArchive: (id: string) => void
  onDelete: (id: string) => void
  isSelected: boolean
  onSingleClick: (id: string, shiftKey: boolean) => void
  onDoubleClick: (id: string) => void
  taskLabelIds?: Record<string, string[]>
  labels?: Label[]
}

function SortableCard({ task, isDragActive, onArchive, onDelete, isSelected, onSingleClick, onDoubleClick, taskLabelIds, labels }: SortableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: CSS.Transform.toString(transform) ?? undefined,
        transition: isDragActive ? transition : undefined,
        opacity: isDragging ? 0 : 1,
        cursor: 'grab',
      }}
    >
      <CardUI
        task={task}
        onArchive={onArchive}
        onDelete={onDelete}
        isSelected={isSelected}
        onSingleClick={onSingleClick}
        onDoubleClick={onDoubleClick}
        taskLabelIds={taskLabelIds}
        labels={labels}
      />
    </div>
  )
}

// ─── Column ───────────────────────────────────────────────────────────────────

interface ColumnProps {
  status: TaskStatus
  tasks: Task[]
  isDragActive: boolean
  onArchive: (id: string) => void
  onDelete: (id: string) => void
  onAddTask?: (status: TaskStatus) => void
  selectedIds: Set<string>
  onCardClick: (id: string, shiftKey: boolean) => void
  onCardDoubleClick: (id: string) => void
  taskLabelIds?: Record<string, string[]>
  labels?: Label[]
}

function BoardColumn({
  status,
  tasks,
  isDragActive,
  onArchive,
  onDelete,
  onAddTask,
  selectedIds,
  onCardClick,
  onCardDoubleClick,
  taskLabelIds,
  labels,
}: ColumnProps) {
  const { setNodeRef } = useDroppable({ id: status })

  return (
    <div
      className="flex flex-col rounded-xl min-w-[240px] w-72 flex-shrink-0"
      style={{
        background: 'var(--surface-2)',
        border: '0.5px solid var(--border)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <span className="text-[13px] font-medium" style={{ color: 'var(--tx-1)' }}>
          {STATUS_LABEL[status]}
        </span>
        <span
          data-testid={`${status}-count`}
          className="text-[11px] font-medium px-1.5 py-0.5 rounded-full"
          style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Card list */}
      <div
        ref={setNodeRef}
        className="flex-1 overflow-y-auto px-2 py-1 flex flex-col gap-2 min-h-[40px]"
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <SortableCard
              key={task.id}
              task={task}
              isDragActive={isDragActive}
              onArchive={onArchive}
              onDelete={onDelete}
              isSelected={selectedIds.has(task.id)}
              onSingleClick={onCardClick}
              onDoubleClick={onCardDoubleClick}
              taskLabelIds={taskLabelIds}
              labels={labels}
            />
          ))}
        </SortableContext>
      </div>

      {/* Add task */}
      {onAddTask && (
        <button
          type="button"
          onClick={() => onAddTask(status)}
          className="flex items-center gap-1.5 px-3 py-2.5 text-sm hover:bg-[var(--surface)] rounded-b-xl transition-colors text-left"
          style={{ color: 'var(--tx-3)' }}
        >
          <IconPlus size={14} aria-hidden />
          Add task
        </button>
      )}
    </div>
  )
}

// ─── BoardView ────────────────────────────────────────────────────────────────

interface Props {
  tasks: Task[]
  onMoveTask: (taskId: string, newStatus: TaskStatus, newPosition: number) => void
  onArchive: (id: string) => void
  onDelete: (id: string) => void
  onAddTask?: (status: TaskStatus) => void
  onBulkMove?: (ids: string[], newStatus: TaskStatus) => void
  onBulkSetPriority?: (ids: string[], priority: TaskPriority) => void
  onBulkArchive?: (ids: string[]) => void
  onSelectionChange?: (ids: string[]) => void
  taskLabelIds?: Record<string, string[]>
  labels?: Label[]
}

export function BoardView({
  tasks,
  onMoveTask,
  onArchive,
  onDelete,
  onAddTask,
  onBulkMove,
  onBulkSetPriority,
  onBulkArchive,
  onSelectionChange,
  taskLabelIds,
  labels,
}: Props) {
  const { openDetail } = useUI()

  const [columnTasks, setColumnTasks] = useState<Record<TaskStatus, Task[]>>({
    todo: [],
    in_progress: [],
    in_review: [],
    done: [],
  })
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [lastClickedId, setLastClickedId] = useState<string | null>(null)
  const dragStartState = useRef<Record<TaskStatus, Task[]> | null>(null)

  useEffect(() => {
    const active = tasks.filter(t => !t.is_archived)
    setColumnTasks({
      todo: active.filter(t => t.status === 'todo').sort((a, b) => a.position - b.position),
      in_progress: active.filter(t => t.status === 'in_progress').sort((a, b) => a.position - b.position),
      in_review: active.filter(t => t.status === 'in_review').sort((a, b) => a.position - b.position),
      done: active.filter(t => t.status === 'done').sort((a, b) => a.position - b.position),
    })
  }, [tasks])

  useEffect(() => {
    onSelectionChange?.(Array.from(selectedIds))
  // onSelectionChange intentionally omitted — stable via parent useCallback
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds])

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
  )

  function handleCardClick(taskId: string, shiftKey: boolean) {
    if (shiftKey && lastClickedId) {
      const lastStatus = findTaskStatus(lastClickedId, columnTasks)
      const thisStatus = findTaskStatus(taskId, columnTasks)
      if (!lastStatus || !thisStatus) return

      if (lastStatus === thisStatus) {
        const col = columnTasks[lastStatus]
        const lastIdx = col.findIndex(t => t.id === lastClickedId)
        const thisIdx = col.findIndex(t => t.id === taskId)
        const from = Math.min(lastIdx, thisIdx)
        const to = Math.max(lastIdx, thisIdx)
        const rangeIds = col.slice(from, to + 1).map(t => t.id)
        setSelectedIds(prev => {
          const next = new Set(prev)
          rangeIds.forEach(id => next.add(id))
          return next
        })
      } else {
        // Cross-column: select both endpoints only
        setSelectedIds(prev => {
          const next = new Set(prev)
          next.add(taskId)
          next.add(lastClickedId)
          return next
        })
      }
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev)
        if (next.has(taskId)) {
          next.delete(taskId)
        } else {
          next.add(taskId)
        }
        return next
      })
      setLastClickedId(taskId)
    }
  }

  function clearSelection() {
    setSelectedIds(new Set())
    setLastClickedId(null)
  }

  function handleBulkMove(newStatus: TaskStatus) {
    onBulkMove?.(Array.from(selectedIds), newStatus)
    clearSelection()
  }

  function handleBulkSetPriority(priority: TaskPriority) {
    onBulkSetPriority?.(Array.from(selectedIds), priority)
    clearSelection()
  }

  function handleBulkArchive() {
    onBulkArchive?.(Array.from(selectedIds))
    clearSelection()
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
    dragStartState.current = columnTasks
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return

    const activeTaskId = active.id as string
    const overId = over.id as string

    const activeStatus = findTaskStatus(activeTaskId, columnTasks)
    if (!activeStatus) return

    const overIsColumn = (COLUMNS as string[]).includes(overId)
    const overStatus: TaskStatus | undefined = overIsColumn
      ? (overId as TaskStatus)
      : findTaskStatus(overId, columnTasks)

    if (!overStatus || activeStatus === overStatus) return

    setColumnTasks(prev => {
      const from = prev[activeStatus]
      const to = prev[overStatus]
      const fromIdx = from.findIndex(t => t.id === activeTaskId)
      if (fromIdx === -1) return prev

      const task = { ...from[fromIdx], status: overStatus }
      let newTo: Task[]

      if (overIsColumn) {
        newTo = [...to, task]
      } else {
        const overIdx = to.findIndex(t => t.id === overId)
        newTo = [...to]
        newTo.splice(overIdx >= 0 ? overIdx : to.length, 0, task)
      }

      return {
        ...prev,
        [activeStatus]: from.filter(t => t.id !== activeTaskId),
        [overStatus]: newTo,
      }
    })
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)

    const snapshot = dragStartState.current
    if (!snapshot) return

    if (!over) {
      setColumnTasks(snapshot)
      return
    }

    const activeTaskId = active.id as string
    const overId = over.id as string
    const overIsColumn = (COLUMNS as string[]).includes(overId)

    const currentStatus = findTaskStatus(activeTaskId, columnTasks)
    if (!currentStatus) return

    let finalColumn = [...columnTasks[currentStatus]]
    const activeIdx = finalColumn.findIndex(t => t.id === activeTaskId)
    if (activeIdx === -1) return

    if (!overIsColumn) {
      const overIdx = finalColumn.findIndex(t => t.id === overId)
      if (overIdx !== -1 && overIdx !== activeIdx) {
        finalColumn = arrayMove(finalColumn, activeIdx, overIdx)
        setColumnTasks(prev => ({ ...prev, [currentStatus]: finalColumn }))
      }
    }

    const finalIdx = finalColumn.findIndex(t => t.id === activeTaskId)
    const before = finalIdx > 0 ? (finalColumn[finalIdx - 1]?.position ?? null) : null
    const after = finalIdx < finalColumn.length - 1 ? (finalColumn[finalIdx + 1]?.position ?? null) : null
    const newPosition = getFractionalPosition(before, after)

    try {
      await onMoveTask(activeTaskId, currentStatus, newPosition)
    } catch {
      setColumnTasks(snapshot)
    }
  }

  const activeTask = activeId
    ? COLUMNS.flatMap(s => columnTasks[s] ?? []).find(t => t.id === activeId)
    : null

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 h-full">
          {COLUMNS.map(status => (
            <BoardColumn
              key={status}
              status={status}
              tasks={columnTasks[status] ?? []}
              isDragActive={!!activeId}
              onArchive={onArchive}
              onDelete={onDelete}
              onAddTask={onAddTask}
              selectedIds={selectedIds}
              onCardClick={handleCardClick}
              onCardDoubleClick={openDetail}
              taskLabelIds={taskLabelIds}
              labels={labels}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div style={{ opacity: 0.95, pointerEvents: 'none' }}>
              <CardUI
                task={activeTask}
                onArchive={() => {}}
                onDelete={() => {}}
                taskLabelIds={taskLabelIds}
                labels={labels}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div
          data-testid="bulk-action-bar"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-wrap items-center gap-1.5 px-4 py-2 rounded-xl shadow-lg"
          style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}
        >
          <span className="text-sm font-medium mr-1" style={{ color: 'var(--tx-2)' }}>
            {selectedIds.size} selected
          </span>
          <div className="w-px h-5 self-center" style={{ background: 'var(--border)' }} />

          <span className="text-xs ml-1" style={{ color: 'var(--tx-3)' }}>Move to:</span>
          {COLUMNS.map(status => (
            <button
              key={status}
              type="button"
              onClick={() => handleBulkMove(status)}
              className="text-xs px-2 py-1 rounded-md hover:bg-[var(--surface-2)] transition-colors"
              style={{ color: 'var(--tx-1)' }}
            >
              {STATUS_LABEL[status]}
            </button>
          ))}

          <div className="w-px h-5 self-center" style={{ background: 'var(--border)' }} />

          <span className="text-xs ml-1" style={{ color: 'var(--tx-3)' }}>Set priority:</span>
          {(['urgent', 'high', 'medium', 'low'] as TaskPriority[]).map(p => (
            <button
              key={p}
              type="button"
              onClick={() => handleBulkSetPriority(p)}
              className="text-xs px-2 py-1 rounded-md hover:bg-[var(--surface-2)] transition-colors"
              style={{ color: 'var(--tx-1)' }}
            >
              {PRIORITY_LABEL[p]}
            </button>
          ))}

          <div className="w-px h-5 self-center" style={{ background: 'var(--border)' }} />

          <button
            type="button"
            onClick={handleBulkArchive}
            className="text-xs px-2 py-1 rounded-md hover:bg-[var(--surface-2)] transition-colors ml-1"
            style={{ color: 'var(--tx-1)' }}
          >
            Archive
          </button>

          <button
            type="button"
            onClick={clearSelection}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-md hover:bg-[var(--surface-2)] transition-colors"
            style={{ color: 'var(--tx-3)' }}
          >
            <IconX size={10} aria-hidden />
            Clear selection
          </button>
        </div>
      )}
    </>
  )
}
