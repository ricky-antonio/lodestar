import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockSupabase } from '../mocks/supabase'
import {
  filterTasks,
  sortTasks,
  getFractionalPosition,
  getAllTasks,
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  archiveTask,
} from '@/lib/tasks'
import type { Task, TaskWithRelations, Label } from '@/lib/types'

beforeEach(() => vi.clearAllMocks())

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 't-1',
    workspace_id: 'ws-1',
    project_id: 'p-1',
    parent_id: null,
    title: 'Default task',
    description: null,
    status: 'todo',
    priority: 'medium',
    assignee_id: null,
    due_date: null,
    estimated_mins: null,
    position: 1.0,
    is_archived: false,
    is_recurring: false,
    recurrence_rule: null,
    snoozed_until: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

// ─── filterTasks ──────────────────────────────────────────────────────────────

describe('filterTasks', () => {
  it('returns all tasks when filters are empty', () => {
    const tasks = [makeTask({ id: 't-1' }), makeTask({ id: 't-2' })]
    expect(filterTasks(tasks, {})).toHaveLength(2)
  })

  it('filters by status', () => {
    const tasks = [
      makeTask({ status: 'todo' }),
      makeTask({ status: 'done' }),
    ]
    const result = filterTasks(tasks, { status: ['done'] })
    expect(result).toHaveLength(1)
    expect(result[0].status).toBe('done')
  })

  it('filters by priority', () => {
    const tasks = [
      makeTask({ priority: 'urgent' }),
      makeTask({ priority: 'low' }),
    ]
    expect(filterTasks(tasks, { priority: ['urgent'] })).toHaveLength(1)
  })

  it('filters by assignee_id', () => {
    const tasks = [
      makeTask({ assignee_id: 'user-1' }),
      makeTask({ assignee_id: null }),
      makeTask({ assignee_id: 'user-2' }),
    ]
    expect(filterTasks(tasks, { assignee_id: ['user-1'] })).toHaveLength(1)
  })

  it('filters by project_id', () => {
    const tasks = [
      makeTask({ project_id: 'p-1' }),
      makeTask({ project_id: 'p-2' }),
    ]
    expect(filterTasks(tasks, { project_id: 'p-1' })).toHaveLength(1)
  })

  it('filters to inbox (project_id null)', () => {
    const tasks = [
      makeTask({ project_id: null }),
      makeTask({ project_id: 'p-1' }),
    ]
    expect(filterTasks(tasks, { project_id: null })).toHaveLength(1)
  })

  it('filters by due_before', () => {
    const tasks = [
      makeTask({ due_date: '2024-01-01' }),
      makeTask({ due_date: '2024-12-31' }),
      makeTask({ due_date: null }),
    ]
    expect(filterTasks(tasks, { due_before: '2024-06-01' })).toHaveLength(1)
  })

  it('filters by due_after', () => {
    const tasks = [
      makeTask({ due_date: '2024-01-01' }),
      makeTask({ due_date: '2024-12-31' }),
      makeTask({ due_date: null }),
    ]
    expect(filterTasks(tasks, { due_after: '2024-06-01' })).toHaveLength(1)
  })

  it('filters by search (case-insensitive)', () => {
    const tasks = [
      makeTask({ title: 'Write tests' }),
      makeTask({ title: 'Deploy to prod' }),
    ]
    expect(filterTasks(tasks, { search: 'WRITE' })).toHaveLength(1)
  })

  it('applies multiple filters simultaneously', () => {
    const tasks = [
      makeTask({ status: 'todo', priority: 'urgent' }),
      makeTask({ status: 'done', priority: 'urgent' }),
      makeTask({ status: 'todo', priority: 'low' }),
    ]
    const result = filterTasks(tasks, { status: ['todo'], priority: ['urgent'] })
    expect(result).toHaveLength(1)
  })

  it('filters by label_ids when task has labels (TaskWithRelations)', () => {
    const label: Label = { id: 'lbl-1', workspace_id: 'ws-1', name: 'Bug', color: '#f00' }
    const taskWithLabel: TaskWithRelations = {
      ...makeTask({ id: 't-with-label' }),
      labels: [label],
      subtasks: [],
      comments: [],
      time_entries: [],
      linked_tasks: [],
      depends_on: [],
      dependents: [],
    }
    const taskNoLabel = makeTask({ id: 't-no-label' })
    const result = filterTasks([taskWithLabel, taskNoLabel], { label_ids: ['lbl-1'] })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('t-with-label')
  })
})

// ─── sortTasks ────────────────────────────────────────────────────────────────

describe('sortTasks', () => {
  it('sorts by due_date ascending (null dates last)', () => {
    const tasks = [
      makeTask({ due_date: '2024-12-31' }),
      makeTask({ due_date: null }),
      makeTask({ due_date: '2024-01-01' }),
    ]
    const result = sortTasks(tasks, 'due_date', 'asc')
    expect(result.map(t => t.due_date)).toEqual(['2024-01-01', '2024-12-31', null])
  })

  it('sorts by priority ascending (urgent first)', () => {
    const tasks = [
      makeTask({ priority: 'low' }),
      makeTask({ priority: 'urgent' }),
      makeTask({ priority: 'medium' }),
    ]
    const result = sortTasks(tasks, 'priority', 'asc')
    expect(result.map(t => t.priority)).toEqual(['urgent', 'medium', 'low'])
  })

  it('sorts by priority descending (low first)', () => {
    const tasks = [
      makeTask({ priority: 'urgent' }),
      makeTask({ priority: 'low' }),
    ]
    const result = sortTasks(tasks, 'priority', 'desc')
    expect(result[0].priority).toBe('low')
  })

  it('sorts by title alphabetically', () => {
    const tasks = [
      makeTask({ title: 'Zebra' }),
      makeTask({ title: 'Apple' }),
    ]
    expect(sortTasks(tasks, 'title', 'asc')[0].title).toBe('Apple')
  })

  it('sorts by position ascending', () => {
    const tasks = [
      makeTask({ position: 3.0 }),
      makeTask({ position: 1.0 }),
      makeTask({ position: 2.0 }),
    ]
    const result = sortTasks(tasks, 'position', 'asc')
    expect(result.map(t => t.position)).toEqual([1.0, 2.0, 3.0])
  })

  it('does not mutate the original array', () => {
    const tasks = [makeTask({ position: 2 }), makeTask({ position: 1 })]
    sortTasks(tasks, 'position', 'asc')
    expect(tasks[0].position).toBe(2)
  })
})

