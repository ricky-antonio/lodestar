import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AITaskBreakdown } from '@/components/ai/AITaskBreakdown'

const mockCreateSubtask = vi.fn()
vi.mock('@/lib/subtasks', () => ({
  createSubtask: (...args: unknown[]) => mockCreateSubtask(...args),
}))

const mockPushUndo = vi.fn()
vi.mock('@/lib/context/UIContext', () => ({
  useUI: () => ({ pushUndo: mockPushUndo }),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

const SUBTASKS = [
  { title: 'Reproduce the bug', estimated_mins: 15 },
  { title: 'Identify root cause', estimated_mins: null },
  { title: 'Write the fix', estimated_mins: 45 },
]

function makeSuccessResponse(subtasks = SUBTASKS) {
  return Promise.resolve({
    ok: true,
    json: async () => ({ subtasks }),
  })
}

describe('AITaskBreakdown', () => {
  const defaultProps = {
    taskId: 'task-1',
    workspaceId: 'ws-1',
    onDone: vi.fn(),
    onCancel: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state while fetching', () => {
    mockFetch.mockReturnValueOnce(new Promise(() => {}))
    render(<AITaskBreakdown {...defaultProps} />)
    expect(screen.getByText(/generating subtasks/i)).toBeInTheDocument()
  })

  it('renders suggested subtasks as checkboxes, all checked by default', async () => {
    mockFetch.mockReturnValueOnce(makeSuccessResponse())
    render(<AITaskBreakdown {...defaultProps} />)

    await waitFor(() => expect(screen.getByText('Reproduce the bug')).toBeInTheDocument())

    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes).toHaveLength(3)
    checkboxes.forEach(cb => expect(cb).toBeChecked())

    expect(screen.getByText('Identify root cause')).toBeInTheDocument()
    expect(screen.getByText('Write the fix')).toBeInTheDocument()
  })

  it('shows estimated_mins badge when present', async () => {
    mockFetch.mockReturnValueOnce(makeSuccessResponse())
    render(<AITaskBreakdown {...defaultProps} />)

    await waitFor(() => screen.getByText('15m'))
    expect(screen.getByText('45m')).toBeInTheDocument()
    // null estimated_mins should not produce a badge for "Identify root cause"
    expect(screen.queryByText('nullm')).not.toBeInTheDocument()
  })

  it('unchecking a subtask excludes it from confirmation payload', async () => {
    mockFetch.mockReturnValueOnce(makeSuccessResponse())
    mockCreateSubtask.mockResolvedValue({})

    render(<AITaskBreakdown {...defaultProps} />)
    await waitFor(() => screen.getByText('Reproduce the bug'))

    // Uncheck the first subtask
    fireEvent.click(screen.getAllByRole('checkbox')[0])

    fireEvent.click(screen.getByRole('button', { name: /add subtasks/i }))

    await waitFor(() => expect(defaultProps.onDone).toHaveBeenCalled())

    // createSubtask should NOT have been called with the unchecked title
    const calls = mockCreateSubtask.mock.calls.map((c: unknown[]) => c[2])
    expect(calls).not.toContain('Reproduce the bug')
    expect(calls).toContain('Identify root cause')
    expect(calls).toContain('Write the fix')
  })

  it('"Add subtasks" calls createSubtask for each checked item only', async () => {
    mockFetch.mockReturnValueOnce(makeSuccessResponse())
    mockCreateSubtask.mockResolvedValue({})

    render(<AITaskBreakdown {...defaultProps} />)
    await waitFor(() => screen.getByText('Reproduce the bug'))

    fireEvent.click(screen.getByRole('button', { name: /add subtasks/i }))

    await waitFor(() => expect(defaultProps.onDone).toHaveBeenCalled())
    expect(mockCreateSubtask).toHaveBeenCalledTimes(3)
    expect(mockCreateSubtask).toHaveBeenCalledWith('ws-1', 'task-1', 'Reproduce the bug')
    expect(mockCreateSubtask).toHaveBeenCalledWith('ws-1', 'task-1', 'Identify root cause')
    expect(mockCreateSubtask).toHaveBeenCalledWith('ws-1', 'task-1', 'Write the fix')
    expect(mockPushUndo).toHaveBeenCalledWith(
      expect.objectContaining({ label: expect.stringContaining('subtask') })
    )
  })

  it('"Cancel" dismisses without calling createSubtask', async () => {
    mockFetch.mockReturnValueOnce(makeSuccessResponse())
    render(<AITaskBreakdown {...defaultProps} />)

    await waitFor(() => screen.getByText('Reproduce the bug'))
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

    expect(defaultProps.onCancel).toHaveBeenCalled()
    expect(mockCreateSubtask).not.toHaveBeenCalled()
  })
})
