import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TasksPage from '@/app/(app)/tasks/page'
import '@/tests/mocks/supabase'
import type { Task, Project } from '@/lib/types'

const mockUseTasks = vi.fn()
const mockUseUI = vi.fn()
const mockUseProjects = vi.fn()

vi.mock('@/lib/context/TasksContext', () => ({
  useTasks: () => mockUseTasks(),
}))

vi.mock('@/lib/context/UIContext', () => ({
  useUI: () => mockUseUI(),
}))

vi.mock('@/lib/context/AuthContext', () => ({
  useAuth: () => ({ workspace: { id: 'ws-1' }, user: null, profile: null, loading: false }),
}))

vi.mock('@/lib/context/ProjectsContext', () => ({
  useProjects: () => mockUseProjects(),
}))

vi.mock('@/components/filters/FilterBar', () => ({
  FilterBar: () => null,
}))

vi.mock('@/components/views/BoardView', () => ({
  BoardView: ({ tasks }: { tasks: Task[] }) => (
    <div data-testid="board-view">
      {tasks.map(t => (
        <div key={t.id} data-testid="task-card">{t.title}</div>
      ))}
    </div>
  ),
}))

vi.mock('@/components/views/ListView', () => ({
  ListView: ({ tasks }: { tasks: Task[] }) => (
    <div data-testid="list-view">
      {tasks.map(t => (
        <div key={t.id} data-testid="task-row">{t.title}</div>
      ))}
    </div>
  ),
}))


const activeProject: Project = {
  id: 'proj-1',
  workspace_id: 'ws-1',
  name: 'Alpha',
  color: '#00B6EC',
  description: null,
  status: 'active',
  default_view: 'board',
  created_at: '',
  updated_at: '',
}

function makeTask(n: number, projectId: string | null = null, archived = false): Task {
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
    is_archived: archived,
    is_recurring: false,
    recurrence_rule: null,
    snoozed_until: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }
}

function defaultTasksContext() {
  return {
    tasks: [
      makeTask(1, 'proj-1'),
      makeTask(2, null),
      makeTask(3, 'proj-2'),
      makeTask(4, null, true), // archived — should not appear
    ],
    addTask: vi.fn(),
    editTask: vi.fn(),
    removeTask: vi.fn(),
    archiveTask: vi.fn(),
    filters: {},
    setFilters: vi.fn(),
    loading: false,
  }
}

function defaultUIContext() {
  return {
    detailTaskId: null,
    isCreating: false,
    createDefaults: null,
    openDetail: vi.fn(),
    openCreate: vi.fn(),
    closeDetail: vi.fn(),
    activeView: 'board' as const,
    setActiveView: vi.fn(),
    commandPaletteOpen: false,
    setCommandPaletteOpen: vi.fn(),
    undoStack: [],
    pushUndo: vi.fn(),
    dismissUndo: vi.fn(),
    sidebarCollapsed: false,
    setSidebarCollapsed: vi.fn(),
  }
}

describe('TasksPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseTasks.mockReturnValue(defaultTasksContext())
    mockUseUI.mockReturnValue(defaultUIContext())
    mockUseProjects.mockReturnValue({ activeProject: null, projects: [activeProject] })
  })

  it('renders Tasks heading', () => {
    render(<TasksPage />)
    expect(screen.getByRole('heading', { name: 'Tasks' })).toBeInTheDocument()
  })

  it('shows all non-archived tasks in board view', () => {
    render(<TasksPage />)
    const cards = screen.getAllByTestId('task-card')
    expect(cards).toHaveLength(3)
    expect(screen.getByText('Task 1')).toBeInTheDocument()
    expect(screen.getByText('Task 2')).toBeInTheDocument()
    expect(screen.getByText('Task 3')).toBeInTheDocument()
    expect(screen.queryByText('Task 4')).not.toBeInTheDocument()
  })

  it('"New task" button is disabled when no active project', () => {
    render(<TasksPage />)
    expect(screen.getByRole('button', { name: /new task/i })).toBeDisabled()
  })

  it('"New task" button is enabled when active project is set', () => {
    mockUseProjects.mockReturnValue({ activeProject, projects: [activeProject] })
    render(<TasksPage />)
    expect(screen.getByRole('button', { name: /new task/i })).not.toBeDisabled()
  })

  it('clicking "New task" calls openCreate when project is active', async () => {
    const user = userEvent.setup()
    const openCreate = vi.fn()
    mockUseProjects.mockReturnValue({ activeProject, projects: [activeProject] })
    mockUseUI.mockReturnValue({ ...defaultUIContext(), openCreate })
    render(<TasksPage />)
    await user.click(screen.getByRole('button', { name: /new task/i }))
    expect(openCreate).toHaveBeenCalledWith({ project_id: 'proj-1' })
  })
})
