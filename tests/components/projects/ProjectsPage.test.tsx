import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProjectsPage from '@/app/(app)/projects/page'
import type { Project } from '@/lib/types'

const mockAddProject = vi.fn()
const mockUseProjects = vi.fn()

vi.mock('@/lib/context/ProjectsContext', () => ({
  useProjects: () => mockUseProjects(),
}))

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'p-1', workspace_id: 'ws-1', name: 'Alpha', description: null,
    color: '#00B6EC', status: 'active', default_view: 'list',
    created_at: '', updated_at: '',
    ...overrides,
  }
}

function defaultContext(overrides: object = {}) {
  return {
    projects: [],
    loading: false,
    addProject: mockAddProject,
    activeProject: null,
    setActiveProject: vi.fn(),
    editProject: vi.fn(),
    removeProject: vi.fn(),
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUseProjects.mockReturnValue(defaultContext())
})

describe('ProjectsPage', () => {
  it('renders project cards as links to the project board', () => {
    mockUseProjects.mockReturnValue(defaultContext({
      projects: [
        makeProject({ id: 'p-1', name: 'Alpha', color: '#00B6EC' }),
        makeProject({ id: 'p-2', name: 'Beta', color: '#FA9836' }),
      ],
    }))

    render(<ProjectsPage />)

    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
    const projectLinks = screen.getAllByRole('link').filter(l =>
      l.getAttribute('href')?.startsWith('/projects/p-')
    )
    expect(projectLinks).toHaveLength(2)
    expect(projectLinks[0]).toHaveAttribute('href', '/projects/p-1')
    expect(projectLinks[1]).toHaveAttribute('href', '/projects/p-2')
  })

  it('shows empty state message when there are no projects', () => {
    render(<ProjectsPage />)
    expect(screen.getByText(/No projects yet/)).toBeInTheDocument()
  })

  it('shows loading state while projects are loading', () => {
    mockUseProjects.mockReturnValue(defaultContext({ loading: true }))
    render(<ProjectsPage />)
    expect(screen.getByText(/Loading/)).toBeInTheDocument()
  })

  it('"New project" button opens the dialog', async () => {
    render(<ProjectsPage />)
    fireEvent.click(screen.getByRole('button', { name: 'New project' }))
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
    expect(screen.getByRole('heading', { name: 'New project' })).toBeInTheDocument()
  })

  it('submitting the dialog calls addProject with name and default color', async () => {
    mockAddProject.mockResolvedValueOnce(undefined)
    const user = userEvent.setup()
    render(<ProjectsPage />)

    await user.click(screen.getByRole('button', { name: 'New project' }))
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())

    await user.type(screen.getByRole('textbox', { name: 'Project name' }), 'My Project')

    // First color (#00B6EC) is pre-selected — submit immediately
    await user.click(screen.getByRole('button', { name: 'Create project' }))

    await waitFor(() => {
      expect(mockAddProject).toHaveBeenCalledWith('My Project', '#00B6EC')
    })
  })

  it('clicking a color swatch changes the selected color for submission', async () => {
    mockAddProject.mockResolvedValueOnce(undefined)
    const user = userEvent.setup()
    render(<ProjectsPage />)

    await user.click(screen.getByRole('button', { name: 'New project' }))
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())

    await user.type(screen.getByRole('textbox', { name: 'Project name' }), 'Colored')

    // Select the orange swatch
    const orangeSwatch = screen.getByRole('button', { name: 'Color #FA9836' })
    await user.click(orangeSwatch)
    expect(orangeSwatch).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('button', { name: 'Create project' }))

    await waitFor(() => {
      expect(mockAddProject).toHaveBeenCalledWith('Colored', '#FA9836')
    })
  })
})
