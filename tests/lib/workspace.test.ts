import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockSupabase } from '../mocks/supabase'
import { updateWorkspace } from '@/lib/workspace'

beforeEach(() => vi.clearAllMocks())

const mockWorkspace = {
  id: 'ws-1',
  name: 'My Workspace',
  slug: 'my-workspace',
  color: '#00B6EC',
  owner_id: 'user-1',
  timezone: 'America/New_York',
  end_of_day_time: '17:00',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

describe('updateWorkspace', () => {
  it('calls supabase update with correct args and returns updated row', async () => {
    mockSupabase.single.mockResolvedValueOnce({ data: mockWorkspace, error: null })

    const result = await updateWorkspace('ws-1', { name: 'New Name' })

    expect(mockSupabase.from).toHaveBeenCalledWith('workspaces')
    expect(mockSupabase.update).toHaveBeenCalledWith({ name: 'New Name' })
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'ws-1')
    expect(result).toEqual(mockWorkspace)
  })

  it('returns updated row with multiple fields', async () => {
    const updated = { ...mockWorkspace, color: '#005F7D', timezone: 'Europe/London' }
    mockSupabase.single.mockResolvedValueOnce({ data: updated, error: null })

    const result = await updateWorkspace('ws-1', { color: '#005F7D', timezone: 'Europe/London' })

    expect(mockSupabase.update).toHaveBeenCalledWith({ color: '#005F7D', timezone: 'Europe/London' })
    expect(result).toEqual(updated)
  })

  it('throws when supabase returns an error', async () => {
    mockSupabase.single.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } })

    await expect(updateWorkspace('ws-1', { name: 'New Name' })).rejects.toMatchObject({
      message: 'DB error',
    })
  })
})
