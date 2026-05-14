import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockSupabase } from '../mocks/supabase'
import { GET } from '@/app/(auth)/callback/route'

beforeEach(() => vi.clearAllMocks())

function makeRequest(search = '') {
  return new Request(`http://localhost:3000/callback${search}`)
}

describe('GET /callback', () => {
  it('redirects to /login when no code is present', async () => {
    const res = await GET(makeRequest())
    expect(res.headers.get('location')).toContain('/login')
  })

  it('redirects to /login when exchangeCodeForSession errors', async () => {
    mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
      data: { user: null },
      error: new Error('Invalid code'),
    })
    const res = await GET(makeRequest('?code=bad'))
    expect(res.headers.get('location')).toContain('/login')
  })

  it('redirects to /login when user is null after exchange', async () => {
    mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
      data: { user: null },
      error: null,
    })
    const res = await GET(makeRequest('?code=abc'))
    expect(res.headers.get('location')).toContain('/login')
  })

  it('creates workspace for new user and redirects to /dashboard', async () => {
    mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@example.com', user_metadata: {} } },
      error: null,
    })
    mockSupabase.maybeSingle.mockResolvedValue({ data: null, error: null })
    mockSupabase.single.mockResolvedValue({ data: { id: 'ws-1' }, error: null })

    const res = await GET(makeRequest('?code=abc'))
    expect(res.headers.get('location')).toContain('/dashboard')
  })

  it('skips workspace creation for existing user and redirects to /dashboard', async () => {
    mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@example.com', user_metadata: {} } },
      error: null,
    })
    mockSupabase.maybeSingle.mockResolvedValue({ data: { id: 'member-1' }, error: null })

    const res = await GET(makeRequest('?code=abc'))
    expect(res.headers.get('location')).toContain('/dashboard')
    expect(mockSupabase.insert).not.toHaveBeenCalled()
  })

  it('redirects to /login when workspace insert fails', async () => {
    mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@example.com', user_metadata: {} } },
      error: null,
    })
    mockSupabase.maybeSingle.mockResolvedValue({ data: null, error: null })
    mockSupabase.single.mockResolvedValue({ data: null, error: new Error('DB error') })

    const res = await GET(makeRequest('?code=abc'))
    expect(res.headers.get('location')).toContain('/login')
  })

  it('redirects to /reset-password when next=/reset-password', async () => {
    mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@example.com', user_metadata: {} } },
      error: null,
    })

    const res = await GET(makeRequest('?code=abc&next=/reset-password'))
    expect(res.headers.get('location')).toContain('/reset-password')
  })
})
