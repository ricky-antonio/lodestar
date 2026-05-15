import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MyDayPage from '@/app/(app)/my-day/page'
import '@/tests/mocks/supabase'
import type { Task } from '@/lib/types'

const mockUseTasks = vi.fn()
const mockUseUI = vi.fn()

vi.mock('@/lib/context/TasksContext', () => ({
  useTasks: () => mockUseTasks(),
}))

vi.mock('@/lib/context/UIContext', () => ({
  useUI: () => mockUseUI(),
}))

vi.mock('@/lib/context/AuthContext', () => ({
  useAuth: () => ({ workspace: { id: 'ws-1' }, user: null, profile: null, loading: false }),
}))

vi.mock('@/components/filters/FilterBar', () => ({
  FilterBar: () => null,
}))

// Mock TaskList to expose onAddToMyDay / onRemoveFromMyDay for testing
vi.mock('@/components/tasks/TaskList', () => ({
  TaskList: ({
    tasks,
    onAddToMyDay,
    onRemoveFromMyDay,
  }: {
    tasks: Task[]
    onAddToMyDay?: (id: string) => void
    onRemoveFromMyDay?: (id: string) => void
  }) => (
    <div data-testid="task-list">
      {tasks.map(t => (
        <div key={t.id} data-testid="task-item" data-id={t.id}>
          {t.title}
          {onAddToMyDay && (
            <button
              data-testid={`add-my-day-${t.id}`}
              onClick={() => onAddToMyDay(t.id)}
            >
              Add to My Day
            </button>
          )}
          {onRemoveFromMyDay && (
            <button
              data-testid={`remove-my-day-${t.id}`}
              onClick={() => onRemoveFromMyDay(t.id)}
            >
              Remove from My Day
            </button>
          )}
        </div>
      ))}
    </div>
  ),
}))

vi.mock('@/components/views/ListView', () => ({
  ListView: () => null,
}))

vi.mock('@/components/tasks/TaskForm', () => ({
  TaskForm: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? (
      <div data-testid="task-form">
        <button onClick={onClose}>Close form</button>
      </div>
    ) : null,
}))

const TODAY = '2026-05-14'

function makeTask(n: number, overrides: Partial<Task> = {}): Task {
  return {
    id: `task-${n}`,
    workspace_id: 'ws-1',
    project_id: null,
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
    ...overrides,
  }
}

describe('MyDayPage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-14T10:00:00'))
    vi.clearAllMocks()

    mockUseTasks.mockReturnValue({
      tasks: [
        makeTask(1, { due_date: TODAY }),
        makeTask(2, { due_date: '2026-06-01' }),
      ],
      addTask: vi.fn(),
      editTask: vi.fn(),
      removeTask: vi.fn(),
      archiveTask: vi.fn(),
      filters: {},
      setFilters: vi.fn(),
      loading: false,
    })

    mockUseUI.mockReturnValue({
      detailTaskId: null,
      openDetail: vi.fn(),
      closeDetail: vi.fn(),
      activeView: 'list' as const,
      setActiveView: vi.fn(),
      commandPaletteOpen: false,
      setCommandPaletteOpen: vi.fn(),
      undoStack: [],
      pushUndo: vi.fn(),
      dismissUndo: vi.fn(),
      sidebarCollapsed: false,
      setSidebarCollapsed: vi.fn(),
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders "My Day" heading with today\'s date', () => {
    render(<MyDayPage />)
    expect(screen.getByRole('heading', { name: 'My Day' })).toBeInTheDocument()
    expect(screen.getByText(/may 14/i)).toBeInTheDocument()
  })

  it('tasks due today appear in "Due today" section', () => {
    render(<MyDayPage />)
    const section = screen.getByRole('region', { name: 'Due today' })
    expect(section).toBeInTheDocument()
    expect(section).toHaveTextContent('Task 1')
  })

  it('tasks not due today are absent by default', () => {
    render(<MyDayPage />)
    // Task 2 has due_date '2026-06-01' — should not appear anywhere
    const items = screen.queryAllByTestId('task-item')
    const titles = items.map(el => el.textContent ?? '')
    expect(titles.some(t => t.includes('Task 2'))).toBe(false)
  })

  it('"Add to My Day" in dropdown adds task to "Added to My Day" section', () => {
    render(<MyDayPage />)

    // Task 1 (due today) is shown in Due today section with "Add to My Day" button
    fireEvent.click(screen.getByTestId('add-my-day-task-1'))

    // After pinning, task appears in "Added to My Day" section
    expect(screen.getByRole('region', { name: 'Added to My Day' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Added to My Day' })).toHaveTextContent('Task 1')
  })

  it('"Remove from My Day" removes task from "Added to My Day" section', () => {
    render(<MyDayPage />)

    // First pin the task via "Add to My Day"
    fireEvent.click(screen.getByTestId('add-my-day-task-1'))
    expect(screen.getByRole('region', { name: 'Added to My Day' })).toBeInTheDocument()

    // Then remove it
    fireEvent.click(screen.getByTestId('remove-my-day-task-1'))
    expect(screen.queryByRole('region', { name: 'Added to My Day' })).not.toBeInTheDocument()
  })
})
