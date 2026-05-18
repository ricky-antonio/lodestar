import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockSupabase } from '../mocks/supabase'

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => mockSupabase,
}))

const mockCheckRateLimit = vi.fn()
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
}))

const mockBreakdownTask = vi.fn()
vi.mock('@/lib/ai/tasks', () => ({
  breakdownTask: (...args: unknown[]) => mockBreakdownTask(...args),
}))

const TASK = { title: 'Fix the bug', description: null, workspace_id: 'ws-1' }
const MEMBERSHIP = { workspace_id: 'ws-1' }
const SUBTASKS = [
  { title: 'Reproduce the bug', estimated_mins: 15 },
  { title: 'Identify root cause', estimated_mins: 30 },
  { title: 'Write fix', estimated_mins: 45 },
]

describe('POST /api/ai/breakdown', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCheckRateLimit.mockResolvedValue({ limited: false, response: null })
  })

  async function POST(body?: unknown) {
    const { POST: handler } = await import('@/app/api/ai/breakdown/route')
    const request = new Request('http://localhost/api/ai/breakdown', {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      headers: { 'Content-Type': 'application/json' },
    })
    return handler(request)
  }

  it('returns 401 when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null })
    const res = await POST({ taskId: 'task-1' })
    expect(res.status).toBe(401)
  })

  it('returns 400 when taskId is missing', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } }, error: null })
    const res = await POST({})
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.message).toMatch(/taskId/)
  })

  it('returns 400 when taskId is an empty string', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } }, error: null })
    const res = await POST({ taskId: '   ' })
    expect(res.status).toBe(400)
  })

  it('returns 404 when task is not found', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } }, error: null })
    mockSupabase.single.mockResolvedValueOnce({ data: null, error: null })
    const res = await POST({ taskId: 'missing-task' })
    expect(res.status).toBe(404)
  })

  it('returns 404 when user is not a workspace member', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } }, error: null })
    mockSupabase.single
      .mockResolvedValueOnce({ data: TASK, error: null })
      .mockResolvedValueOnce({ data: null, error: null })
    const res = await POST({ taskId: 'task-1' })
    expect(res.status).toBe(404)
  })

  it('returns 200 with subtask array on success', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } }, error: null })
    mockSupabase.single
      .mockResolvedValueOnce({ data: TASK, error: null })
      .mockResolvedValueOnce({ data: MEMBERSHIP, error: null })
    mockBreakdownTask.mockResolvedValueOnce(SUBTASKS)

    const res = await POST({ taskId: 'task-1' })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.subtasks).toEqual(SUBTASKS)
  })

  it('returns 500 on AI failure', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } }, error: null })
    mockSupabase.single
      .mockResolvedValueOnce({ data: TASK, error: null })
      .mockResolvedValueOnce({ data: MEMBERSHIP, error: null })
    mockBreakdownTask.mockRejectedValueOnce(new Error('AI returned invalid subtask count'))

    const res = await POST({ taskId: 'task-1' })
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.message).toBe('AI returned invalid subtask count')
  })
})
