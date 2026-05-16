import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskDetail } from '@/components/tasks/TaskDetail'
import type { Task, Project } from '@/lib/types'
import '@/tests/mocks/supabase'

// ── context mocks ──────────────────────────────────────────────────────────────

const mockCloseDetail = vi.fn()
const mockEditTask = vi.fn()
const mockArchiveTask = vi.fn()
const mockRemoveTask = vi.fn()
const mockAddTask = vi.fn()

let mockDetailTaskId: string | null = null
let mockIsCreating = false
let mockCreateDefaults: { project_id?: string | null; due_date?: string | null } | null = null
let mockTasks: Task[] = []

vi.mock('@/lib/context/UIContext', () => ({
  useUI: () => ({
    detailTaskId: mockDetailTaskId,
    isCreating: mockIsCreating,
    createDefaults: mockCreateDefaults,
    openCreate: vi.fn(),
    closeDetail: mockCloseDetail,
  }),
}))

vi.mock('@/lib/context/TasksContext', () => ({
  useTasks: () => ({
    tasks: mockTasks,
    editTask: mockEditTask,
    archiveTask: mockArchiveTask,
    removeTask: mockRemoveTask,
    addTask: mockAddTask,
  }),
}))

vi.mock('@/lib/context/ProjectsContext', () => ({
  useProjects: () => ({ projects: [] as Project[] }),
}))

vi.mock('@/lib/labels', () => ({
  getLabels: vi.fn().mockResolvedValue([]),
  getTaskLabels: vi.fn().mockResolvedValue([]),
  addLabelToTask: vi.fn().mockResolvedValue(undefined),
  removeLabelFromTask: vi.fn().mockResolvedValue(undefined),
  createLabel: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/dependencies', () => ({
  getDependencies: vi.fn().mockResolvedValue({ blockedBy: [], blocking: [] }),
  addDependency: vi.fn().mockResolvedValue(undefined),
  removeDependency: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/links', () => ({
  getLinkedTasks: vi.fn().mockResolvedValue([]),
  addLink: vi.fn().mockResolvedValue(undefined),
  removeLink: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/components/tasks/DueDatePicker', () => ({
  DueDatePicker: () => <div data-testid="due-date-picker" />,
}))

vi.mock('@/components/tasks/SnoozeMenu', () => ({
  SnoozeMenu: () => <div data-testid="snooze-menu" />,
}))

// ── fixtures ───────────────────────────────────────────────────────────────────

const baseTask: Task = {
  id: 'task-1',
  workspace_id: 'ws-1',
  project_id: null,
  parent_id: null,
  title: 'Design the onboarding flow',
  description: null,
  status: 'todo',
  priority: 'medium',
  assignee_id: null,
  due_date: null,
  estimated_mins: null,
  position: 1,
  is_archived: false,
  is_recurring: false,
  recurrence_rule: null,
  snoozed_until: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

// ── tests ──────────────────────────────────────────────────────────────────────

describe('TaskDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDetailTaskId = null
    mockIsCreating = false
    mockCreateDefaults = null
    mockTasks = []
  })

  it('returns null when detailTaskId is null', () => {
    const { container } = render(<TaskDetail />)
    expect(container.firstChild).toBeNull()
  })

  it('renders task title when detailTaskId matches a task', () => {
    mockDetailTaskId = 'task-1'
    mockTasks = [baseTask]
    render(<TaskDetail />)
    expect(screen.getByText('Design the onboarding flow')).toBeInTheDocument()
  })

  describe('close animation', () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => vi.useRealTimers())

    it('close button calls closeDetail after slide-out animation', () => {
      mockDetailTaskId = 'task-1'
      mockTasks = [baseTask]
      render(<TaskDetail />)
      // fireEvent is synchronous — safe to use with fake timers
      fireEvent.click(screen.getByRole('button', { name: 'Close detail panel' }))
      vi.runAllTimers()
      expect(mockCloseDetail).toHaveBeenCalledOnce()
    })
  })

  it('changing status dropdown calls editTask with new status', async () => {
    mockDetailTaskId = 'task-1'
    mockTasks = [baseTask]
    render(<TaskDetail />)
    const select = screen.getByRole('combobox', { name: 'Task status' })
    await userEvent.selectOptions(select, 'done')
    expect(mockEditTask).toHaveBeenCalledWith('task-1', { status: 'done' })
  })

  it('editing title and blurring calls editTask with new title', async () => {
    mockDetailTaskId = 'task-1'
    mockTasks = [baseTask]
    render(<TaskDetail />)

    // Click the title to enter edit mode
    fireEvent.click(screen.getByRole('heading', { name: /design the onboarding flow/i }))

    const input = screen.getByRole('textbox', { name: 'Edit task title' })
    await userEvent.clear(input)
    await userEvent.type(input, 'Updated title')
    fireEvent.blur(input)

    expect(mockEditTask).toHaveBeenCalledWith('task-1', { title: 'Updated title' })
  })

  it('archive button calls archiveTask', async () => {
    mockDetailTaskId = 'task-1'
    mockTasks = [baseTask]
    render(<TaskDetail />)
    await userEvent.click(screen.getByRole('button', { name: 'Archive task' }))
    expect(mockArchiveTask).toHaveBeenCalledWith('task-1')
  })

  it('delete button calls removeTask after confirmation', async () => {
    mockDetailTaskId = 'task-1'
    mockTasks = [baseTask]
    render(<TaskDetail />)

    // First click arms confirmation
    await userEvent.click(screen.getByRole('button', { name: 'Delete task' }))
    expect(mockRemoveTask).not.toHaveBeenCalled()

    // Second click (now labelled "Confirm delete") executes
    await userEvent.click(screen.getByRole('button', { name: 'Confirm delete' }))
    expect(mockRemoveTask).toHaveBeenCalledWith('task-1')
  })

  describe('create mode', () => {
    beforeEach(() => {
      mockDetailTaskId = '__create__'
      mockIsCreating = true
      mockCreateDefaults = { project_id: 'proj-1', due_date: '2026-05-15' }
    })

    it('shows create form with title input and Create task button', () => {
      render(<TaskDetail />)
      expect(screen.getByRole('textbox', { name: 'Task title' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Create task' })).toBeInTheDocument()
    })

    it('Create task button is disabled when title is empty', () => {
      render(<TaskDetail />)
      expect(screen.getByRole('button', { name: 'Create task' })).toBeDisabled()
    })

    it('typing a title enables the Create task button', async () => {
      render(<TaskDetail />)
      await userEvent.type(screen.getByRole('textbox', { name: 'Task title' }), 'My new task')
      expect(screen.getByRole('button', { name: 'Create task' })).not.toBeDisabled()
    })

    it('clicking Create task calls addTask with correct fields', async () => {
      mockAddTask.mockResolvedValueOnce(undefined)
      render(<TaskDetail />)
      await userEvent.type(screen.getByRole('textbox', { name: 'Task title' }), 'My new task')
      await userEvent.click(screen.getByRole('button', { name: 'Create task' }))
      expect(mockAddTask).toHaveBeenCalledWith(expect.objectContaining({
        title: 'My new task',
        project_id: 'proj-1',
        due_date: '2026-05-15',
      }))
    })
  })
})
