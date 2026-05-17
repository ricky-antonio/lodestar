import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockCreate = vi.fn()

vi.mock('@/lib/ai/client', () => ({
  anthropic: { messages: { create: mockCreate } },
  AI_MODEL: 'claude-sonnet-4-6',
}))

describe('createTaskFromPrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function makeResponse(json: object) {
    return { content: [{ type: 'text', text: JSON.stringify(json) }] }
  }

  it('sends correct system prompt and user message to Anthropic', async () => {
    const preview = { title: 'Write report', priority: 'high', due_date: null, estimated_mins: null }
    mockCreate.mockResolvedValueOnce(makeResponse(preview))

    const { createTaskFromPrompt } = await import('@/lib/ai/tasks')
    await createTaskFromPrompt('Write the quarterly report')

    expect(mockCreate).toHaveBeenCalledOnce()
    const call = mockCreate.mock.calls[0][0]
    expect(call.model).toBe('claude-sonnet-4-6')
    expect(call.system).toContain('task extraction assistant')
    expect(call.messages[0]).toEqual({ role: 'user', content: 'Write the quarterly report' })
  })

  it('parses valid AI JSON response into AITaskPreview', async () => {
    const raw = {
      title: 'Fix login bug',
      description: 'Users cannot log in with Google',
      priority: 'urgent',
      due_date: '2024-06-01',
      estimated_mins: 30,
    }
    mockCreate.mockResolvedValueOnce(makeResponse(raw))

    const { createTaskFromPrompt } = await import('@/lib/ai/tasks')
    const result = await createTaskFromPrompt('Fix the login bug by June 1')

    expect(result).toEqual(raw)
  })

  it('retries once on JSON parse failure and succeeds on second attempt', async () => {
    const good = { title: 'Buy milk', priority: 'low', due_date: null, estimated_mins: null }
    mockCreate
      .mockResolvedValueOnce({ content: [{ type: 'text', text: 'not valid json {{' }] })
      .mockResolvedValueOnce(makeResponse(good))

    const { createTaskFromPrompt } = await import('@/lib/ai/tasks')
    const result = await createTaskFromPrompt('Buy milk')

    expect(mockCreate).toHaveBeenCalledTimes(2)
    expect(result.title).toBe('Buy milk')
  })

  it('throws after two consecutive JSON parse failures', async () => {
    mockCreate
      .mockResolvedValueOnce({ content: [{ type: 'text', text: 'bad json' }] })
      .mockResolvedValueOnce({ content: [{ type: 'text', text: 'also bad' }] })

    const { createTaskFromPrompt } = await import('@/lib/ai/tasks')
    await expect(createTaskFromPrompt('Something')).rejects.toThrow('AI returned invalid JSON')
    expect(mockCreate).toHaveBeenCalledTimes(2)
  })
})
