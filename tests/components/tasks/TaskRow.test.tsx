import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskRow } from '@/components/tasks/TaskRow'
import type { Task } from '@/lib/types'
import '@/tests/mocks/supabase'

const mockPushUndo = vi.fn()
const mockEditTask = vi.fn()

vi.mock('@/lib/context/UIContext', () => ({
  useUI: () => ({ pushUndo: mockPushUndo }),
}))

vi.mock('@/lib/context/TasksContext', () => ({
  useTasks: () => ({ editTask: mockEditTask }),
}))

const baseTask: Task = {
  id: 'task-1',
  workspace_id: 'ws-1',
  project_id: 'proj-1',
  parent_id: null,
  title: 'Test task title',
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

describe('TaskRow', () => {
  const onToggleDone = vi.fn()
  const onEdit = vi.fn()
  const onArchive = vi.fn()
  const onDelete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  function renderRow(overrides: Partial<Task> = {}) {
    return render(
      <TaskRow
        task={{ ...baseTask, ...overrides }}
        onToggleDone={onToggleDone}
        onEdit={onEdit}
        onArchive={onArchive}
        onDelete={onDelete}
      />,
    )
  }

  it('renders task title', () => {
    renderRow()
    expect(screen.getByText('Test task title')).toBeInTheDocument()
  })

  it('clicking checkbox calls onToggleDone with task id', async () => {
    const user = userEvent.setup()
    renderRow()
    await user.click(screen.getByRole('button', { name: 'Mark as done' }))
    expect(onToggleDone).toHaveBeenCalledWith('task-1')
  })

  it('done task shows strikethrough on title', () => {
    renderRow({ status: 'done' })
    const titleEl = screen.getByText('Test task title')
    expect(titleEl.style.textDecoration).toBe('line-through')
  })

  it('Edit option in dropdown calls onEdit with task id', async () => {
    const user = userEvent.setup()
    renderRow()
    await user.click(screen.getByRole('button', { name: 'Task actions' }))
    const editItem = await screen.findByRole('menuitem', { name: 'Edit' })
    await user.click(editItem)
    expect(onEdit).toHaveBeenCalledWith('task-1')
  })

  it('Archive option calls onArchive with task id', async () => {
    const user = userEvent.setup()
    renderRow()
    await user.click(screen.getByRole('button', { name: 'Task actions' }))
    const archiveItem = await screen.findByRole('menuitem', { name: 'Archive' })
    await user.click(archiveItem)
    expect(onArchive).toHaveBeenCalledWith('task-1')
  })

  it('Delete option calls onDelete with task id', async () => {
    const user = userEvent.setup()
    renderRow()
    await user.click(screen.getByRole('button', { name: 'Task actions' }))
    const deleteItem = await screen.findByRole('menuitem', { name: 'Delete' })
    await user.click(deleteItem)
    expect(onDelete).toHaveBeenCalledWith('task-1')
  })

  it('overdue task renders date in red', () => {
    renderRow({ due_date: '2020-01-01' })
    const dateEl = screen.getByTestId('task-due-date')
    expect(dateEl).toBeInTheDocument()
    expect(dateEl.style.color).toBe('rgb(239, 68, 68)')
  })

  it('drag handle has aria-label "Drag to reorder"', () => {
    renderRow()
    expect(screen.getByLabelText('Drag to reorder')).toBeInTheDocument()
  })

  it('Archive calls onArchive then pushUndo with correct label', async () => {
    const user = userEvent.setup()
    renderRow()
    await user.click(screen.getByRole('button', { name: 'Task actions' }))
    const archiveItem = await screen.findByRole('menuitem', { name: 'Archive' })
    await user.click(archiveItem)
    expect(onArchive).toHaveBeenCalledWith('task-1')
    expect(mockPushUndo).toHaveBeenCalledWith(expect.objectContaining({
      label: 'Archived "Test task title"',
    }))
  })

  it('Delete calls onDelete then pushUndo with canUndo false', async () => {
    const user = userEvent.setup()
    renderRow()
    await user.click(screen.getByRole('button', { name: 'Task actions' }))
    const deleteItem = await screen.findByRole('menuitem', { name: 'Delete' })
    await user.click(deleteItem)
    expect(onDelete).toHaveBeenCalledWith('task-1')
    expect(mockPushUndo).toHaveBeenCalledWith(expect.objectContaining({
      label: 'Deleted "Test task title"',
      canUndo: false,
    }))
  })
})
