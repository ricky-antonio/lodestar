import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockSupabase } from '../mocks/supabase'
import { getSubtasks, createSubtask, toggleSubtask } from '@/lib/subtasks'

describe('getSubtasks', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns subtasks for the given parent', async () => {
    const rows = [{ id: 's1', parent_id: 'p1', title: 'Sub 1', status: 'todo' }]
    mockSupabase.order.mockResolvedValueOnce({ data: rows, error: null })

    const result = await getSubtasks('p1')
    expect(result).toEqual(rows)
    expect(mockSupabase.eq).toHaveBeenCalledWith('parent_id', 'p1')
  })

  it('throws when supabase returns an error', async () => {
    mockSupabase.order.mockResolvedValueOnce({ data: null, error: new Error('db error') })
    await expect(getSubtasks('p1')).rejects.toThrow('db error')
  })
})

describe('createSubtask', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates a subtask with position max+1 and returns it', async () => {
    const existing = [{ position: 2.0 }]
    const created = { id: 's2', title: 'New sub', position: 3.0 }

    // First call: fetch existing positions
    mockSupabase.limit.mockResolvedValueOnce({ data: existing, error: null })
    // Second call: insert
    mockSupabase.single.mockResolvedValueOnce({ data: created, error: null })

    const result = await createSubtask('ws1', 'p1', 'New sub')
    expect(result).toEqual(created)
    expect(mockSupabase.insert).toHaveBeenCalledWith(
      expect.objectContaining({ workspace_id: 'ws1', parent_id: 'p1', title: 'New sub', position: 3.0 })
    )
  })

  it('throws when the position fetch fails', async () => {
    mockSupabase.limit.mockResolvedValueOnce({ data: null, error: new Error('fetch fail') })
    await expect(createSubtask('ws1', 'p1', 'title')).rejects.toThrow('fetch fail')
  })

  it('throws when the insert fails', async () => {
    mockSupabase.limit.mockResolvedValueOnce({ data: [], error: null })
    mockSupabase.single.mockResolvedValueOnce({ data: null, error: new Error('insert fail') })
    await expect(createSubtask('ws1', 'p1', 'title')).rejects.toThrow('insert fail')
  })
})

describe('toggleSubtask', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sets status to done when done=true', async () => {
    mockSupabase.eq.mockResolvedValueOnce({ error: null })
    await toggleSubtask('s1', true)
    expect(mockSupabase.update).toHaveBeenCalledWith({ status: 'done' })
  })

  it('sets status to todo when done=false', async () => {
    mockSupabase.eq.mockResolvedValueOnce({ error: null })
    await toggleSubtask('s1', false)
    expect(mockSupabase.update).toHaveBeenCalledWith({ status: 'todo' })
  })

  it('throws when supabase returns an error', async () => {
    mockSupabase.eq.mockResolvedValueOnce({ error: new Error('update fail') })
    await expect(toggleSubtask('s1', true)).rejects.toThrow('update fail')
  })
})
