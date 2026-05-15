import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskList } from '@/components/tasks/TaskList'
import type { Task } from '@/lib/types'
import '@/tests/mocks/supabase'

const dndCallbacks = vi.hoisted(() => ({
  onDragEnd: null as ((event: any) => void) | null,
}))

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children, onDragEnd, onDragStart }: any) => {
    dndCallbacks.onDragEnd = onDragEnd
    return children
  },
  DragOverlay: ({ children }: any) => children ?? null,
  MouseSensor: vi.fn(),
  TouchSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
  closestCenter: vi.fn(),
}))

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: any) => children,
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
  verticalListSortingStrategy: vi.fn(),
  arrayMove: (arr: any[], from: number, to: number) => {
    const result = [...arr]
    const [removed] = result.splice(from, 1)
    result.splice(to, 0, removed)
    return result
  },
}))

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: { toString: () => undefined },
  },
}))

vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count }: { count: number }) => ({
    getVirtualItems: () =>
      Array.from({ length: count }, (_, i) => ({
        index: i,
        key: i,
        start: i * 48,
        size: 48,
      })),
    getTotalSize: () => count * 48,
  }),
}))

vi.mock('@/lib/context/UIContext', () => ({
  useUI: () => ({ pushUndo: vi.fn() }),
}))

vi.mock('@/lib/context/TasksContext', () => ({
  useTasks: () => ({ editTask: vi.fn() }),
}))

function makeTask(n: number): Task {
  return {
    id: `task-${n}`,
    workspace_id: 'ws-1',
    project_id: 'proj-1',
    parent_id: null,
    title: `Task ${n}`,
    description: null,
    status: 'todo',
    priority: 'medium',
    assignee_id: null,
    due_date: null,
    estimated_mins: null,
    position: n,
    is_archived: false,
    is_recurring: false,
    recurrence_rule: null,
    snoozed_until: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }
}

describe('TaskList', () => {
  const onToggleDone = vi.fn()
  const onEdit = vi.fn()
  const onArchive = vi.fn()
  const onDelete = vi.fn()
  const onReorder = vi.fn()

  const defaultTasks = [makeTask(1), makeTask(2), makeTask(3)]

  beforeEach(() => {
    vi.clearAllMocks()
    dndCallbacks.onDragEnd = null
  })

  function renderList(tasks = defaultTasks) {
    render(
      <TaskList
        tasks={tasks}
        onToggleDone={onToggleDone}
        onEdit={onEdit}
        onArchive={onArchive}
        onDelete={onDelete}
        onReorder={onReorder}
      />,
    )
  }

  it('renders all task titles', () => {
    renderList()
    expect(screen.getByText('Task 1')).toBeInTheDocument()
    expect(screen.getByText('Task 2')).toBeInTheDocument()
    expect(screen.getByText('Task 3')).toBeInTheDocument()
  })

  it('shows custom empty message when tasks is empty', () => {
    render(
      <TaskList
        tasks={[]}
        onToggleDone={onToggleDone}
        onEdit={onEdit}
        onArchive={onArchive}
        onDelete={onDelete}
        onReorder={onReorder}
        emptyMessage="Nothing here yet"
      />,
    )
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument()
  })

  it('shows default empty message when tasks is empty', () => {
    renderList([])
    expect(screen.getByText('No tasks')).toBeInTheDocument()
  })

  it('calls onToggleDone when TaskRow checkbox is triggered', async () => {
    const user = userEvent.setup()
    renderList()
    const checkboxes = screen.getAllByRole('button', { name: 'Mark as done' })
    await user.click(checkboxes[0])
    expect(onToggleDone).toHaveBeenCalledWith('task-1')
  })

  it('calls onReorder with correct taskId and position after drag end', () => {
    renderList()
    // Drag task-1 (index 0, pos 1) over task-2 (index 1, pos 2)
    // arrayMove([t1,t2,t3], 0, 1) → [t2,t1,t3]
    // before = t2.position = 2, after = t3.position = 3
    // getFractionalPosition(2, 3) = 2.5
    dndCallbacks.onDragEnd!({ active: { id: 'task-1' }, over: { id: 'task-2' } })
    expect(onReorder).toHaveBeenCalledWith('task-1', 2.5)
  })
})
