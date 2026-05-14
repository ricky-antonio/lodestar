import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockSupabase } from '../mocks/supabase'
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  archiveProject,
} from '@/lib/projects'

beforeEach(() => vi.clearAllMocks())

describe('getProjects', () => {
  it('returns active projects for a workspace', async () => {
    const projects = [{ id: 'p-1', name: 'Alpha', status: 'active' }]
    mockSupabase.order.mockResolvedValueOnce({ data: projects, error: null })
    const result = await getProjects('ws-1')
    expect(result).toEqual(projects)
    expect(mockSupabase.eq).toHaveBeenCalledWith('status', 'active')
  })

  it('returns empty array when there are no projects', async () => {
    mockSupabase.order.mockResolvedValueOnce({ data: null, error: null })
    const result = await getProjects('ws-1')
    expect(result).toEqual([])
  })

  it('throws when the query errors', async () => {
    mockSupabase.order.mockResolvedValueOnce({ data: null, error: new Error('DB error') })
    await expect(getProjects('ws-1')).rejects.toThrow('DB error')
  })
})

describe('getProjectById', () => {
  it('returns null for an unknown id', async () => {
    mockSupabase.maybeSingle.mockResolvedValueOnce({ data: null, error: null })
    const result = await getProjectById('unknown-id')
    expect(result).toBeNull()
  })

  it('returns the project when found', async () => {
    const project = { id: 'p-1', name: 'Alpha' }
    mockSupabase.maybeSingle.mockResolvedValueOnce({ data: project, error: null })
    const result = await getProjectById('p-1')
    expect(result).toEqual(project)
  })

  it('throws when the query errors', async () => {
    mockSupabase.maybeSingle.mockResolvedValueOnce({ data: null, error: new Error('DB error') })
    await expect(getProjectById('p-1')).rejects.toThrow('DB error')
  })
})

describe('createProject', () => {
  it('returns the newly created project', async () => {
    const project = { id: 'p-new', workspace_id: 'ws-1', name: 'Beta', color: '#00B6EC' }
    mockSupabase.single.mockResolvedValueOnce({ data: project, error: null })
    const result = await createProject('ws-1', 'Beta', '#00B6EC')
    expect(result).toEqual(project)
    expect(mockSupabase.insert).toHaveBeenCalledWith({
      workspace_id: 'ws-1',
      name: 'Beta',
      color: '#00B6EC',
    })
  })

  it('throws on insert error', async () => {
    mockSupabase.single.mockResolvedValueOnce({ data: null, error: new Error('Insert failed') })
    await expect(createProject('ws-1', 'Beta', '#fff')).rejects.toThrow('Insert failed')
  })
})

describe('updateProject', () => {
  it('returns the updated project', async () => {
    const project = { id: 'p-1', name: 'Renamed' }
    mockSupabase.single.mockResolvedValueOnce({ data: project, error: null })
    const result = await updateProject('p-1', { name: 'Renamed' })
    expect(result).toEqual(project)
  })

  it('throws on update error', async () => {
    mockSupabase.single.mockResolvedValueOnce({ data: null, error: new Error('Update failed') })
    await expect(updateProject('p-1', { name: 'x' })).rejects.toThrow('Update failed')
  })
})

describe('archiveProject', () => {
  it('calls update with status archived', async () => {
    // eq is terminal here — default mockReturnThis resolves to mockSupabase (no error)
    await archiveProject('p-1')
    expect(mockSupabase.update).toHaveBeenCalledWith({ status: 'archived' })
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'p-1')
  })

  it('throws on update error', async () => {
    mockSupabase.eq.mockResolvedValueOnce({ data: null, error: new Error('Update failed') })
    await expect(archiveProject('p-1')).rejects.toThrow('Update failed')
  })
})
