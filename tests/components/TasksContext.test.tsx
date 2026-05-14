import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { mockSupabase } from '../mocks/supabase'
import { AuthProvider } from '@/lib/context/AuthContext'
import { ProjectsProvider } from '@/lib/context/ProjectsContext'
import { TasksProvider, useTasks } from '@/lib/context/TasksContext'
import type { Task } from '@/lib/types'

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
  id: 'ws-1', name: 'WS', slug: 'ws', color: '#00B6EC', owner_id: 'user-1',
  timezone: 'UTC', end_of_day_time: '17:00',
  created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
}

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 't-1', workspace_id: 'ws-1', project_id: null, parent_id: null,
    title: 'Task', description: null, status: 'todo', priority: 'medium',
    assignee_id: null, due_date: null, estimated_mins: null, position: 1.0,
    is_archived: false, is_recurring: false, recurrence_rule: null, snoozed_until: null,
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

// Distinguish getTasks (field='position') from getProjects (field='created_at')
function setupOrderMocks(taskData: Task[], projectData: unknown[] = []) {
  mockSupabase.order.mockImplementation((field: string) => {
    if (field === 'position') return Promise.resolve({ data: taskData, error: null })
    return Promise.resolve({ data: projectData, error: null })
  })
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <ProjectsProvider>
      <TasksProvider>{children}</TasksProvider>
    </ProjectsProvider>
  </AuthProvider>
)

describe('TasksContext', () => {
  it('loads inbox tasks when workspace loads and no active project', async () => {
    setupAuthMocks()
    setupOrderMocks([makeTask()])

    const { result } = renderHook(() => useTasks(), { wrapper })
    await waitFor(() => expect(result.current.tasks).toHaveLength(1), { timeout: 3000 })
  })

  it('starts empty with no workspace (no user)', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    const { result } = renderHook(() => useTasks(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.tasks).toHaveLength(0)
  })

  it('addTask optimistically adds and replaces with DB record', async () => {
    setupAuthMocks()
    setupOrderMocks([])
    const created = makeTask({ id: 't-new', title: 'New task' })
    mockSupabase.single.mockResolvedValueOnce({ data: created, error: null })

    const { result } = renderHook(() => useTasks(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.addTask({ title: 'New task' })
    })

    expect(result.current.tasks.some(t => t.id === 't-new')).toBe(true)
  })

  it('addTask rolls back on DB error', async () => {
    setupAuthMocks()
    setupOrderMocks([makeTask()])
    mockSupabase.single.mockResolvedValueOnce({ data: null, error: new Error('Insert failed') })

    const { result } = renderHook(() => useTasks(), { wrapper })
    await waitFor(() => expect(result.current.tasks).toHaveLength(1))

    await act(async () => {
      await result.current.addTask({ title: 'Fail' })
    })

    expect(result.current.tasks).toHaveLength(1)
  })

  it('editTask optimistically updates', async () => {
    setupAuthMocks()
    setupOrderMocks([makeTask({ title: 'Old' })])
    const updated = makeTask({ title: 'Updated' })
    mockSupabase.single.mockResolvedValueOnce({ data: updated, error: null })

    const { result } = renderHook(() => useTasks(), { wrapper })
    await waitFor(() => expect(result.current.tasks).toHaveLength(1))

    await act(async () => {
      await result.current.editTask('t-1', { title: 'Updated' })
    })

    expect(result.current.tasks[0].title).toBe('Updated')
  })

  it('editTask rolls back on DB error', async () => {
    setupAuthMocks()
    setupOrderMocks([makeTask({ title: 'Original' })])
    mockSupabase.single.mockResolvedValueOnce({ data: null, error: new Error('Update failed') })

    const { result } = renderHook(() => useTasks(), { wrapper })
    await waitFor(() => expect(result.current.tasks).toHaveLength(1))

    await act(async () => {
      await result.current.editTask('t-1', { title: 'Changed' })
    })

    expect(result.current.tasks[0].title).toBe('Original')
  })

  it('removeTask optimistically removes', async () => {
    setupAuthMocks()
    const tasks = [makeTask({ id: 't-1' }), makeTask({ id: 't-2', title: 'Second' })]
    setupOrderMocks(tasks)

    const { result } = renderHook(() => useTasks(), { wrapper })
    await waitFor(() => expect(result.current.tasks).toHaveLength(2))

    await act(async () => {
      await result.current.removeTask('t-1')
    })

    expect(result.current.tasks.every(t => t.id !== 't-1')).toBe(true)
  })

  it('archiveTask optimistically removes from list', async () => {
    setupAuthMocks()
    setupOrderMocks([makeTask()])

    const { result } = renderHook(() => useTasks(), { wrapper })
    await waitFor(() => expect(result.current.tasks).toHaveLength(1))

    await act(async () => {
      await result.current.archiveTask('t-1')
    })

    expect(result.current.tasks).toHaveLength(0)
  })

  it('throws when useTasks is used outside TasksProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const plainWrapper = ({ children }: { children: React.ReactNode }) => <>{children}</>
    expect(() => renderHook(() => useTasks(), { wrapper: plainWrapper })).toThrow(
      'useTasks must be used within TasksProvider'
    )
    spy.mockRestore()
  })
})
