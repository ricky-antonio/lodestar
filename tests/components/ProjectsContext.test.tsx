import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { mockSupabase } from '../mocks/supabase'
import { AuthProvider } from '@/lib/context/AuthContext'
import { ProjectsProvider, useProjects } from '@/lib/context/ProjectsContext'
import type { Project } from '@/lib/types'

beforeEach(() => vi.clearAllMocks())

const mockUser = { id: 'user-1', email: 'test@example.com' }
const mockProfile = {
  id: 'user-1', display_name: 'Test', avatar_url: null,
  theme: 'light' as const, updated_at: '2024-01-01T00:00:00Z',
}
const mockMember = {
  id: 'member-1', workspace_id: 'ws-1', user_id: 'user-1',
  role: 'owner' as const, joined_at: '2024-01-01T00:00:00Z',
}
const mockWorkspace = {
  id: 'ws-1', name: 'Test WS', slug: 'test', color: '#00B6EC',
  owner_id: 'user-1', timezone: 'UTC', end_of_day_time: '17:00',
  created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
}

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'p-1', workspace_id: 'ws-1', name: 'Alpha', description: null,
    color: '#00B6EC', status: 'active', default_view: 'list',
    created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

function setupAuthMocks() {
  mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
  mockSupabase.single
    .mockResolvedValueOnce({ data: mockProfile, error: null })
    .mockResolvedValueOnce({ data: mockMember, error: null })
    .mockResolvedValueOnce({ data: mockWorkspace, error: null })
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <ProjectsProvider>{children}</ProjectsProvider>
  </AuthProvider>
)

// Waits for the initial project load to complete by polling until loading is false
// AND projects has stabilized (auth + projects both done)
async function waitForProjectsLoaded(result: { current: ReturnType<typeof useProjects> }) {
  // Wait for workspace to load (auth complete) and then projects to load
  await waitFor(() => {
    expect(result.current.loading).toBe(false)
    // If projects loaded but loading is still true, keep waiting
  }, { timeout: 3000 })
}

describe('ProjectsContext', () => {
  it('loads projects when workspace becomes available', async () => {
    setupAuthMocks()
    const projects = [makeProject()]
    mockSupabase.order.mockResolvedValueOnce({ data: projects, error: null })

    const { result } = renderHook(() => useProjects(), { wrapper })

    // Wait until projects are actually populated (not just loading=false from workspace=null state)
    await waitFor(() => expect(result.current.projects).toHaveLength(1), { timeout: 3000 })
    expect(result.current.projects[0].name).toBe('Alpha')
  })

  it('stays empty when there is no workspace (no user)', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    const { result } = renderHook(() => useProjects(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.projects).toHaveLength(0)
  })

  it('addProject optimistically adds and replaces with DB record', async () => {
    setupAuthMocks()
    const initial = [makeProject({ id: 'p-1' })]
    mockSupabase.order.mockResolvedValueOnce({ data: initial, error: null })
    const created = makeProject({ id: 'p-new', name: 'Beta' })
    mockSupabase.single.mockResolvedValueOnce({ data: created, error: null })

    const { result } = renderHook(() => useProjects(), { wrapper })
    await waitFor(() => expect(result.current.projects).toHaveLength(1))

    await act(async () => {
      await result.current.addProject('Beta', '#fff')
    })

    expect(result.current.projects.some(p => p.id === 'p-new')).toBe(true)
  })

  it('addProject rolls back on DB error', async () => {
    setupAuthMocks()
    const initial = [makeProject()]
    mockSupabase.order.mockResolvedValueOnce({ data: initial, error: null })
    mockSupabase.single.mockResolvedValueOnce({ data: null, error: new Error('Insert failed') })

    const { result } = renderHook(() => useProjects(), { wrapper })
    await waitFor(() => expect(result.current.projects).toHaveLength(1))

    await act(async () => {
      await result.current.addProject('Fail', '#fff')
    })

    expect(result.current.projects).toHaveLength(1)
  })

  it('editProject optimistically updates name', async () => {
    setupAuthMocks()
    const projects = [makeProject({ name: 'Old Name' })]
    mockSupabase.order.mockResolvedValueOnce({ data: projects, error: null })
    const updated = makeProject({ name: 'New Name' })
    mockSupabase.single.mockResolvedValueOnce({ data: updated, error: null })

    const { result } = renderHook(() => useProjects(), { wrapper })
    await waitFor(() => expect(result.current.projects).toHaveLength(1))

    await act(async () => {
      await result.current.editProject('p-1', { name: 'New Name' })
    })

    expect(result.current.projects[0].name).toBe('New Name')
  })

  it('removeProject optimistically removes and archives in DB', async () => {
    setupAuthMocks()
    const projects = [makeProject({ id: 'p-1' }), makeProject({ id: 'p-2', name: 'Beta' })]
    mockSupabase.order.mockResolvedValueOnce({ data: projects, error: null })

    const { result } = renderHook(() => useProjects(), { wrapper })
    await waitFor(() => expect(result.current.projects).toHaveLength(2))

    await act(async () => {
      await result.current.removeProject('p-1')
    })

    expect(result.current.projects.every(p => p.id !== 'p-1')).toBe(true)
  })

  it('throws when useProjects is used outside ProjectsProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const plainWrapper = ({ children }: { children: React.ReactNode }) => <>{children}</>
    expect(() => renderHook(() => useProjects(), { wrapper: plainWrapper })).toThrow(
      'useProjects must be used within ProjectsProvider'
    )
    spy.mockRestore()
  })
})
