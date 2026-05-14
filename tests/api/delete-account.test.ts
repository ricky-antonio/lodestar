import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockSupabase } from '../mocks/supabase'
import { POST } from '@/app/api/auth/delete-account/route'

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => mockSupabase,
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => mockSupabase,
}))

beforeEach(() => vi.clearAllMocks())

describe('POST /api/auth/delete-account', () => {
  it('returns 401 when no session', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null })
    const res = await POST()
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.message).toBe('Unauthorized')
  })

  it('calls admin.deleteUser with correct userId and returns 200', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'user-1' } },
      error: null,
    })
    mockSupabase.auth.admin.deleteUser.mockResolvedValueOnce({ data: {}, error: null })

    const res = await POST()
    expect(res.status).toBe(200)
    expect(mockSupabase.auth.admin.deleteUser).toHaveBeenCalledWith('user-1')
  })

  it('returns 500 when admin.deleteUser fails', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'user-1' } },
      error: null,
    })
    mockSupabase.auth.admin.deleteUser.mockResolvedValueOnce({
      data: null,
      error: new Error('Delete failed'),
    })

    const res = await POST()
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.message).toBe('Delete failed')
  })
})
