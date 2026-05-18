import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockCreate = vi.fn()

vi.mock('@/lib/ai/client', () => ({
  anthropic: { messages: { create: mockCreate } },
  AI_MODEL: 'claude-sonnet-4-6',
}))

function makeResponse(json: unknown) {
  return { content: [{ type: 'text', text: JSON.stringify(json) }] }
}

describe('createTaskFromPrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function makeTaskResult(tasks: object[]) {
    return makeResponse({ tasks })
  }

  it('sends correct system prompt and user message to Anthropic', async () => {
    mockCreate.mockResolvedValueOnce(makeTaskResult([
      { title: 'Write report', priority: 'high', due_date: null, estimated_mins: null, subtasks: [] },
    ]))

    const { createTaskFromPrompt } = await import('@/lib/ai/tasks')
    await createTaskFromPrompt('Write the quarterly report')

    expect(mockCreate).toHaveBeenCalledOnce()
    const call = mockCreate.mock.calls[0][0]
    expect(call.model).toBe('claude-sonnet-4-6')
    expect(call.system).toContain('task planning assistant')
    expect(call.system).toContain('GROUPING')
    expect(call.system).toContain('SPLITTING')
    expect(call.system).toContain('subtasks array')
    expect(call.system).toContain('always include')
    expect(call.messages[0]).toEqual({ role: 'user', content: 'Write the quarterly report' })
  })

  it('returns a single task result for a single-item prompt', async () => {
    const task = { title: 'Fix login bug', description: 'Google OAuth broken', priority: 'urgent', due_date: '2024-06-01', estimated_mins: 30, subtasks: [] }
    mockCreate.mockResolvedValueOnce(makeTaskResult([task]))

    const { createTaskFromPrompt } = await import('@/lib/ai/tasks')
    const result = await createTaskFromPrompt('Fix the login bug by June 1')

    expect(result.tasks).toHaveLength(1)
    expect(result.tasks[0]).toEqual(task)
  })

  it('returns grouped task with subtasks for related items', async () => {
    const task = {
      title: 'Downtown errands',
      description: null,
      priority: 'medium',
      due_date: null,
      estimated_mins: null,
      subtasks: ['Stop by Bucktown for coffee', 'Buy a Ventra pass'],
    }
    mockCreate.mockResolvedValueOnce(makeTaskResult([task]))

    const { createTaskFromPrompt } = await import('@/lib/ai/tasks')
    const result = await createTaskFromPrompt('Go downtown, get coffee in Bucktown, buy a Ventra pass')

    expect(result.tasks).toHaveLength(1)
    expect(result.tasks[0].subtasks).toEqual(['Stop by Bucktown for coffee', 'Buy a Ventra pass'])
  })

  it('returns multiple tasks for unrelated items', async () => {
    const tasks = [
      { title: 'Buy groceries', priority: 'medium', due_date: null, estimated_mins: null, subtasks: [] },
      { title: 'Fix production bug', priority: 'urgent', due_date: null, estimated_mins: null, subtasks: [] },
    ]
    mockCreate.mockResolvedValueOnce(makeTaskResult(tasks))

    const { createTaskFromPrompt } = await import('@/lib/ai/tasks')
    const result = await createTaskFromPrompt('Buy groceries and fix the production bug')

    expect(result.tasks).toHaveLength(2)
    expect(result.tasks[0].title).toBe('Buy groceries')
    expect(result.tasks[1].title).toBe('Fix production bug')
  })

  it('retries once on JSON parse failure and succeeds on second attempt', async () => {
    const good = { tasks: [{ title: 'Buy milk', priority: 'low', due_date: null, estimated_mins: null, subtasks: [] }] }
    mockCreate
      .mockResolvedValueOnce({ content: [{ type: 'text', text: 'not valid json {{' }] })
      .mockResolvedValueOnce(makeResponse(good))

    const { createTaskFromPrompt } = await import('@/lib/ai/tasks')
    const result = await createTaskFromPrompt('Buy milk')

    expect(mockCreate).toHaveBeenCalledTimes(2)
    expect(result.tasks[0].title).toBe('Buy milk')
  })

  it('throws after two consecutive JSON parse failures', async () => {
    mockCreate
      .mockResolvedValueOnce({ content: [{ type: 'text', text: 'bad json' }] })
      .mockResolvedValueOnce({ content: [{ type: 'text', text: 'also bad' }] })

    const { createTaskFromPrompt } = await import('@/lib/ai/tasks')
    await expect(createTaskFromPrompt('Something')).rejects.toThrow('AI returned invalid JSON')
    expect(mockCreate).toHaveBeenCalledTimes(2)
  })

  it('throws when AI returns an empty tasks array', async () => {
    mockCreate.mockResolvedValueOnce(makeResponse({ tasks: [] }))

    const { createTaskFromPrompt } = await import('@/lib/ai/tasks')
    await expect(createTaskFromPrompt('Something')).rejects.toThrow()
  })

  it('extracts a pure bullet-list description into subtasks when model ignores the subtasks rule', async () => {
    const badResponse = {
      tasks: [{
        title: 'Downtown day trip',
        description: '- Get coffee in Bucktown\n- Visit the Bean\n- Buy a Ventra pass',
        priority: 'medium',
        due_date: null,
        estimated_mins: null,
        subtasks: [],
      }],
    }
    mockCreate.mockResolvedValueOnce(makeResponse(badResponse))

    const { createTaskFromPrompt } = await import('@/lib/ai/tasks')
    const result = await createTaskFromPrompt('Go downtown, coffee, Bean, Ventra pass')

    expect(result.tasks[0].subtasks).toEqual([
      'Get coffee in Bucktown',
      'Visit the Bean',
      'Buy a Ventra pass',
    ])
    expect(result.tasks[0].description).toBeNull()
  })

  it('does not extract bullets when description mixes prose and bullets', async () => {
    const response = {
      tasks: [{
        title: 'Downtown day trip',
        description: 'A fun day out.\n- Get coffee\n- Visit the Bean',
        priority: 'medium',
        due_date: null,
        estimated_mins: null,
        subtasks: [],
      }],
    }
    mockCreate.mockResolvedValueOnce(makeResponse(response))

    const { createTaskFromPrompt } = await import('@/lib/ai/tasks')
    const result = await createTaskFromPrompt('Downtown trip')

    // prose line is present so extraction should not happen
    expect(result.tasks[0].subtasks).toEqual([])
    expect(result.tasks[0].description).toBe('A fun day out.\n- Get coffee\n- Visit the Bean')
  })

  it('preserves description alongside subtasks', async () => {
    const response = {
      tasks: [{
        title: 'Downtown day trip',
        description: 'A full day downtown covering coffee, sightseeing, and shopping.',
        priority: 'medium',
        due_date: null,
        estimated_mins: null,
        subtasks: ['Get coffee in Bucktown', 'Visit the Bean'],
      }],
    }
    mockCreate.mockResolvedValueOnce(makeResponse(response))

    const { createTaskFromPrompt } = await import('@/lib/ai/tasks')
    const result = await createTaskFromPrompt('Downtown trip')

    expect(result.tasks[0].subtasks).toEqual(['Get coffee in Bucktown', 'Visit the Bean'])
    expect(result.tasks[0].description).toBe(
      'A full day downtown covering coffee, sightseeing, and shopping.'
    )
  })

  it('defaults due_date to today when AI returns null', async () => {
    mockCreate.mockResolvedValueOnce(makeTaskResult([
      { title: 'Buy milk', priority: 'low', due_date: null, estimated_mins: null, subtasks: [] },
    ]))

    const { createTaskFromPrompt } = await import('@/lib/ai/tasks')
    const result = await createTaskFromPrompt('Buy milk')

    const today = new Date()
    const expected = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    expect(result.tasks[0].due_date).toBe(expected)
  })

  it('keeps an explicit due_date unchanged', async () => {
    mockCreate.mockResolvedValueOnce(makeTaskResult([
      { title: 'File taxes', priority: 'high', due_date: '2024-04-15', estimated_mins: null, subtasks: [] },
    ]))

    const { createTaskFromPrompt } = await import('@/lib/ai/tasks')
    const result = await createTaskFromPrompt('File taxes by April 15')

    expect(result.tasks[0].due_date).toBe('2024-04-15')
  })
})

