import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockSupabase } from '../mocks/supabase'
import { getDependencies, addDependency, removeDependency } from '@/lib/dependencies'

const baseTask = {
  id: 't1', workspace_id: 'ws1', project_id: null, parent_id: null,
  title: 'Blocker task', description: null, status: 'todo' as const,
  priority: 'medium' as const, assignee_id: null, due_date: null,
  estimated_mins: null, position: 1, is_archived: false, is_recurring: false,
  recurrence_rule: null, snoozed_until: null,
  created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
}

describe('getDependencies', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns blockedBy and blocking task lists', async () => {
    // First .eq() → tasks this one depends on (blocked by)
    mockSupabase.eq.mockResolvedValueOnce({
      data: [{ depends_on_id: 't1', task: { ...baseTask, id: 't1', title: 'Blocker' } }],
      error: null,
    })
    // Second .eq() → tasks that depend on this one (blocking)
    mockSupabase.eq.mockResolvedValueOnce({
      data: [{ task_id: 't2', blocked: { ...baseTask, id: 't2', title: 'Blocked' } }],
      error: null,
    })

    const result = await getDependencies('current')
    expect(result.blockedBy).toHaveLength(1)
    expect(result.blockedBy[0].title).toBe('Blocker')
    expect(result.blocking).toHaveLength(1)
    expect(result.blocking[0].title).toBe('Blocked')
  })

  it('returns empty arrays when there are no dependencies', async () => {
    mockSupabase.eq.mockResolvedValueOnce({ data: [], error: null })
    mockSupabase.eq.mockResolvedValueOnce({ data: [], error: null })

    const result = await getDependencies('current')
    expect(result.blockedBy).toEqual([])
    expect(result.blocking).toEqual([])
  })

  it('throws when the first query fails', async () => {
    mockSupabase.eq.mockResolvedValueOnce({ data: null, error: new Error('db error') })

    await expect(getDependencies('current')).rejects.toThrow('db error')
  })

  it('throws when the second query fails', async () => {
    mockSupabase.eq.mockResolvedValueOnce({ data: [], error: null })
    mockSupabase.eq.mockResolvedValueOnce({ data: null, error: new Error('db error 2') })

    await expect(getDependencies('current')).rejects.toThrow('db error 2')
  })
})

describe('addDependency', () => {
  beforeEach(() => vi.clearAllMocks())

  it('inserts a dependency row', async () => {
    mockSupabase.insert.mockResolvedValueOnce({ error: null })

    await addDependency('ws1', 'task-a', 'task-b')
    expect(mockSupabase.insert).toHaveBeenCalledWith({ task_id: 'task-a', depends_on_id: 'task-b' })
  })

  it('throws when supabase returns an error', async () => {
    mockSupabase.insert.mockResolvedValueOnce({ error: new Error('insert fail') })

    await expect(addDependency('ws1', 'task-a', 'task-b')).rejects.toThrow('insert fail')
  })
})

describe('removeDependency', () => {
  beforeEach(() => vi.clearAllMocks())

  it('deletes the dependency row matching both ids', async () => {
    mockSupabase.eq
      .mockReturnValueOnce(mockSupabase)
      .mockResolvedValueOnce({ error: null })

    await removeDependency('task-a', 'task-b')
    expect(mockSupabase.delete).toHaveBeenCalled()
    expect(mockSupabase.eq).toHaveBeenCalledWith('task_id', 'task-a')
    expect(mockSupabase.eq).toHaveBeenCalledWith('depends_on_id', 'task-b')
  })

  it('throws when supabase returns an error', async () => {
    mockSupabase.eq
      .mockReturnValueOnce(mockSupabase)
      .mockResolvedValueOnce({ error: new Error('delete fail') })

    await expect(removeDependency('task-a', 'task-b')).rejects.toThrow('delete fail')
  })
})
