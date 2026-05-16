import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AppShell } from '@/components/layout/AppShell'

const mockUseAuth = vi.hoisted(() => vi.fn())

vi.mock('@/lib/context/AuthContext', () => ({
  useAuth: mockUseAuth,
}))

vi.mock('@/components/layout/Sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar" />,
}))

vi.mock('@/components/layout/BottomNav', () => ({
  BottomNav: () => <div data-testid="bottom-nav" />,
}))

vi.mock('@/components/layout/MobileProjectBar', () => ({
  MobileProjectBar: () => <div data-testid="mobile-project-bar" />,
}))

vi.mock('@/components/layout/Topbar', () => ({
  Topbar: () => <div data-testid="topbar" />,
}))

vi.mock('@/components/ui/Toast', () => ({ Toast: () => null }))
vi.mock('@/components/ui/QuickCapture', () => ({ QuickCapture: () => null }))
vi.mock('@/components/ui/KeyboardReferenceSheet', () => ({ KeyboardReferenceSheet: () => null }))
vi.mock('@/components/ui/AppShortcuts', () => ({ AppShortcuts: () => null }))
vi.mock('@/components/tasks/TaskDetail', () => ({ TaskDetail: () => null }))
vi.mock('@/components/layout/CreateProjectDialog', () => ({ CreateProjectDialog: () => null }))

describe('AppShell', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({ loading: false })
  })

  it('renders children when auth has loaded', () => {
    render(<AppShell><div>page content</div></AppShell>)
    expect(screen.getByText('page content')).toBeInTheDocument()
  })

  it('renders sidebar and topbar when auth has loaded', () => {
    render(<AppShell><div>page</div></AppShell>)
    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('topbar')).toBeInTheDocument()
  })

  it('renders ShellSkeleton with aria-label Loading when auth is loading', () => {
    mockUseAuth.mockReturnValue({ loading: true })
    render(<AppShell><div>hidden</div></AppShell>)
    expect(screen.getByLabelText('Loading')).toBeInTheDocument()
    expect(screen.queryByText('hidden')).not.toBeInTheDocument()
  })

  it('does not render sidebar while auth is loading', () => {
    mockUseAuth.mockReturnValue({ loading: true })
    render(<AppShell><div>page</div></AppShell>)
    expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument()
  })
})
