import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, renderHook, act } from '@testing-library/react'
import { mockSupabase } from '../mocks/supabase'
import { AuthProvider, useAuth } from '@/lib/context/AuthContext'

beforeEach(() => vi.clearAllMocks())

const mockUser = { id: 'user-1', email: 'test@example.com' }
const mockProfile = {
  id: 'user-1',
  display_name: 'Test User',
  avatar_url: null,
  theme: 'light' as const,
  updated_at: '2024-01-01T00:00:00Z',
}
const mockMember = {
  id: 'member-1',
  workspace_id: 'ws-1',
  user_id: 'user-1',
  role: 'owner' as const,
  joined_at: '2024-01-01T00:00:00Z',
}
const mockWorkspace = {
  id: 'ws-1',
  name: 'Test Workspace',
  slug: 'test-ws',
  color: '#00B6EC',
  owner_id: 'user-1',
  timezone: 'UTC',
  end_of_day_time: '17:00',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

function setupLoggedInMocks() {
  mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
  mockSupabase.single
    .mockResolvedValueOnce({ data: mockProfile, error: null })
    .mockResolvedValueOnce({ data: mockMember, error: null })
    .mockResolvedValueOnce({ data: mockWorkspace, error: null })
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
)

function TestConsumer() {
  const { user, profile, workspace, loading } = useAuth()
  if (loading) return <div>loading</div>
  return (
    <div>
      <span data-testid="user">{user?.email ?? 'none'}</span>
      <span data-testid="profile">{profile?.display_name ?? 'none'}</span>
      <span data-testid="workspace">{workspace?.name ?? 'none'}</span>
    </div>
  )
}

describe('AuthContext', () => {
  it('shows loading initially then resolves', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    render(<AuthProvider><TestConsumer /></AuthProvider>)
    expect(screen.getByText('loading')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText('loading')).not.toBeInTheDocument())
  })

  it('loads user, profile, and workspace on mount', async () => {
    setupLoggedInMocks()
    render(<AuthProvider><TestConsumer /></AuthProvider>)

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
    })
    expect(screen.getByTestId('profile')).toHaveTextContent('Test User')
    expect(screen.getByTestId('workspace')).toHaveTextContent('Test Workspace')
  })

  it('stays logged out when no user is returned', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    render(<AuthProvider><TestConsumer /></AuthProvider>)

    await waitFor(() => {
      expect(screen.queryByText('loading')).not.toBeInTheDocument()
    })
    expect(screen.getByTestId('user')).toHaveTextContent('none')
  })

  it('signOut clears all auth state', async () => {
    setupLoggedInMocks()
    mockSupabase.auth.signOut.mockResolvedValue({ error: null })

    const { result } = renderHook(() => useAuth(), { wrapper })

    // Wait for the full load (not just user being set mid-load)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.user?.email).toBe('test@example.com')

    await act(async () => {
      await result.current.signOut()
    })

    expect(result.current.user).toBeNull()
    expect(result.current.profile).toBeNull()
    expect(result.current.workspace).toBeNull()
  })

  it('toggleTheme optimistically flips the theme', async () => {
    setupLoggedInMocks()

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.profile?.theme).toBe('light')

    await act(async () => {
      await result.current.toggleTheme()
    })

    expect(result.current.profile?.theme).toBe('dark')
  })

  it('throws when useAuth is used outside AuthProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<TestConsumer />)).toThrow('useAuth must be used within AuthProvider')
    spy.mockRestore()
  })
})
