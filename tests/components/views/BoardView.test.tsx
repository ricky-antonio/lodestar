import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BoardView } from '@/components/views/BoardView'
import type { Task, TaskStatus } from '@/lib/types'
import '@/tests/mocks/supabase'

const mockOpenDetail = vi.fn()
vi.mock('@/lib/context/UIContext', () => ({
  useUI: () => ({ openDetail: mockOpenDetail }),
}))

// ─── dnd-kit mocks ────────────────────────────────────────────────────────────

const dndCallbacks = vi.hoisted(() => ({
  onDragStart: null as ((event: unknown) => void) | null,
  onDragEnd: null as ((event: unknown) => void) | null,
  onDragOver: null as ((event: unknown) => void) | null,
}))

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children, onDragStart, onDragEnd, onDragOver }: {
    children: React.ReactNode
    onDragStart: (e: unknown) => void
    onDragEnd: (e: unknown) => void
    onDragOver: (e: unknown) => void
  }) => {
    dndCallbacks.onDragStart = onDragStart
    dndCallbacks.onDragEnd = onDragEnd
    dndCallbacks.onDragOver = onDragOver
    return children
  },
  DragOverlay: ({ children }: { children: React.ReactNode }) => children ?? null,
  MouseSensor: vi.fn(),
  TouchSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
  closestCorners: vi.fn(),
  useDroppable: () => ({ setNodeRef: vi.fn(), isOver: false }),
}))

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => children,
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
  verticalListSortingStrategy: vi.fn(),
  arrayMove: (arr: unknown[], from: number, to: number) => {
    const result = [...arr]
    const [removed] = result.splice(from, 1)
    result.splice(to, 0, removed)
    return result
  },
}))

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => undefined } },
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeTask(id: string, status: TaskStatus, position: number, overrides?: Partial<Task>): Task {
  return {
    id,
    workspace_id: 'ws-1',
    project_id: 'proj-1',
    parent_id: null,
    title: `Task ${id}`,
    description: null,
    status,
    priority: 'medium',
    assignee_id: null,
    due_date: null,
    estimated_mins: null,
    position,
    is_archived: false,
    is_recurring: false,
    recurrence_rule: null,
    snoozed_until: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('BoardView', () => {
  const onMoveTask = vi.fn()
  const onArchive = vi.fn()
  const onDelete = vi.fn()
  const onAddTask = vi.fn()

  // Two todo tasks, one in_progress, one done
  const tasks = [
    makeTask('t1', 'todo', 1),
    makeTask('t2', 'todo', 2),
    makeTask('t3', 'in_progress', 3),
    makeTask('t4', 'done', 4),
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    dndCallbacks.onDragStart = null
    dndCallbacks.onDragEnd = null
    dndCallbacks.onDragOver = null
  })

  function renderBoard(customTasks = tasks) {
    render(
      <BoardView
        tasks={customTasks}
        onMoveTask={onMoveTask}
        onArchive={onArchive}
        onDelete={onDelete}
        onAddTask={onAddTask}
      />,
    )
  }

  it('renders three columns with correct status labels', () => {
    renderBoard()
    expect(screen.getByText('To do')).toBeInTheDocument()
    expect(screen.getByText('In progress')).toBeInTheDocument()
    expect(screen.getByText('Done')).toBeInTheDocument()
  })

  it('tasks appear in the correct column', () => {
    renderBoard()
    expect(screen.getByText('Task t1')).toBeInTheDocument()
    expect(screen.getByText('Task t2')).toBeInTheDocument()
    expect(screen.getByText('Task t3')).toBeInTheDocument()
    expect(screen.getByText('Task t4')).toBeInTheDocument()
  })

  it('column header shows correct count', () => {
    renderBoard()
    expect(screen.getByTestId('todo-count')).toHaveTextContent('2')
    expect(screen.getByTestId('in_progress-count')).toHaveTextContent('1')
    expect(screen.getByTestId('done-count')).toHaveTextContent('1')
  })

  it('archived tasks are excluded from columns', () => {
    renderBoard([
      makeTask('t1', 'todo', 1),
      makeTask('t2', 'todo', 2, { is_archived: true }),
    ])
    expect(screen.getByTestId('todo-count')).toHaveTextContent('1')
    expect(screen.queryByText('Task t2')).not.toBeInTheDocument()
  })

  it('each column renders an Add task button', () => {
    renderBoard()
    const addButtons = screen.getAllByText('Add task')
    expect(addButtons).toHaveLength(3)
  })

  it('onAddTask called with correct status when button clicked', async () => {
    const user = userEvent.setup()
    renderBoard()
    const addButtons = screen.getAllByText('Add task')
    // Columns rendered in order: todo, in_progress, done
    await user.click(addButtons[0])
    expect(onAddTask).toHaveBeenCalledWith('todo')
    await user.click(addButtons[1])
    expect(onAddTask).toHaveBeenCalledWith('in_progress')
    await user.click(addButtons[2])
    expect(onAddTask).toHaveBeenCalledWith('done')
  })

  it('onDragEnd triggers onMoveTask for cross-column drag', async () => {
    renderBoard()

    // Start drag — sets dragStartState snapshot
    act(() => {
      dndCallbacks.onDragStart!({ active: { id: 't1' } })
    })

    // Move t1 (todo) to in_progress column
    act(() => {
      dndCallbacks.onDragOver!({
        active: { id: 't1' },
        over: { id: 'in_progress' },
      })
    })

    // End drag — t1 is now in in_progress
    await act(async () => {
      dndCallbacks.onDragEnd!({
        active: { id: 't1' },
        over: { id: 'in_progress' },
      })
    })

    expect(onMoveTask).toHaveBeenCalledWith('t1', 'in_progress', expect.any(Number))
  })

  it('onDragEnd triggers onMoveTask for within-column reorder', async () => {
    // t1 (todo, pos 1), t2 (todo, pos 2)
    renderBoard([makeTask('t1', 'todo', 1), makeTask('t2', 'todo', 2)])

    // Start drag
    act(() => {
      dndCallbacks.onDragStart!({ active: { id: 't1' } })
    })

    // Drop t1 onto t2 (within same column)
    await act(async () => {
      dndCallbacks.onDragEnd!({
        active: { id: 't1' },
        over: { id: 't2' },
      })
    })

    // arrayMove([t1, t2], 0, 1) → [t2, t1]
    // finalIdx = 1, before = t2.position = 2, after = null → getFractionalPosition(2, null) = 3.0
    expect(onMoveTask).toHaveBeenCalledWith('t1', 'todo', 3)
  })

  it('does not call onMoveTask when drag is cancelled (no over)', async () => {
    renderBoard()

    // Start drag
    act(() => {
      dndCallbacks.onDragStart!({ active: { id: 't1' } })
    })

    await act(async () => {
      dndCallbacks.onDragEnd!({
        active: { id: 't1' },
        over: null,
      })
    })

    expect(onMoveTask).not.toHaveBeenCalled()
  })
})
