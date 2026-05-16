import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MobileProjectBar } from '@/components/layout/MobileProjectBar'

const mockAddProject = vi.fn()
const mockSetActiveProject = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('@/lib/context/ProjectsContext', () => ({
  useProjects: () => ({
    projects: [
      { id: 'p-1', name: 'Alpha', color: '#00B6EC', workspace_id: 'ws-1', description: null, status: 'active', default_view: 'list', created_at: '', updated_at: '' },
      { id: 'p-2', name: 'Beta', color: '#EA6400', workspace_id: 'ws-1', description: null, status: 'active', default_view: 'list', created_at: '', updated_at: '' },
    ],
    activeProject: { id: 'p-1', name: 'Alpha', color: '#00B6EC', workspace_id: 'ws-1', description: null, status: 'active', default_view: 'list', created_at: '', updated_at: '' },
    setActiveProject: mockSetActiveProject,
    addProject: mockAddProject,
  }),
}))

describe('MobileProjectBar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAddProject.mockResolvedValue('new-id')
  })

  it('renders the mobile project bar', () => {
    render(<MobileProjectBar />)
    expect(screen.getByTestId('mobile-project-bar')).toBeInTheDocument()
  })

  it('shows the active project name', () => {
    render(<MobileProjectBar />)
    expect(screen.getByText('Alpha')).toBeInTheDocument()
  })

  it('shows project list in popover when trigger is clicked', () => {
    render(<MobileProjectBar />)
    fireEvent.click(screen.getByLabelText('Select project'))
    expect(screen.getByText('Beta')).toBeInTheDocument()
  })

  it('calls setActiveProject when a project is selected', () => {
    render(<MobileProjectBar />)
    fireEvent.click(screen.getByLabelText('Select project'))
    fireEvent.click(screen.getByText('Beta'))
    expect(mockSetActiveProject).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'p-2', name: 'Beta' }),
    )
  })

  it('opens new project dialog when "New project" is clicked', () => {
    render(<MobileProjectBar />)
    fireEvent.click(screen.getByLabelText('Select project'))
    fireEvent.click(screen.getByText('New project'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('calls addProject when form is submitted with a name', async () => {
    render(<MobileProjectBar />)
    fireEvent.click(screen.getByLabelText('Select project'))
    fireEvent.click(screen.getByText('New project'))

    fireEvent.change(screen.getByRole('textbox', { name: /project name/i }), {
      target: { value: 'Gamma' },
    })
    fireEvent.click(screen.getByRole('button', { name: /create project/i }))

    await waitFor(() => {
      expect(mockAddProject).toHaveBeenCalledWith('Gamma', '#00B6EC')
    })
  })
})
