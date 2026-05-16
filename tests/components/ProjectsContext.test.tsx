import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { mockSupabase } from '../mocks/supabase'
import { AuthProvider } from '@/lib/context/AuthContext'
import { ProjectsProvider, useProjects } from '@/lib/context/ProjectsContext'
import type { Project } from '@/lib/types'

// Mock lib/projects directly — avoids fragile Supabase chain ordering issues
const mockGetProjects = vi.fn()
const mockCreateProject = vi.fn()
const mockUpdateProject = vi.fn()
const mockArchiveProject = vi.fn()

vi.mock('@/lib/projects', () => ({
  getProjects: (...args: unknown[]) => mockGetProjects(...args),
  createProject: (...args: unknown[]) => mockCreateProject(...args),
  updateProject: (...args: unknown[]) => mockUpdateProject(...args),
  archiveProject: (...args: unknown[]) => mockArchiveProject(...args),
}))

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

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  mockArchiveProject.mockResolvedValue(undefined)
})

describe('ProjectsContext', () => {
  it('loads projects when workspace becomes available', async () => {
    setupAuthMocks()
    mockGetProjects.mockResolvedValueOnce([makeProject()])

    const { result } = renderHook(() => useProjects(), { wrapper })
    await waitFor(() => expect(result.current.projects).toHaveLength(1), { timeout: 3000 })
    expect(result.current.projects[0].name).toBe('Alpha')
  })

  it('stays empty when there is no workspace (no user)', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    const { result } = renderHook(() => useProjects(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.projects).toHaveLength(0)
    expect(mockGetProjects).not.toHaveBeenCalled()
  })

  it('addProject optimistically adds and replaces with DB record', async () => {
    setupAuthMocks()
    mockGetProjects.mockResolvedValueOnce([makeProject({ id: 'p-1' })])
    const created = makeProject({ id: 'p-new', name: 'Beta' })
    mockCreateProject.mockResolvedValueOnce(created)

    const { result } = renderHook(() => useProjects(), { wrapper })
    await waitFor(() => expect(result.current.projects).toHaveLength(1))

    await act(async () => {
      await result.current.addProject('Beta', '#fff')
    })

    expect(result.current.projects.some(p => p.id === 'p-new')).toBe(true)
    expect(result.current.projects.every(p => !p.id.startsWith('temp-'))).toBe(true)
  })

  it('addProject rolls back on DB error', async () => {
    setupAuthMocks()
    mockGetProjects.mockResolvedValueOnce([makeProject()])
    mockCreateProject.mockRejectedValueOnce(new Error('Insert failed'))

    const { result } = renderHook(() => useProjects(), { wrapper })
    await waitFor(() => expect(result.current.projects).toHaveLength(1))

    await act(async () => {
      await result.current.addProject('Fail', '#fff')
    })

    expect(result.current.projects).toHaveLength(1)
    expect(result.current.projects[0].id).toBe('p-1')
  })

  it('editProject optimistically updates name', async () => {
    setupAuthMocks()
    mockGetProjects.mockResolvedValueOnce([makeProject({ name: 'Old Name' })])
    mockUpdateProject.mockResolvedValueOnce(makeProject({ name: 'New Name' }))

    const { result } = renderHook(() => useProjects(), { wrapper })
    await waitFor(() => expect(result.current.projects).toHaveLength(1))

    await act(async () => {
      await result.current.editProject('p-1', { name: 'New Name' })
    })

    expect(result.current.projects[0].name).toBe('New Name')
  })

  it('editProject rolls back on DB error', async () => {
    setupAuthMocks()
    mockGetProjects.mockResolvedValueOnce([makeProject({ name: 'Original' })])
    mockUpdateProject.mockRejectedValueOnce(new Error('Update failed'))

    const { result } = renderHook(() => useProjects(), { wrapper })
    await waitFor(() => expect(result.current.projects).toHaveLength(1))

    await act(async () => {
      await result.current.editProject('p-1', { name: 'Changed' })
    })

    expect(result.current.projects[0].name).toBe('Original')
  })

  it('editProject also updates activeProject when it is the active project', async () => {
    setupAuthMocks()
    mockGetProjects.mockResolvedValueOnce([makeProject({ id: 'p-1', name: 'Old' })])
    mockUpdateProject.mockResolvedValueOnce(makeProject({ id: 'p-1', name: 'New' }))

    const { result } = renderHook(() => useProjects(), { wrapper })
    await waitFor(() => expect(result.current.projects).toHaveLength(1))

    act(() => { result.current.setActiveProject(result.current.projects[0]) })
    await act(async () => {
      await result.current.editProject('p-1', { name: 'New' })
    })

    expect(result.current.activeProject?.name).toBe('New')
  })

  it('editProject rolls back activeProject on DB error', async () => {
    setupAuthMocks()
    mockGetProjects.mockResolvedValueOnce([makeProject({ id: 'p-1', name: 'Original' })])
    mockUpdateProject.mockRejectedValueOnce(new Error('Update failed'))

    const { result } = renderHook(() => useProjects(), { wrapper })
    await waitFor(() => expect(result.current.projects).toHaveLength(1))

    act(() => { result.current.setActiveProject(result.current.projects[0]) })
    await act(async () => {
      await result.current.editProject('p-1', { name: 'Changed' })
    })

    expect(result.current.activeProject?.name).toBe('Original')
  })

  it('removeProject optimistically removes and archives in DB', async () => {
    setupAuthMocks()
    const projects = [makeProject({ id: 'p-1' }), makeProject({ id: 'p-2', name: 'Beta' })]
    mockGetProjects.mockResolvedValueOnce(projects)

    const { result } = renderHook(() => useProjects(), { wrapper })
    await waitFor(() => expect(result.current.projects).toHaveLength(2))

    await act(async () => {
      await result.current.removeProject('p-1')
    })

    expect(result.current.projects.every(p => p.id !== 'p-1')).toBe(true)
    expect(mockArchiveProject).toHaveBeenCalledWith('p-1')
  })

  it('removeProject rolls back on DB error', async () => {
    setupAuthMocks()
    const projects = [makeProject({ id: 'p-1' }), makeProject({ id: 'p-2', name: 'Beta' })]
    mockGetProjects.mockResolvedValueOnce(projects)
    mockArchiveProject.mockRejectedValueOnce(new Error('Archive failed'))

    const { result } = renderHook(() => useProjects(), { wrapper })
    await waitFor(() => expect(result.current.projects).toHaveLength(2))

    await act(async () => {
      await result.current.removeProject('p-1')
    })

    expect(result.current.projects).toHaveLength(2)
  })

  it('setActiveProject stores project id to localStorage', async () => {
    setupAuthMocks()
    mockGetProjects.mockResolvedValueOnce([makeProject()])

    const { result } = renderHook(() => useProjects(), { wrapper })
    await waitFor(() => expect(result.current.projects).toHaveLength(1))

    act(() => { result.current.setActiveProject(result.current.projects[0]) })

    expect(localStorage.getItem('lodestar:lastProjectId')).toBe('p-1')
  })

  it('setActiveProject with null does not write to localStorage', async () => {
    setupAuthMocks()
    mockGetProjects.mockResolvedValueOnce([makeProject()])

    const { result } = renderHook(() => useProjects(), { wrapper })
    await waitFor(() => expect(result.current.projects).toHaveLength(1))

    localStorage.setItem('lodestar:lastProjectId', 'p-1')
    act(() => { result.current.setActiveProject(null) })

    // setActiveProject(null) clears state but does not clear localStorage
    expect(localStorage.getItem('lodestar:lastProjectId')).toBe('p-1')
    expect(result.current.activeProject).toBeNull()
  })

  it('restores activeProject from localStorage on load', async () => {
    localStorage.setItem('lodestar:lastProjectId', 'p-1')
    setupAuthMocks()
    mockGetProjects.mockResolvedValueOnce([makeProject({ id: 'p-1', name: 'Remembered' })])

    const { result } = renderHook(() => useProjects(), { wrapper })
    await waitFor(() => expect(result.current.projects).toHaveLength(1))

    expect(result.current.activeProject?.id).toBe('p-1')
  })

  it('removeProject clears localStorage when removing the active project', async () => {
    setupAuthMocks()
    mockGetProjects.mockResolvedValueOnce([makeProject({ id: 'p-1' })])

    const { result } = renderHook(() => useProjects(), { wrapper })
    await waitFor(() => expect(result.current.projects).toHaveLength(1))

    act(() => { result.current.setActiveProject(result.current.projects[0]) })
    await act(async () => {
      await result.current.removeProject('p-1')
    })

    expect(result.current.activeProject).toBeNull()
    expect(localStorage.getItem('lodestar:lastProjectId')).toBeNull()
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