// ─── getFractionalPosition ────────────────────────────────────────────────────

describe('getFractionalPosition', () => {
  it('returns 1.0 for an empty list (both null)', () => {
    expect(getFractionalPosition(null, null)).toBe(1.0)
  })

  it('inserts at the start (before=null)', () => {
    expect(getFractionalPosition(null, 2.0)).toBe(1.0)
  })

  it('inserts at the end (after=null)', () => {
    expect(getFractionalPosition(5.0, null)).toBe(6.0)
  })

  it('inserts between two items', () => {
    expect(getFractionalPosition(1.0, 3.0)).toBe(2.0)
  })
})

// ─── Supabase helpers ─────────────────────────────────────────────────────────

describe('getAllTasks', () => {
  it('returns all workspace tasks without project filter', async () => {
    const tasks = [makeTask({ project_id: 'p-1' }), makeTask({ id: 't-2', project_id: null })]
    mockSupabase.order.mockResolvedValueOnce({ data: tasks, error: null })
    const result = await getAllTasks('ws-1')
    expect(result).toEqual(tasks)
    expect(mockSupabase.eq).toHaveBeenCalledWith('is_archived', false)
    expect(mockSupabase.is).not.toHaveBeenCalled()
  })

  it('returns empty array when data is null', async () => {
    mockSupabase.order.mockResolvedValueOnce({ data: null, error: null })
    expect(await getAllTasks('ws-1')).toEqual([])
  })

  it('throws on query error', async () => {
    mockSupabase.order.mockResolvedValueOnce({ data: null, error: new Error('DB error') })
    await expect(getAllTasks('ws-1')).rejects.toThrow('DB error')
  })
})

describe('getTasks', () => {
  it('returns tasks for a project', async () => {
    const tasks = [makeTask()]
    mockSupabase.order.mockResolvedValueOnce({ data: tasks, error: null })
    const result = await getTasks('ws-1', 'p-1')
    expect(result).toEqual(tasks)
    expect(mockSupabase.eq).toHaveBeenCalledWith('is_archived', false)
  })

  it('returns inbox tasks when projectId is null', async () => {
    const tasks = [makeTask({ project_id: null })]
    mockSupabase.order.mockResolvedValueOnce({ data: tasks, error: null })
    const result = await getTasks('ws-1', null)
    expect(result).toEqual(tasks)
    expect(mockSupabase.is).toHaveBeenCalledWith('project_id', null)
  })

  it('returns empty array when data is null', async () => {
    mockSupabase.order.mockResolvedValueOnce({ data: null, error: null })
    expect(await getTasks('ws-1', 'p-1')).toEqual([])
  })

  it('throws on query error', async () => {
    mockSupabase.order.mockResolvedValueOnce({ data: null, error: new Error('DB error') })
    await expect(getTasks('ws-1', 'p-1')).rejects.toThrow('DB error')
  })
})

describe('createTask', () => {
  it('returns the created task', async () => {
    const task = makeTask({ title: 'New task' })
    mockSupabase.single.mockResolvedValueOnce({ data: task, error: null })
    const result = await createTask('ws-1', { title: 'New task' })
    expect(result).toEqual(task)
  })

  it('throws on insert error', async () => {
    mockSupabase.single.mockResolvedValueOnce({ data: null, error: new Error('Insert failed') })
    await expect(createTask('ws-1', { title: 'x' })).rejects.toThrow('Insert failed')
  })
})

describe('updateTask', () => {
  it('returns the updated task', async () => {
    const task = makeTask({ title: 'Updated' })
    mockSupabase.single.mockResolvedValueOnce({ data: task, error: null })
    const result = await updateTask('t-1', { title: 'Updated' })
    expect(result).toEqual(task)
  })

  it('throws on update error', async () => {
    mockSupabase.single.mockResolvedValueOnce({ data: null, error: new Error('Update failed') })
    await expect(updateTask('t-1', { title: 'x' })).rejects.toThrow('Update failed')
  })
})

describe('deleteTask', () => {
  it('calls delete with the correct id', async () => {
    await deleteTask('t-1')
    expect(mockSupabase.delete).toHaveBeenCalled()
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', 't-1')
  })

  it('throws on delete error', async () => {
    mockSupabase.eq.mockResolvedValueOnce({ data: null, error: new Error('Delete failed') })
    await expect(deleteTask('t-1')).rejects.toThrow('Delete failed')
  })
})

describe('archiveTask', () => {
  it('calls update with is_archived true', async () => {
    await archiveTask('t-1')
    expect(mockSupabase.update).toHaveBeenCalledWith({ is_archived: true })
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', 't-1')
  })

  it('throws on update error', async () => {
    mockSupabase.eq.mockResolvedValueOnce({ data: null, error: new Error('Archive failed') })
    await expect(archiveTask('t-1')).rejects.toThrow('Archive failed')
  })
})
