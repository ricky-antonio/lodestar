import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockSupabase } from '@/tests/mocks/supabase'
import '@/tests/mocks/supabase'
import { getSavedFilters, createSavedFilter, deleteSavedFilter } from '@/lib/saved-filters'
import type { SavedFilter } from '@/lib/types'

const filter1: SavedFilter = {
  id: 'sf-1',
  workspace_id: 'ws-1',
  user_id: 'user-1',
  name: 'High priority',
  filters: { priority: ['urgent', 'high'] },
  created_at: '2026-01-01T00:00:00Z',
}

describe('getSavedFilters', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns saved filters for workspace and user', async () => {
    mockSupabase.order.mockResolvedValueOnce({ data: [filter1], error: null })
    const result = await getSavedFilters('ws-1', 'user-1')
    expect(result).toEqual([filter1])
    expect(mockSupabase.from).toHaveBeenCalledWith('saved_filters')
    expect(mockSupabase.eq).toHaveBeenCalledWith('workspace_id', 'ws-1')
    expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'user-1')
  })

  it('returns empty array when no saved filters exist', async () => {
    mockSupabase.order.mockResolvedValueOnce({ data: [], error: null })
    const result = await getSavedFilters('ws-1', 'user-1')
    expect(result).toEqual([])
  })

  it('throws on error', async () => {
    mockSupabase.order.mockResolvedValueOnce({ data: null, error: new Error('db error') })
    await expect(getSavedFilters('ws-1', 'user-1')).rejects.toThrow('db error')
  })
})

describe('createSavedFilter', () => {
  beforeEach(() => vi.clearAllMocks())

  it('inserts and returns the new saved filter', async () => {
    mockSupabase.single.mockResolvedValueOnce({ data: filter1, error: null })
    const result = await createSavedFilter('ws-1', 'user-1', 'High priority', { priority: ['urgent', 'high'] })
    expect(result).toEqual(filter1)
    expect(mockSupabase.from).toHaveBeenCalledWith('saved_filters')
    expect(mockSupabase.insert).toHaveBeenCalledWith({
      workspace_id: 'ws-1',
      user_id: 'user-1',
      name: 'High priority',
      filters: { priority: ['urgent', 'high'] },
    })
  })

  it('throws on insert error', async () => {
    mockSupabase.single.mockResolvedValueOnce({ data: null, error: new Error('insert failed') })
    await expect(createSavedFilter('ws-1', 'user-1', 'Test', {})).rejects.toThrow('insert failed')
  })
})

describe('deleteSavedFilter', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls delete with the correct id', async () => {
    mockSupabase.eq.mockResolvedValueOnce({ error: null })
    await deleteSavedFilter('sf-1')
    expect(mockSupabase.from).toHaveBeenCalledWith('saved_filters')
    expect(mockSupabase.delete).toHaveBeenCalled()
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'sf-1')
  })

  it('throws on delete error', async () => {
    mockSupabase.eq.mockResolvedValueOnce({ error: new Error('delete failed') })
    await expect(deleteSavedFilter('sf-1')).rejects.toThrow('delete failed')
  })
})
