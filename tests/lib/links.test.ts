import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockSupabase } from '../mocks/supabase'
import { getLinkedTasks, addLink, removeLink } from '@/lib/links'

const baseTask = {
  id: 'l1', workspace_id: 'ws1', project_id: null, parent_id: null,
  title: 'Linked task', description: null, status: 'todo' as const,
  priority: 'medium' as const, assignee_id: null, due_date: null,
  estimated_mins: null, position: 1, is_archived: false, is_recurring: false,
  recurrence_rule: null, snoozed_until: null,
  created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
}

describe('getLinkedTasks', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns tasks linked from both directions, de-duplicated', async () => {
    const taskA = { ...baseTask, id: 'l-a', title: 'Task A' }
    const taskB = { ...baseTask, id: 'l-b', title: 'Task B' }

    // First .eq() — rows where current task is task_id
    mockSupabase.eq.mockResolvedValueOnce({
      data: [{ linked_task_id: 'l-a', task: taskA }],
      error: null,
    })
    // Second .eq() — rows where current task is linked_task_id
    mockSupabase.eq.mockResolvedValueOnce({
      data: [{ task_id: 'l-b', task: taskB }],
      error: null,
    })

    const result = await getLinkedTasks('current')
    expect(result).toHaveLength(2)
    expect(result.map(t => t.id)).toContain('l-a')
    expect(result.map(t => t.id)).toContain('l-b')
  })

  it('returns empty array when no links exist', async () => {
    mockSupabase.eq.mockResolvedValueOnce({ data: [], error: null })
    mockSupabase.eq.mockResolvedValueOnce({ data: [], error: null })

    const result = await getLinkedTasks('current')
    expect(result).toEqual([])
  })

  it('throws when the first query fails', async () => {
    mockSupabase.eq.mockResolvedValueOnce({ data: null, error: new Error('db error') })

    await expect(getLinkedTasks('current')).rejects.toThrow('db error')
  })

  it('throws when the second query fails', async () => {
    mockSupabase.eq.mockResolvedValueOnce({ data: [], error: null })
    mockSupabase.eq.mockResolvedValueOnce({ data: null, error: new Error('db error 2') })

    await expect(getLinkedTasks('current')).rejects.toThrow('db error 2')
  })
})

describe('addLink', () => {
  beforeEach(() => vi.clearAllMocks())

  it('inserts a task_links row', async () => {
    mockSupabase.insert.mockResolvedValueOnce({ error: null })

    await addLink('ws1', 'task-a', 'task-b')
    expect(mockSupabase.insert).toHaveBeenCalledWith({
      task_id: 'task-a',
      linked_task_id: 'task-b',
    })
  })

  it('throws when supabase returns an error', async () => {
    mockSupabase.insert.mockResolvedValueOnce({ error: new Error('insert fail') })

    await expect(addLink('ws1', 'task-a', 'task-b')).rejects.toThrow('insert fail')
  })
})

describe('removeLink', () => {
  beforeEach(() => vi.clearAllMocks())

  it('deletes the link row in either direction', async () => {
    mockSupabase.or.mockResolvedValueOnce({ error: null })

    await removeLink('task-a', 'task-b')
    expect(mockSupabase.delete).toHaveBeenCalled()
    expect(mockSupabase.or).toHaveBeenCalledWith(
      expect.stringContaining('task-a')
    )
  })

  it('throws when supabase returns an error', async () => {
    mockSupabase.or.mockResolvedValueOnce({ error: new Error('delete fail') })

    await expect(removeLink('task-a', 'task-b')).rejects.toThrow('delete fail')
  })
})
