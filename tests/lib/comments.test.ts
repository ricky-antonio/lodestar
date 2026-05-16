import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockSupabase } from '@/tests/mocks/supabase'
import { getComments, addComment, deleteComment } from '@/lib/comments'
import '@/tests/mocks/supabase'

function makeRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'c-1',
    task_id: 't-1',
    user_id: 'u-1',
    body: 'Hello world',
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeProfile(overrides: Record<string, unknown> = {}) {
  return { id: 'u-1', display_name: 'Alice', avatar_url: null, ...overrides }
}

describe('getComments', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns comments joined with profile data', async () => {
    // Step 1: comments query (.order resolves)
    mockSupabase.order.mockResolvedValueOnce({ data: [makeRow()], error: null })
    // Step 2: profiles query (.in resolves)
    mockSupabase.in.mockResolvedValueOnce({ data: [makeProfile()], error: null })

    const result = await getComments('t-1')
    expect(result).toHaveLength(1)
    expect(result[0].body).toBe('Hello world')
    expect(result[0].profile.display_name).toBe('Alice')
    expect(result[0].profile.avatar_url).toBeNull()
    expect(mockSupabase.from).toHaveBeenCalledWith('task_comments')
    expect(mockSupabase.eq).toHaveBeenCalledWith('task_id', 't-1')
  })

  it('falls back to empty profile when user not in profiles result', async () => {
    mockSupabase.order.mockResolvedValueOnce({ data: [makeRow()], error: null })
    mockSupabase.in.mockResolvedValueOnce({ data: [], error: null })

    const result = await getComments('t-1')
    expect(result[0].profile).toEqual({ display_name: null, avatar_url: null })
  })

  it('returns empty array when no comments', async () => {
    mockSupabase.order.mockResolvedValueOnce({ data: [], error: null })

    const result = await getComments('t-1')
    expect(result).toEqual([])
  })

  it('throws on DB error', async () => {
    mockSupabase.order.mockResolvedValueOnce({ data: null, error: new Error('db fail') })
    await expect(getComments('t-1')).rejects.toThrow('db fail')
  })
})

describe('addComment', () => {
  beforeEach(() => vi.clearAllMocks())

  it('inserts and returns comment with profile', async () => {
    // Step 1: insert .single()
    mockSupabase.single.mockResolvedValueOnce({ data: makeRow(), error: null })
    // Step 2: profile .in()
    mockSupabase.in.mockResolvedValueOnce({ data: [makeProfile()], error: null })

    const result = await addComment('ws-1', 't-1', 'u-1', 'Hello world')
    expect(result.body).toBe('Hello world')
    expect(result.profile.display_name).toBe('Alice')
    expect(mockSupabase.insert).toHaveBeenCalledWith(
      expect.objectContaining({ workspace_id: 'ws-1', task_id: 't-1', user_id: 'u-1', body: 'Hello world' })
    )
  })

  it('throws on insert error', async () => {
    mockSupabase.single.mockResolvedValueOnce({ data: null, error: new Error('insert fail') })
    await expect(addComment('ws-1', 't-1', 'u-1', 'Hi')).rejects.toThrow('insert fail')
  })
})

describe('deleteComment', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls delete with correct id', async () => {
    mockSupabase.eq.mockResolvedValueOnce({ error: null })
    await expect(deleteComment('c-1')).resolves.toBeUndefined()
    expect(mockSupabase.from).toHaveBeenCalledWith('task_comments')
    expect(mockSupabase.delete).toHaveBeenCalled()
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'c-1')
  })

  it('throws on delete error', async () => {
    mockSupabase.eq.mockResolvedValueOnce({ error: new Error('del fail') })
    await expect(deleteComment('c-1')).rejects.toThrow('del fail')
  })
})
