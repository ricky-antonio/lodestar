import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ListView } from '@/components/views/ListView'
import type { Task } from '@/lib/types'
import '@/tests/mocks/supabase'

const mockEditTask = vi.hoisted(() => vi.fn())

vi.mock('@/lib/context/TasksContext', () => ({
  useTasks: () => ({ editTask: mockEditTask }),
}))

vi.mock('@/lib/context/ProjectsContext', () => ({
  useProjects: () => ({ projects: [] }),
}))

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({
    children,
    onClick,
  }: {
    children: React.ReactNode
    onClick?: () => void
  }) => <button onClick={onClick}>{children}</button>,
}))

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 't1',
    workspace_id: 'ws-1',
    project_id: null,
    parent_id: null,
    title: 'Task 1',
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

const onEdit = vi.fn()
const onArchive = vi.fn()
const onDelete = vi.fn()
const onToggleDone = vi.fn()
const onBulkArchive = vi.fn()
const onReorder = vi.fn()

function renderList(tasks: Task[]) {
  render(
    <ListView
      tasks={tasks}
      onEdit={onEdit}
      onArchive={onArchive}
      onDelete={onDelete}
      onToggleDone={onToggleDone}
      onBulkArchive={onBulkArchive}
      onReorder={onReorder}
    />,
  )
}

describe('ListView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all task titles as rows', () => {
    renderList([
      makeTask({ id: 't1', title: 'Task Alpha' }),
      makeTask({ id: 't2', title: 'Task Beta' }),
    ])
    expect(screen.getByText('Task Alpha')).toBeInTheDocument()
    expect(screen.getByText('Task Beta')).toBeInTheDocument()
  })

  it('clicking a column header sorts by that field', async () => {
    const user = userEvent.setup()
    // t1: urgent priority → sorts first by priority asc; title 'Zebra'
    // t2: low priority → sorts second; title 'Apple'
    renderList([
      makeTask({ id: 't1', title: 'Zebra', priority: 'urgent' }),
      makeTask({ id: 't2', title: 'Apple', priority: 'low' }),
    ])

    // Default sort: priority asc → Zebra first
    let rows = screen.getAllByRole('row').slice(1)
    expect(rows[0]).toHaveTextContent('Zebra')

    // Click "Title" header → sort by title asc → Apple first
    await user.click(screen.getByText('Title'))
    rows = screen.getAllByRole('row').slice(1)
    expect(rows[0]).toHaveTextContent('Apple')
  })

  it('clicking same header reverses sort direction', async () => {
    const user = userEvent.setup()
    renderList([
      makeTask({ id: 't1', title: 'Zebra', priority: 'urgent' }),
      makeTask({ id: 't2', title: 'Apple', priority: 'low' }),
    ])

    // First click: sort by title asc → Apple first
    await user.click(screen.getByText('Title'))
    let rows = screen.getAllByRole('row').slice(1)
    expect(rows[0]).toHaveTextContent('Apple')

    // Second click: sort by title desc → Zebra first
    await user.click(screen.getByText('Title'))
    rows = screen.getAllByRole('row').slice(1)
    expect(rows[0]).toHaveTextContent('Zebra')
  })

  it('inline status dropdown calls editTask on select', async () => {
    const user = userEvent.setup()
    renderList([makeTask({ id: 't1', status: 'todo' })])

    // Click the status button to enter edit mode
    await user.click(screen.getByRole('button', { name: 'To do' }))

    // Select a new status
    const select = screen.getByRole('combobox', { name: 'Status' })
    fireEvent.change(select, { target: { value: 'done' } })

    expect(mockEditTask).toHaveBeenCalledWith('t1', { status: 'done' })
  })

  it('row checkbox adds task to selection', async () => {
    const user = userEvent.setup()
    renderList([makeTask({ id: 't1', title: 'Task Alpha' })])

    expect(screen.queryByText(/Archive 1 tasks/)).not.toBeInTheDocument()

    await user.click(screen.getByRole('checkbox', { name: 'Select Task Alpha' }))

    expect(screen.getByText(/Archive 1 tasks/)).toBeInTheDocument()
  })

  it('select-all selects all rows', async () => {
    const user = userEvent.setup()
    renderList([
      makeTask({ id: 't1', title: 'Alpha' }),
      makeTask({ id: 't2', title: 'Beta' }),
    ])

    await user.click(screen.getByRole('checkbox', { name: 'Select all' }))

    expect(screen.getByText(/Archive 2 tasks/)).toBeInTheDocument()
  })

  it('bulk archive button calls onBulkArchive with all selected IDs', async () => {
    const user = userEvent.setup()
    renderList([
      makeTask({ id: 't1', title: 'Alpha' }),
      makeTask({ id: 't2', title: 'Beta' }),
    ])

    await user.click(screen.getByRole('checkbox', { name: 'Select all' }))
    await user.click(screen.getByRole('button', { name: /Archive 2 tasks/ }))

    expect(onBulkArchive).toHaveBeenCalledWith(['t1', 't2'])
  })
})
