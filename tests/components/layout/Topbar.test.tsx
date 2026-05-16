import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Topbar } from '@/components/layout/Topbar'
import { UIProvider } from '@/lib/context/UIContext'

const mockSignOut = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
const mockPush = vi.hoisted(() => vi.fn())

beforeEach(() => vi.clearAllMocks())

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('@/lib/context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({
    user: { id: 'user-1' },
    profile: { id: 'user-1', display_name: 'Alice', avatar_url: null, theme: 'light', updated_at: '' },
    workspace: { id: 'ws-1', name: 'Acme', slug: 'acme', color: '#00B6EC', owner_id: 'user-1', timezone: 'UTC', end_of_day_time: '17:00', created_at: '', updated_at: '' },
    member: null, loading: false, signOut: mockSignOut, toggleTheme: vi.fn(),
  }),
}))

vi.mock('@/lib/context/ProjectsContext', () => ({
  ProjectsProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useProjects: () => ({ projects: [], activeProject: null, loading: false }),
}))

// Mock Radix dropdown so menu items are always visible (portal doesn't work in jsdom)
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({
    children,
    onClick,
    onSelect,
    asChild,
  }: {
    children: React.ReactNode
    onClick?: () => void
    onSelect?: () => void
    asChild?: boolean
  }) => <button onClick={onClick ?? onSelect}>{children}</button>,
  DropdownMenuSeparator: () => <hr />,
}))

function renderTopbar() {
  return render(<UIProvider><Topbar /></UIProvider>)
}

describe('Topbar', () => {
  it('renders the workspace name in the breadcrumb', () => {
    renderTopbar()
    expect(screen.getByText('Acme')).toBeInTheDocument()
  })

  it('renders view title (falls back to lodestar when path is /)', () => {
    renderTopbar()
    expect(screen.getByText('lodestar')).toBeInTheDocument()
  })

  it('renders user avatar with first initial', () => {
    renderTopbar()
    expect(screen.getByLabelText('User menu')).toHaveTextContent('A')
  })

  it('has a search button with aria-label', () => {
    renderTopbar()
    expect(screen.getByLabelText('Search')).toBeInTheDocument()
  })

  it('clicking search does not throw', () => {
    renderTopbar()
    expect(() => fireEvent.click(screen.getByLabelText('Search'))).not.toThrow()
  })

  it('has topbar data-testid', () => {
    renderTopbar()
    expect(screen.getByTestId('topbar')).toBeInTheDocument()
  })

  it('clicking Sign out calls signOut', async () => {
    renderTopbar()
    fireEvent.click(screen.getByText('Sign out'))
    await vi.waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled()
    })
  })

  it('sign out navigates to /login after signOut resolves', async () => {
    renderTopbar()
    fireEvent.click(screen.getByText('Sign out'))
    await vi.waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login')
    })
  })
})
