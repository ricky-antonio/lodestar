import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import InboxPage from '@/app/(app)/inbox/page'
import '@/tests/mocks/supabase'
import type { Task } from '@/lib/types'

const addTask = vi.fn()
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

vi.mock('@/components/tasks/TaskList', () => ({
  TaskList: ({ tasks }: { tasks: Task[] }) => (
    <div data-testid="task-list">
      {tasks.map(t => (
        <div key={t.id} data-testid="task-row">
          {t.title}
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

function makeTask(n: number, projectId: string | null = null): Task {
  return {
    id: `task-${n}`,
    workspace_id: 'ws-1',
    project_id: projectId,
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

describe('InboxPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockUseTasks.mockReturnValue({
      tasks: [makeTask(1, null), makeTask(2, 'proj-1')],
      addTask,
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

  it('renders Inbox heading', () => {
    render(<InboxPage />)
    expect(screen.getByRole('heading', { name: 'Inbox' })).toBeInTheDocument()
  })

  it('quick capture input is present', () => {
    render(<InboxPage />)
    expect(screen.getByPlaceholderText('Capture a task…')).toBeInTheDocument()
  })

  it('typing title + Enter calls addTask with correct title and project_id null', async () => {
    const user = userEvent.setup()
    addTask.mockResolvedValueOnce(undefined)
    render(<InboxPage />)
    const input = screen.getByPlaceholderText('Capture a task…')
    await user.type(input, 'My new task')
    await user.keyboard('{Enter}')
    await waitFor(() =>
      expect(addTask).toHaveBeenCalledWith({ title: 'My new task', project_id: null }),
    )
  })

  it('TaskList rendered with inbox tasks only', () => {
    render(<InboxPage />)
    expect(screen.getByTestId('task-list')).toBeInTheDocument()
    const rows = screen.getAllByTestId('task-row')
    expect(rows).toHaveLength(1)
    expect(rows[0]).toHaveTextContent('Task 1')
  })

  it('New task button opens TaskForm', async () => {
    const user = userEvent.setup()
    render(<InboxPage />)
    expect(screen.queryByTestId('task-form')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /new task/i }))
    expect(screen.getByTestId('task-form')).toBeInTheDocument()
  })
})
