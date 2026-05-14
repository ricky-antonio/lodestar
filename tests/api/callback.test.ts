import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockSupabase } from '../mocks/supabase'
import { GET } from '@/app/(auth)/callback/route'

vi.mock('@/lib/supabase/route-handler', () => ({
  createRouteHandlerClient: () => mockSupabase,
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => mockSupabase,
}))

beforeEach(() => vi.clearAllMocks())

function makeRequest(search = '') {
  // Cast to unknown first since GET expects NextRequest but the mock never touches .cookies
  return new Request(`http://localhost:3000/callback${search}`) as unknown as Parameters<typeof GET>[0]
}

describe('GET /callback', () => {
  it('redirects to /login when no code is present', async () => {
    const res = await GET(makeRequest())
    expect(res.headers.get('location')).toContain('/login')
  })

  it('redirects to /login when exchangeCodeForSession errors', async () => {
    mockSupabase.auth.exchangeCodeForSession.mockResolvedValueOnce({
      data: { user: null },
      error: new Error('Invalid code'),
    })
    const res = await GET(makeRequest('?code=bad'))
    expect(res.headers.get('location')).toContain('/login')
  })

  it('redirects to /login when user is null after exchange', async () => {
    mockSupabase.auth.exchangeCodeForSession.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    })
    const res = await GET(makeRequest('?code=abc'))
    expect(res.headers.get('location')).toContain('/login')
  })

  it('creates workspace for new user and redirects to /dashboard', async () => {
    mockSupabase.auth.exchangeCodeForSession.mockResolvedValueOnce({
      data: { user: { id: 'user-1', email: 'test@example.com', user_metadata: {} } },
      error: null,
    })
    mockSupabase.maybeSingle.mockResolvedValueOnce({ data: null, error: null })
    mockSupabase.single.mockResolvedValueOnce({ data: { id: 'ws-1' }, error: null })

    const res = await GET(makeRequest('?code=abc'))
    expect(res.headers.get('location')).toContain('/dashboard')
  })

  it('skips workspace creation for existing user and redirects to /dashboard', async () => {
    mockSupabase.auth.exchangeCodeForSession.mockResolvedValueOnce({
      data: { user: { id: 'user-1', email: 'test@example.com', user_metadata: {} } },
      error: null,
    })
    mockSupabase.maybeSingle.mockResolvedValueOnce({ data: { id: 'member-1' }, error: null })

    const res = await GET(makeRequest('?code=abc'))
    expect(res.headers.get('location')).toContain('/dashboard')
    expect(mockSupabase.insert).not.toHaveBeenCalled()
  })

  it('redirects to /login when workspace insert fails', async () => {
    mockSupabase.auth.exchangeCodeForSession.mockResolvedValueOnce({
      data: { user: { id: 'user-1', email: 'test@example.com', user_metadata: {} } },
      error: null,
    })
    mockSupabase.maybeSingle.mockResolvedValueOnce({ data: null, error: null })
    mockSupabase.single.mockResolvedValueOnce({ data: null, error: new Error('DB error') })

    const res = await GET(makeRequest('?code=abc'))
    expect(res.headers.get('location')).toContain('/login')
  })

  it('redirects to /reset-password when next=/reset-password', async () => {
    mockSupabase.auth.exchangeCodeForSession.mockResolvedValueOnce({
      data: { user: { id: 'user-1', email: 'test@example.com', user_metadata: {} } },
      error: null,
    })

    const res = await GET(makeRequest('?code=abc&next=/reset-password'))
    expect(res.headers.get('location')).toContain('/reset-password')
  })
})