describe('breakdownTask', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const subtasks = [
    { title: 'Research options', estimated_mins: 30 },
    { title: 'Write draft', estimated_mins: 60 },
    { title: 'Review and edit', estimated_mins: 20 },
  ]

  it('sends correct system prompt including task title and description', async () => {
    mockCreate.mockResolvedValueOnce(makeResponse(subtasks))

    const { breakdownTask } = await import('@/lib/ai/tasks')
    await breakdownTask({ title: 'Write report', description: 'Quarterly summary' })

    expect(mockCreate).toHaveBeenCalledOnce()
    const call = mockCreate.mock.calls[0][0]
    expect(call.system).toContain('task decomposition assistant')
    expect(call.messages[0].content).toContain('Write report')
    expect(call.messages[0].content).toContain('Quarterly summary')
  })

  it('sends title only when description is absent', async () => {
    mockCreate.mockResolvedValueOnce(makeResponse(subtasks))

    const { breakdownTask } = await import('@/lib/ai/tasks')
    await breakdownTask({ title: 'Deploy to production' })

    const call = mockCreate.mock.calls[0][0]
    expect(call.messages[0].content).toContain('Deploy to production')
    expect(call.messages[0].content).not.toContain('Description:')
  })

  it('returns array of AISubtaskSuggestion objects', async () => {
    mockCreate.mockResolvedValueOnce(makeResponse(subtasks))

    const { breakdownTask } = await import('@/lib/ai/tasks')
    const result = await breakdownTask({ title: 'Write report' })

    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({ title: 'Research options', estimated_mins: 30 })
  })

  it('throws when AI returns fewer than 3 subtasks', async () => {
    mockCreate.mockResolvedValueOnce(makeResponse([{ title: 'Only one', estimated_mins: null }]))

    const { breakdownTask } = await import('@/lib/ai/tasks')
    await expect(breakdownTask({ title: 'Task' })).rejects.toThrow('invalid subtask count')
  })

  it('throws when AI returns more than 6 subtasks', async () => {
    const tooMany = Array.from({ length: 7 }, (_, i) => ({ title: `Step ${i + 1}`, estimated_mins: null }))
    mockCreate.mockResolvedValueOnce(makeResponse(tooMany))

    const { breakdownTask } = await import('@/lib/ai/tasks')
    await expect(breakdownTask({ title: 'Task' })).rejects.toThrow('invalid subtask count')
  })
})
