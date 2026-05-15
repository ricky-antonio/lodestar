import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QuickCapture } from '@/components/ui/QuickCapture'
import { keyboard } from '@/lib/keyboard'

const mockAddTask = vi.fn()

vi.mock('@/lib/context/TasksContext', () => ({
  useTasks: () => ({ addTask: mockAddTask }),
}))

vi.mock('@/lib/context/ProjectsContext', () => ({
  useProjects: () => ({ activeProject: null, projects: [] }),
}))

describe('QuickCapture', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    keyboard.unmount()
  })

  it('modal is hidden initially', () => {
    render(<QuickCapture />)
    expect(screen.queryByPlaceholderText('Capture a task…')).not.toBeInTheDocument()
  })

  it('dispatching a q keydown event opens the modal', () => {
    render(<QuickCapture />)
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'q', bubbles: true }))
    })
    expect(screen.getByPlaceholderText('Capture a task…')).toBeInTheDocument()
  })

  it('typing a title and pressing Enter calls addTask and closes', async () => {
    const user = userEvent.setup()
    render(<QuickCapture />)

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'q', bubbles: true }))
    })

    const input = screen.getByPlaceholderText('Capture a task…')
    await user.type(input, 'New task')
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(mockAddTask).toHaveBeenCalledWith({ title: 'New task', project_id: null })
    expect(screen.queryByPlaceholderText('Capture a task…')).not.toBeInTheDocument()
  })

  it('pressing Escape closes without calling addTask', () => {
    render(<QuickCapture />)

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'q', bubbles: true }))
    })

    const input = screen.getByPlaceholderText('Capture a task…')
    fireEvent.keyDown(input, { key: 'Escape' })

    expect(mockAddTask).not.toHaveBeenCalled()
    expect(screen.queryByPlaceholderText('Capture a task…')).not.toBeInTheDocument()
  })
})
