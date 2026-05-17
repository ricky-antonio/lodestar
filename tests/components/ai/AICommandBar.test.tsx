import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AICommandBar } from '@/components/ai/AICommandBar'

const mockAddTask = vi.fn()
vi.mock('@/lib/context/TasksContext', () => ({
  useTasks: () => ({ addTask: mockAddTask }),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

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

  it('calls the AI endpoint on submit and renders preview', async () => {
    const preview = {
      title: 'Fix login bug',
      priority: 'high',
      due_date: '2024-06-01',
      estimated_mins: 30,
    }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => preview,
    })

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

  it('"Create task" button calls addTask with correct values', async () => {
    const preview = { title: 'Buy milk', priority: 'low', due_date: null, estimated_mins: null }
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => preview })
    mockAddTask.mockResolvedValueOnce('task-new')

    render(<AICommandBar {...defaultProps} />)
    fireEvent.change(screen.getByPlaceholderText(/describe a task/i), {
      target: { value: 'Buy milk' },
    })
    fireEvent.click(screen.getByRole('button', { name: /generate/i }))

    await waitFor(() => screen.getByTestId('ai-preview-card'))
    fireEvent.click(screen.getByRole('button', { name: /create task/i }))

    await waitFor(() => {
      expect(mockAddTask).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Buy milk', priority: 'low', project_id: 'proj-1' })
      )
    })
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('"Cancel" dismisses preview without saving', async () => {
    const preview = { title: 'Some task', priority: 'medium', due_date: null, estimated_mins: null }
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => preview })

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
