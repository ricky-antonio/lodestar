import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Topbar } from '@/components/layout/Topbar'
import { UIProvider } from '@/lib/context/UIContext'

beforeEach(() => vi.clearAllMocks())

vi.mock('@/lib/context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({
    user: { id: 'user-1' },
    profile: { id: 'user-1', display_name: 'Alice', avatar_url: null, theme: 'light', updated_at: '' },
    workspace: { id: 'ws-1', name: 'Acme', slug: 'acme', color: '#00B6EC', owner_id: 'user-1', timezone: 'UTC', end_of_day_time: '17:00', created_at: '', updated_at: '' },
    member: null, loading: false, signOut: vi.fn(), toggleTheme: vi.fn(),
  }),
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
    expect(screen.getByLabelText('Alice')).toHaveTextContent('A')
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
})
