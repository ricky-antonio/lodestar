import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { SubtaskList } from '@/components/tasks/SubtaskList'
import type { Task } from '@/lib/types'
import '@/tests/mocks/supabase'

const mockGetSubtasks = vi.fn()
const mockCreateSubtask = vi.fn()
const mockToggleSubtask = vi.fn()

vi.mock('@/lib/subtasks', () => ({
  getSubtasks: (...args: unknown[]) => mockGetSubtasks(...args),
  createSubtask: (...args: unknown[]) => mockCreateSubtask(...args),
  toggleSubtask: (...args: unknown[]) => mockToggleSubtask(...args),
}))

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'sub-1',
    workspace_id: 'ws-1',
    project_id: null,
    parent_id: 'parent-1',
    title: 'Subtask A',
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
    ...overrides,
  }
}

const DEFAULT_PROPS = { parentId: 'parent-1', workspaceId: 'ws-1' }

describe('SubtaskList', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders subtask titles after loading', async () => {
    const subtasks = [
      makeTask({ id: 'sub-1', title: 'Subtask A' }),
      makeTask({ id: 'sub-2', title: 'Subtask B' }),
    ]
    mockGetSubtasks.mockResolvedValueOnce(subtasks)

    render(<SubtaskList {...DEFAULT_PROPS} />)
    await waitFor(() => expect(screen.getByText('Subtask A')).toBeInTheDocument())
    expect(screen.getByText('Subtask B')).toBeInTheDocument()
  })

  it('progress bar shows correct ratio', async () => {
    const subtasks = [
      makeTask({ id: 'sub-1', title: 'Sub A', status: 'done' }),
      makeTask({ id: 'sub-2', title: 'Sub B', status: 'done' }),
      makeTask({ id: 'sub-3', title: 'Sub C', status: 'todo' }),
    ]
    mockGetSubtasks.mockResolvedValueOnce(subtasks)

    render(<SubtaskList {...DEFAULT_PROPS} />)
    await waitFor(() => expect(screen.getByText('2 / 3 subtasks done')).toBeInTheDocument())

    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '2')
    expect(bar).toHaveAttribute('aria-valuemax', '3')
  })

  it('checking a checkbox calls toggleSubtask optimistically and reverts on DB failure', async () => {
    const subtask = makeTask({ id: 'sub-1', title: 'Sub A', status: 'todo' })
    mockGetSubtasks.mockResolvedValueOnce([subtask])
    mockToggleSubtask.mockRejectedValueOnce(new Error('db error'))

    render(<SubtaskList {...DEFAULT_PROPS} />)
    await waitFor(() => screen.getByText('Sub A'))

    const checkbox = screen.getByRole('button', { name: 'Mark complete' })
    await act(async () => { fireEvent.click(checkbox) })

    // Optimistic update applied
    expect(mockToggleSubtask).toHaveBeenCalledWith('sub-1', true)

    // After rejection, UI reverts
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Mark complete' })).toBeInTheDocument()
    )
  })

  it('Enter in add-subtask input calls createSubtask and clears the input', async () => {
    const created = makeTask({ id: 'sub-new', title: 'New Sub' })
    mockGetSubtasks.mockResolvedValueOnce([])
    mockCreateSubtask.mockResolvedValueOnce(created)

    render(<SubtaskList {...DEFAULT_PROPS} />)
    await waitFor(() => screen.getByText('+ Add subtask'))

    fireEvent.click(screen.getByText('+ Add subtask'))
    const input = await screen.findByRole('textbox', { name: 'New subtask title' })

    fireEvent.change(input, { target: { value: 'New Sub' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    await waitFor(() =>
      expect(mockCreateSubtask).toHaveBeenCalledWith('ws-1', 'parent-1', 'New Sub')
    )
    // Input should be hidden after submit
    await waitFor(() => expect(screen.queryByRole('textbox', { name: 'New subtask title' })).not.toBeInTheDocument())
  })
})
