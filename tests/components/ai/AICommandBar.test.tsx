import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AICommandBar } from '@/components/ai/AICommandBar'

const mockAddTask = vi.fn()
vi.mock('@/lib/context/TasksContext', () => ({
  useTasks: () => ({ addTask: mockAddTask }),
}))

const mockCreateSubtask = vi.fn()
vi.mock('@/lib/subtasks', () => ({
  createSubtask: (...args: unknown[]) => mockCreateSubtask(...args),
}))

const mockAddLink = vi.fn()
vi.mock('@/lib/links', () => ({
  addLink: (...args: unknown[]) => mockAddLink(...args),
}))

vi.mock('@/lib/context/AuthContext', () => ({
  useAuth: () => ({ workspace: { id: 'ws-1' } }),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

function makeResult(tasks: object[]) {
  return { ok: true, json: async () => ({ tasks }) }
}

describe('AICommandBar', () => {
  const defaultProps = {
    open: true,
    projectId: 'proj-1',
    onClose: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders textarea and generate button when open', () => {
    render(<AICommandBar {...defaultProps} />)
    expect(screen.getByPlaceholderText(/describe a task/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /generate/i })).toBeInTheDocument()
  })

  it('accepts text in the textarea', () => {
    render(<AICommandBar {...defaultProps} />)
    const textarea = screen.getByPlaceholderText(/describe a task/i)
    fireEvent.change(textarea, { target: { value: 'Fix the login bug today' } })
    expect((textarea as HTMLTextAreaElement).value).toBe('Fix the login bug today')
  })

  it('calls the AI endpoint on submit and renders a single-task preview', async () => {
    mockFetch.mockResolvedValueOnce(makeResult([
      { title: 'Fix login bug', priority: 'high', due_date: '2024-06-01', estimated_mins: 30, subtasks: [] },
    ]))

    render(<AICommandBar {...defaultProps} />)
    fireEvent.change(screen.getByPlaceholderText(/describe a task/i), {
      target: { value: 'Fix the login bug' },
    })
    fireEvent.click(screen.getByRole('button', { name: /generate/i }))

    await waitFor(() => expect(screen.getByTestId('ai-preview-card')).toBeInTheDocument())
    expect(screen.getByText('Fix login bug')).toBeInTheDocument()
    expect(screen.getByText('high')).toBeInTheDocument()
    expect(screen.getByText(/2024-06-01/)).toBeInTheDocument()
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/ai/create-task',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('renders grouped task with subtask list when AI groups related items', async () => {
    mockFetch.mockResolvedValueOnce(makeResult([
      {
        title: 'Downtown errands',
        priority: 'medium',
        due_date: null,
        estimated_mins: null,
        subtasks: ['Stop by Bucktown for coffee', 'Buy a Ventra pass'],
      },
    ]))

    render(<AICommandBar {...defaultProps} />)
    fireEvent.change(screen.getByPlaceholderText(/describe a task/i), {
      target: { value: 'Go downtown, coffee in Bucktown, buy a Ventra pass' },
    })
    fireEvent.click(screen.getByRole('button', { name: /generate/i }))

    await waitFor(() => screen.getByTestId('ai-preview-card'))
    expect(screen.getByText('Downtown errands')).toBeInTheDocument()
    expect(screen.getByText('Stop by Bucktown for coffee')).toBeInTheDocument()
    expect(screen.getByText('Buy a Ventra pass')).toBeInTheDocument()
  })

  it('renders multiple task cards when AI splits unrelated items', async () => {
    mockFetch.mockResolvedValueOnce(makeResult([
      { title: 'Buy groceries', priority: 'medium', due_date: null, estimated_mins: null, subtasks: [] },
      { title: 'Fix production bug', priority: 'urgent', due_date: null, estimated_mins: null, subtasks: [] },
    ]))

    render(<AICommandBar {...defaultProps} />)
    fireEvent.change(screen.getByPlaceholderText(/describe a task/i), {
      target: { value: 'Buy groceries and fix the production bug' },
    })
    fireEvent.click(screen.getByRole('button', { name: /generate/i }))

    await waitFor(() => screen.getByTestId('ai-preview-card'))
    expect(screen.getByText('Buy groceries')).toBeInTheDocument()
    expect(screen.getByText('Fix production bug')).toBeInTheDocument()
    expect(screen.getByText(/2 tasks · will be linked/i)).toBeInTheDocument()
  })

  it('"Create task" calls addTask and createSubtask for a grouped result', async () => {
    mockFetch.mockResolvedValueOnce(makeResult([
      {
        title: 'Downtown errands',
        priority: 'medium',
        due_date: null,
        estimated_mins: null,
        subtasks: ['Get coffee', 'Buy Ventra pass'],
      },
    ]))
    mockAddTask.mockResolvedValueOnce('task-new')
    mockCreateSubtask.mockResolvedValue({})

    render(<AICommandBar {...defaultProps} />)
    fireEvent.change(screen.getByPlaceholderText(/describe a task/i), {
      target: { value: 'Downtown errands' },
    })
    fireEvent.click(screen.getByRole('button', { name: /generate/i }))
    await waitFor(() => screen.getByTestId('ai-preview-card'))
    fireEvent.click(screen.getByRole('button', { name: /create task/i }))

    await waitFor(() => expect(defaultProps.onClose).toHaveBeenCalled())
    expect(mockAddTask).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Downtown errands', project_id: 'proj-1' })
    )
    expect(mockCreateSubtask).toHaveBeenCalledWith('ws-1', 'task-new', 'Get coffee')
    expect(mockCreateSubtask).toHaveBeenCalledWith('ws-1', 'task-new', 'Buy Ventra pass')
    expect(mockAddLink).not.toHaveBeenCalled()
  })

  it('"Create N tasks" calls addTask for each and addLink between them', async () => {
    mockFetch.mockResolvedValueOnce(makeResult([
      { title: 'Buy groceries', priority: 'medium', due_date: null, estimated_mins: null, subtasks: [] },
      { title: 'Fix bug', priority: 'urgent', due_date: null, estimated_mins: null, subtasks: [] },
    ]))
    mockAddTask
      .mockResolvedValueOnce('task-a')
      .mockResolvedValueOnce('task-b')
    mockAddLink.mockResolvedValue(undefined)

    render(<AICommandBar {...defaultProps} />)
    fireEvent.change(screen.getByPlaceholderText(/describe a task/i), {
      target: { value: 'Buy groceries and fix the bug' },
    })
    fireEvent.click(screen.getByRole('button', { name: /generate/i }))
    await waitFor(() => screen.getByTestId('ai-preview-card'))
    fireEvent.click(screen.getByRole('button', { name: /create 2 tasks/i }))

    await waitFor(() => expect(defaultProps.onClose).toHaveBeenCalled())
    expect(mockAddTask).toHaveBeenCalledTimes(2)
    expect(mockAddLink).toHaveBeenCalledWith('ws-1', 'task-a', 'task-b')
    expect(mockCreateSubtask).not.toHaveBeenCalled()
  })

  it('"Cancel" dismisses preview without saving', async () => {
    mockFetch.mockResolvedValueOnce(makeResult([
      { title: 'Some task', priority: 'medium', due_date: null, estimated_mins: null, subtasks: [] },
    ]))

    render(<AICommandBar {...defaultProps} />)
    fireEvent.change(screen.getByPlaceholderText(/describe a task/i), {
      target: { value: 'Some task' },
    })
    fireEvent.click(screen.getByRole('button', { name: /generate/i }))
    await waitFor(() => screen.getByTestId('ai-preview-card'))
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

    expect(screen.queryByTestId('ai-preview-card')).not.toBeInTheDocument()
    expect(mockAddTask).not.toHaveBeenCalled()
  })

  it('shows an error message on API failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'AI returned invalid JSON' }),
    })

    render(<AICommandBar {...defaultProps} />)
    fireEvent.change(screen.getByPlaceholderText(/describe a task/i), {
      target: { value: 'Do something' },
    })
    fireEvent.click(screen.getByRole('button', { name: /generate/i }))

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(screen.getByRole('alert')).toHaveTextContent('AI returned invalid JSON')
    expect(screen.queryByTestId('ai-preview-card')).not.toBeInTheDocument()
  })
})
