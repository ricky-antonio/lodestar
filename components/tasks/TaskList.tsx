'use client'

import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TaskRow } from './TaskRow'
import { getFractionalPosition } from '@/lib/tasks'
import type { Task } from '@/lib/types'

interface SortableRowProps {
  task: Task
  onToggleDone: (id: string) => void
  onEdit: (id: string) => void
  onArchive: (id: string) => void
  onDelete: (id: string) => void
  onAddToMyDay?: (id: string) => void
  onRemoveFromMyDay?: (id: string) => void
}

function SortableRow({ task, onToggleDone, onEdit, onArchive, onDelete, onAddToMyDay, onRemoveFromMyDay }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform) ?? undefined,
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <TaskRow
        task={task}
        onToggleDone={onToggleDone}
        onEdit={onEdit}
        onArchive={onArchive}
        onDelete={onDelete}
        dragHandleProps={{ ...attributes, ...listeners }}
        onAddToMyDay={onAddToMyDay}
        onRemoveFromMyDay={onRemoveFromMyDay}
      />
    </div>
  )
}

interface Props {
  tasks: Task[]
  onToggleDone: (id: string) => void
  onEdit: (id: string) => void
  onArchive: (id: string) => void
  onDelete: (id: string) => void
  onReorder: (taskId: string, newPosition: number) => void
  emptyMessage?: string
  onAddToMyDay?: (id: string) => void
  onRemoveFromMyDay?: (id: string) => void
}

export function TaskList({
  tasks,
  onToggleDone,
  onEdit,
  onArchive,
  onDelete,
  onReorder,
  emptyMessage,
  onAddToMyDay,
  onRemoveFromMyDay,
}: Props) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 5,
  })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeIndex = tasks.findIndex(t => t.id === active.id)
    const overIndex = tasks.findIndex(t => t.id === over.id)
    if (activeIndex === -1 || overIndex === -1) return

    const reordered = arrayMove(tasks, activeIndex, overIndex)
    const before = reordered[overIndex - 1]?.position ?? null
    const after = reordered[overIndex + 1]?.position ?? null
    onReorder(active.id as string, getFractionalPosition(before, after))
  }

  if (tasks.length === 0) {
    return (
      <div
        className="flex items-center justify-center py-12 text-sm"
        style={{ color: 'var(--tx-3)' }}
      >
        {emptyMessage ?? 'No tasks'}
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div ref={parentRef} className="overflow-auto" style={{ height: '100%' }}>
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
            {virtualizer.getVirtualItems().map(virtualItem => {
              const task = tasks[virtualItem.index]
              return (
                <div
                  key={virtualItem.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    transform: `translateY(${virtualItem.start}px)`,
                    paddingBottom: 4,
                  }}
                >
                  <SortableRow
                    task={task}
                    onToggleDone={onToggleDone}
                    onEdit={onEdit}
                    onArchive={onArchive}
                    onDelete={onDelete}
                    onAddToMyDay={onAddToMyDay}
                    onRemoveFromMyDay={onRemoveFromMyDay}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </SortableContext>
    </DndContext>
  )
}
