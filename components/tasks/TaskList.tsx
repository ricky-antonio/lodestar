'use client'

import { useRef, useState, useEffect } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
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
  isDragActive: boolean
  onToggleDone: (id: string) => void
  onArchive: (id: string) => void
  onDelete: (id: string) => void
  onAddToMyDay?: (id: string) => void
  onRemoveFromMyDay?: (id: string) => void
}

function SortableRow({
  task,
  isDragActive,
  onToggleDone,
  onArchive,
  onDelete,
  onAddToMyDay,
  onRemoveFromMyDay,
}: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      style={{
        transform: CSS.Transform.toString(transform) ?? undefined,
        // suppress transition on drop so virtualizer position takes over without competing animation
        transition: isDragActive ? transition : undefined,
        opacity: isDragging ? 0 : 1,
      }}
    >
      <TaskRow
        task={task}
        onToggleDone={onToggleDone}
        onArchive={onArchive}
        onDelete={onDelete}
        dragHandleProps={listeners}
        onAddToMyDay={onAddToMyDay}
        onRemoveFromMyDay={onRemoveFromMyDay}
      />
    </div>
  )
}

interface Props {
  tasks: Task[]
  onToggleDone: (id: string) => void
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
  onArchive,
  onDelete,
  onReorder,
  emptyMessage,
  onAddToMyDay,
  onRemoveFromMyDay,
}: Props) {
  const parentRef = useRef<HTMLDivElement>(null)
  const [ordered, setOrdered] = useState(tasks)
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => { setOrdered(tasks) }, [tasks])

  const virtualizer = useVirtualizer({
    count: ordered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 5,
  })

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
  )

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeIndex = ordered.findIndex(t => t.id === active.id)
    const overIndex = ordered.findIndex(t => t.id === over.id)
    if (activeIndex === -1 || overIndex === -1) return

    const reordered = arrayMove(ordered, activeIndex, overIndex)
    setOrdered(reordered)
    const before = reordered[overIndex - 1]?.position ?? null
    const after = reordered[overIndex + 1]?.position ?? null
    onReorder(active.id as string, getFractionalPosition(before, after))
  }

  const activeTask = activeId ? ordered.find(t => t.id === activeId) : null

  if (ordered.length === 0) {
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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ordered.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div ref={parentRef} className="overflow-auto" style={{ height: '100%' }}>
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
            {virtualizer.getVirtualItems().map(virtualItem => {
              const task = ordered[virtualItem.index]
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
                    isDragActive={!!activeId}
                    onToggleDone={onToggleDone}
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

      <DragOverlay>
        {activeTask ? (
          <div style={{ opacity: 0.95, pointerEvents: 'none' }}>
            <TaskRow
              task={activeTask}
              onToggleDone={() => {}}
              onArchive={() => {}}
              onDelete={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
