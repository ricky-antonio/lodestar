import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react'
import { TaskDependencies } from '@/components/tasks/TaskDependencies'
import type { Task } from '@/lib/types'
import '@/tests/mocks/supabase'

const mockGetDependencies = vi.fn()
const mockAddDependency = vi.fn()
const mockRemoveDependency = vi.fn()
const mockGetLinkedTasks = vi.fn()
const mockAddLink = vi.fn()
const mockRemoveLink = vi.fn()

vi.mock('@/lib/dependencies', () => ({
  getDependencies: (...args: unknown[]) => mockGetDependencies(...args),
  addDependency: (...args: unknown[]) => mockAddDependency(...args),
  removeDependency: (...args: unknown[]) => mockRemoveDependency(...args),
}))

vi.mock('@/lib/links', () => ({
  getLinkedTasks: (...args: unknown[]) => mockGetLinkedTasks(...args),
  addLink: (...args: unknown[]) => mockAddLink(...args),
  removeLink: (...args: unknown[]) => mockRemoveLink(...args),
}))

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 't1',
    workspace_id: 'ws-1',
    project_id: null,
    parent_id: null,
    title: 'Task One',
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

const currentTask = makeTask({ id: 'current', title: 'Current Task' })
const blockerTask = makeTask({ id: 'blocker', title: 'Blocking Task', status: 'in_progress' })
const otherTask = makeTask({ id: 'other', title: 'Other Task' })
const linkedTask = makeTask({ id: 'linked', title: 'Linked Task' })

const allTasks = [currentTask, blockerTask, otherTask, linkedTask]

describe('TaskDependencies', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetDependencies.mockResolvedValue({ blockedBy: [], blocking: [] })
    mockGetLinkedTasks.mockResolvedValue([])
    mockAddDependency.mockResolvedValue(undefined)
    mockRemoveDependency.mockResolvedValue(undefined)
    mockAddLink.mockResolvedValue(undefined)
    mockRemoveLink.mockResolvedValue(undefined)
  })

  it('renders blocked-by tasks with status badge after loading', async () => {
    mockGetDependencies.mockResolvedValueOnce({ blockedBy: [blockerTask], blocking: [] })

    render(<TaskDependencies taskId="current" allTasks={allTasks} />)

    const list = await screen.findByRole('list', { name: 'Blocked by' })
    expect(within(list).getByText('Blocking Task')).toBeInTheDocument()
    expect(within(list).getByText('In progress')).toBeInTheDocument()
  })

  it('remove blocked-by button calls removeDependency', async () => {
    mockGetDependencies.mockResolvedValueOnce({ blockedBy: [blockerTask], blocking: [] })

    render(<TaskDependencies taskId="current" allTasks={allTasks} />)
    await screen.findByRole('list', { name: 'Blocked by' })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Remove dependency on Blocking Task' }))
    })

    expect(mockRemoveDependency).toHaveBeenCalledWith('current', 'blocker')
  })

  it('selecting from the add-dependency picker calls addDependency', async () => {
    render(<TaskDependencies taskId="current" allTasks={allTasks} />)

    // Wait for the select to appear (available tasks exist)
    const depSelect = await screen.findByRole('combobox', { name: 'Add blocked-by dependency' })

    await act(async () => {
      fireEvent.change(depSelect, { target: { value: 'blocker' } })
    })

    expect(mockAddDependency).toHaveBeenCalledWith('ws-1', 'current', 'blocker')
  })

  it('renders related/linked tasks after loading', async () => {
    mockGetLinkedTasks.mockResolvedValueOnce([linkedTask])

    render(<TaskDependencies taskId="current" allTasks={allTasks} />)

    const list = await screen.findByRole('list', { name: 'Related tasks' })
    expect(within(list).getByText('Linked Task')).toBeInTheDocument()
  })

  it('remove link button calls removeLink', async () => {
    mockGetLinkedTasks.mockResolvedValueOnce([linkedTask])

    render(<TaskDependencies taskId="current" allTasks={allTasks} />)
    await screen.findByRole('list', { name: 'Related tasks' })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Remove link to Linked Task' }))
    })

    expect(mockRemoveLink).toHaveBeenCalledWith('current', 'linked')
  })

  it('reverts blocked-by removal when removeDependency fails', async () => {
    mockGetDependencies.mockResolvedValueOnce({ blockedBy: [blockerTask], blocking: [] })
    mockRemoveDependency.mockRejectedValueOnce(new Error('db error'))

    render(<TaskDependencies taskId="current" allTasks={allTasks} />)
    await screen.findByRole('list', { name: 'Blocked by' })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Remove dependency on Blocking Task' }))
    })

    // Task reappears after rollback
    await waitFor(() => {
      const list = screen.getByRole('list', { name: 'Blocked by' })
      expect(within(list).getByText('Blocking Task')).toBeInTheDocument()
    })
  })

  it('reverts adding a dependency when addDependency fails', async () => {
    mockAddDependency.mockRejectedValueOnce(new Error('db error'))

    render(<TaskDependencies taskId="current" allTasks={allTasks} />)
    const depSelect = await screen.findByRole('combobox', { name: 'Add blocked-by dependency' })

    await act(async () => {
      fireEvent.change(depSelect, { target: { value: 'blocker' } })
    })

    // Blocked-by list disappears again after rollback
    await waitFor(() => {
      expect(screen.queryByRole('list', { name: 'Blocked by' })).not.toBeInTheDocument()
    })
  })
})
