import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockSupabase } from '../mocks/supabase'

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => mockSupabase,
}))

const mockCheckRateLimit = vi.fn()
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
}))

const mockCreateTaskFromPrompt = vi.fn()
vi.mock('@/lib/ai/tasks', () => ({
  createTaskFromPrompt: (...args: unknown[]) => mockCreateTaskFromPrompt(...args),
}))

describe('POST /api/ai/create-task', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCheckRateLimit.mockResolvedValue({ limited: false, response: null })
  })

  async function POST(body?: unknown) {
    const { POST: handler } = await import('@/app/api/ai/create-task/route')
    const request = new Request('http://localhost/api/ai/create-task', {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      headers: { 'Content-Type': 'application/json' },
    })
    return handler(request)
  }

  it('returns 401 when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null })
    const res = await POST({ prompt: 'Do something' })
    expect(res.status).toBe(401)
  })

  it('returns 429 when rate limited', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'user-1' } },
      error: null,
    })
    mockCheckRateLimit.mockResolvedValueOnce({
      limited: true,
      response: Response.json({ message: 'Too many requests' }, { status: 429 }),
    })
    const res = await POST({ prompt: 'Do something' })
    expect(res.status).toBe(429)
  })

  it('returns 400 when prompt is missing', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'user-1' } },
      error: null,
    })
    const res = await POST({})
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.message).toMatch(/non-empty string/)
  })

  it('returns 400 when prompt is an empty string', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'user-1' } },
      error: null,
    })
    const res = await POST({ prompt: '   ' })
    expect(res.status).toBe(400)
  })

  it('returns 200 with AITaskPreview on valid input', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'user-1' } },
      error: null,
    })
    const preview = { title: 'Fix bug', priority: 'high', due_date: null, estimated_mins: 60 }
    mockCreateTaskFromPrompt.mockResolvedValueOnce(preview)

    const res = await POST({ prompt: 'Fix the login bug today' })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual(preview)
  })

  it('returns 500 with message on AI failure', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'user-1' } },
      error: null,
    })
    mockCreateTaskFromPrompt.mockRejectedValueOnce(new Error('AI returned invalid JSON'))

    const res = await POST({ prompt: 'Do something' })
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.message).toBe('AI returned invalid JSON')
  })
})
