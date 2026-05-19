import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockSupabase } from '../mocks/supabase'

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => mockSupabase,
}))

const mockCheckRateLimit = vi.fn()
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
}))

const mockContinueDescription = vi.fn()
vi.mock('@/lib/ai/tasks', () => ({
  continueDescription: (...args: unknown[]) => mockContinueDescription(...args),
}))

describe('POST /api/ai/continue-description', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCheckRateLimit.mockResolvedValue({ limited: false, response: null })
  })

  async function POST(body?: unknown) {
    const { POST: handler } = await import('@/app/api/ai/continue-description/route')
    const request = new Request('http://localhost/api/ai/continue-description', {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      headers: { 'Content-Type': 'application/json' },
    })
    return handler(request)
  }

  it('returns 401 when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null })
    const res = await POST({ title: 'Fix bug', currentText: 'Some context.' })
    expect(res.status).toBe(401)
  })

  it('returns 400 when title is missing', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } }, error: null })
    const res = await POST({ currentText: 'Some text.' })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.message).toMatch(/title/)
  })

  it('returns 400 when title is an empty string', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } }, error: null })
    const res = await POST({ title: '   ', currentText: 'Some text.' })
    expect(res.status).toBe(400)
  })

  it('returns 200 with continuation on valid input', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } }, error: null })
    mockContinueDescription.mockResolvedValueOnce('Run the migration scripts and verify rollback.')

    const res = await POST({ title: 'Deploy to production', currentText: 'Merge the branch first.' })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.continuation).toBe('Run the migration scripts and verify rollback.')
  })

  it('passes empty string for currentText when omitted', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } }, error: null })
    mockContinueDescription.mockResolvedValueOnce('Start by outlining the key deliverables.')

    const res = await POST({ title: 'Plan sprint' })
    expect(res.status).toBe(200)
    expect(mockContinueDescription).toHaveBeenCalledWith('Plan sprint', '')
  })

  it('returns 500 on AI failure', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } }, error: null })
    mockContinueDescription.mockRejectedValueOnce(new Error('Anthropic timeout'))

    const res = await POST({ title: 'Deploy to production', currentText: 'Merge first.' })
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.message).toBe('Anthropic timeout')
  })
})
