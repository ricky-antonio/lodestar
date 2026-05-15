import { describe, it, expect, vi, beforeEach } from 'vitest'
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

let mockDetailTaskId: string | null = null
let mockTasks: Task[] = []

vi.mock('@/lib/context/UIContext', () => ({
  useUI: () => ({
    detailTaskId: mockDetailTaskId,
    closeDetail: mockCloseDetail,
  }),
}))

vi.mock('@/lib/context/TasksContext', () => ({
  useTasks: () => ({
    tasks: mockTasks,
    editTask: mockEditTask,
    archiveTask: mockArchiveTask,
    removeTask: mockRemoveTask,
  }),
}))

vi.mock('@/lib/context/ProjectsContext', () => ({
  useProjects: () => ({ projects: [] as Project[] }),
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

  it('close button calls closeDetail', async () => {
    mockDetailTaskId = 'task-1'
    mockTasks = [baseTask]
    render(<TaskDetail />)
    await userEvent.click(screen.getByRole('button', { name: 'Close detail panel' }))
    expect(mockCloseDetail).toHaveBeenCalledOnce()
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
})
