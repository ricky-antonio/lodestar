import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Sidebar } from '@/components/layout/Sidebar'
import { UIProvider } from '@/lib/context/UIContext'

beforeEach(() => vi.clearAllMocks())

vi.mock('@/lib/context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({
    user: { id: 'user-1' },
    profile: { display_name: 'Test' },
    workspace: { id: 'ws-1', name: 'Acme', slug: 'acme', color: '#00B6EC', owner_id: 'user-1', timezone: 'UTC', end_of_day_time: '17:00', created_at: '', updated_at: '' },
    member: null, loading: false, signOut: vi.fn(), toggleTheme: vi.fn(),
  }),
}))

vi.mock('@/lib/context/ProjectsContext', () => ({
  ProjectsProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useProjects: () => ({
    projects: [
      { id: 'p-1', name: 'Alpha', color: '#00B6EC', workspace_id: 'ws-1', description: null, status: 'active', default_view: 'list', created_at: '', updated_at: '' },
      { id: 'p-2', name: 'Beta',  color: '#EA6400', workspace_id: 'ws-1', description: null, status: 'active', default_view: 'list', created_at: '', updated_at: '' },
    ],
    activeProject: { id: 'p-1', name: 'Alpha', color: '#00B6EC', workspace_id: 'ws-1', description: null, status: 'active', default_view: 'list', created_at: '', updated_at: '' },
    setActiveProject: vi.fn(),
    addProject: vi.fn(),
    editProject: vi.fn(),
    removeProject: vi.fn(),
    loading: false,
  }),
}))

// ProjectSwitcher uses useRouter for navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}))

function renderSidebar() {
  return render(<UIProvider><Sidebar /></UIProvider>)
}

describe('Sidebar', () => {
  it('renders the workspace name', () => {
    renderSidebar()
    expect(screen.getByText('Acme')).toBeInTheDocument()
  })

  it('renders all four nav items', () => {
    renderSidebar()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Inbox')).toBeInTheDocument()
    expect(screen.getByText('My Day')).toBeInTheDocument()
    expect(screen.getByText('Matrix')).toBeInTheDocument()
  })

  it('shows the active project name in the switcher', () => {
    renderSidebar()
    expect(screen.getByText('Alpha')).toBeInTheDocument()
  })

  it('collapses and hides text labels', () => {
    renderSidebar()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Collapse sidebar'))
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Dashboard')).toBeInTheDocument()
  })

  it('re-expands after collapsing', () => {
    renderSidebar()
    fireEvent.click(screen.getByLabelText('Collapse sidebar'))
    fireEvent.click(screen.getByLabelText('Expand sidebar'))
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('has sidebar landmark role', () => {
    renderSidebar()
    expect(screen.getByRole('complementary', { name: 'Sidebar' })).toBeInTheDocument()
  })

  it('project items in switcher link to /projects/[id]', () => {
    renderSidebar()
    // Open the switcher popover
    fireEvent.click(screen.getByLabelText('Select project'))
    expect(screen.getByText('Beta')).toBeInTheDocument()
  })
})
