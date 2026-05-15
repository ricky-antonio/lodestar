import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskForm } from '@/components/tasks/TaskForm'
import type { Project } from '@/lib/types'
import '@/tests/mocks/supabase'

const mockUseProjects = vi.fn()

vi.mock('@/lib/context/ProjectsContext', () => ({
  useProjects: () => mockUseProjects(),
}))

const testProjects: Project[] = [
  {
    id: 'proj-1',
    workspace_id: 'ws-1',
    name: 'Project Alpha',
    description: null,
    color: '#00B6EC',
    status: 'active',
    default_view: 'list',
    created_at: '',
    updated_at: '',
  },
  {
    id: 'proj-2',
    workspace_id: 'ws-1',
    name: 'Project Beta',
    description: null,
    color: '#FA9836',
    status: 'active',
    default_view: 'board',
    created_at: '',
    updated_at: '',
  },
]

function defaultProjectsContext() {
  return {
    projects: testProjects,
    loading: false,
    activeProject: null,
    setActiveProject: vi.fn(),
    addProject: vi.fn(),
    editProject: vi.fn(),
    removeProject: vi.fn(),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUseProjects.mockReturnValue(defaultProjectsContext())
})

describe('TaskForm', () => {
  it('renders all fields when open', async () => {
    render(<TaskForm open={true} onClose={vi.fn()} onSubmit={vi.fn()} showProjectSelector={true} />)

    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())

    expect(screen.getByLabelText('Title')).toBeInTheDocument()
    expect(screen.getByLabelText('Description')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Urgent' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'High' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Medium' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Low' })).toBeInTheDocument()
    expect(screen.getByLabelText('Due date')).toBeInTheDocument()
    expect(screen.getByLabelText('Est. mins')).toBeInTheDocument()
    expect(screen.getByLabelText(/Project/)).toBeInTheDocument()
  })

  it('shows validation error and does not call onSubmit when title is empty', async () => {
    const onSubmit = vi.fn()
    render(<TaskForm open={true} onClose={vi.fn()} onSubmit={onSubmit} />)

    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'Create task' }))

    expect(screen.getByText('Title is required')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('calls onSubmit with correct values when all fields are filled', async () => {
    const onSubmit = vi.fn().mockResolvedValueOnce(undefined)
    const onClose = vi.fn()
    const user = userEvent.setup()

    render(<TaskForm open={true} onClose={onClose} onSubmit={onSubmit} showProjectSelector={true} />)

    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())

    await user.type(screen.getByLabelText('Title'), 'My new task')
    await user.type(screen.getByLabelText('Description'), 'Task description')
    await user.click(screen.getByRole('button', { name: 'High' }))
    fireEvent.change(screen.getByLabelText('Due date'), { target: { value: '2026-06-01' } })
    fireEvent.change(screen.getByLabelText('Est. mins'), { target: { value: '30' } })
    fireEvent.change(screen.getByLabelText(/Project/), { target: { value: 'proj-1' } })

    await user.click(screen.getByRole('button', { name: 'Create task' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        title: 'My new task',
        description: 'Task description',
        priority: 'high',
        due_date: '2026-06-01',
        project_id: 'proj-1',
        estimated_mins: 30,
      })
    })
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it('calls onClose when cancel is clicked', async () => {
    const onClose = vi.fn()
    render(<TaskForm open={true} onClose={onClose} onSubmit={vi.fn()} />)

    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onClose).toHaveBeenCalled()
  })

  it('pre-populates fields from initialValues in editing flow', async () => {
    render(
      <TaskForm
        open={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        initialValues={{
          id: 'task-1',
          title: 'Existing task',
          description: 'Existing description',
          priority: 'urgent',
          due_date: '2026-06-15',
          project_id: 'proj-2',
          estimated_mins: 60,
        }}
      />,
    )

    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())

    expect(screen.getByLabelText('Title')).toHaveValue('Existing task')
    expect(screen.getByLabelText('Description')).toHaveValue('Existing description')
    expect(screen.getByRole('button', { name: 'Urgent' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByLabelText('Due date')).toHaveValue('2026-06-15')
    expect(screen.getByLabelText('Est. mins')).toHaveValue(60)
    expect(screen.getByLabelText('Project')).toHaveValue('proj-2')
  })

  it('submit button is disabled while onSubmit is pending', async () => {
    const user = userEvent.setup()
    let resolveSubmit!: () => void
    const onSubmit = vi.fn().mockImplementationOnce(
      () => new Promise<void>(r => { resolveSubmit = r }),
    )

    render(<TaskForm open={true} onClose={vi.fn()} onSubmit={onSubmit} />)

    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())

    await user.type(screen.getByLabelText('Title'), 'Task title')
    await user.click(screen.getByRole('button', { name: 'Create task' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Create task' })).toBeDisabled()
    })
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()

    await act(async () => { resolveSubmit() })
  })
})
