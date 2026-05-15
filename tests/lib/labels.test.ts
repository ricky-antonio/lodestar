import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockSupabase } from '../mocks/supabase'
import {
  getLabels,
  createLabel,
  updateLabel,
  deleteLabel,
  getTaskLabels,
  addLabelToTask,
  removeLabelFromTask,
} from '@/lib/labels'

describe('getLabels', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns workspace labels ordered by name', async () => {
    const rows = [
      { id: 'l-1', workspace_id: 'ws-1', name: 'Bug', color: '#EF4444' },
      { id: 'l-2', workspace_id: 'ws-1', name: 'Feature', color: '#00B6EC' },
    ]
    mockSupabase.order.mockResolvedValueOnce({ data: rows, error: null })

    const result = await getLabels('ws-1')
    expect(result).toEqual(rows)
    expect(mockSupabase.eq).toHaveBeenCalledWith('workspace_id', 'ws-1')
  })

  it('throws when supabase returns an error', async () => {
    mockSupabase.order.mockResolvedValueOnce({ data: null, error: new Error('db error') })
    await expect(getLabels('ws-1')).rejects.toThrow('db error')
  })
})

describe('createLabel', () => {
  beforeEach(() => vi.clearAllMocks())

  it('inserts and returns the new label', async () => {
    const label = { id: 'l-1', workspace_id: 'ws-1', name: 'Bug', color: '#EF4444' }
    mockSupabase.single.mockResolvedValueOnce({ data: label, error: null })

    const result = await createLabel('ws-1', 'Bug', '#EF4444')
    expect(result).toEqual(label)
    expect(mockSupabase.insert).toHaveBeenCalledWith(
      expect.objectContaining({ workspace_id: 'ws-1', name: 'Bug', color: '#EF4444' })
    )
  })

  it('throws when supabase returns an error', async () => {
    mockSupabase.single.mockResolvedValueOnce({ data: null, error: new Error('insert fail') })
    await expect(createLabel('ws-1', 'Bug', '#EF4444')).rejects.toThrow('insert fail')
  })
})

describe('updateLabel', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates the label and returns the updated row', async () => {
    const updated = { id: 'l-1', workspace_id: 'ws-1', name: 'Fixed', color: '#22C55E' }
    mockSupabase.single.mockResolvedValueOnce({ data: updated, error: null })

    const result = await updateLabel('l-1', { name: 'Fixed', color: '#22C55E' })
    expect(result).toEqual(updated)
    expect(mockSupabase.update).toHaveBeenCalledWith({ name: 'Fixed', color: '#22C55E' })
  })

  it('throws when supabase returns an error', async () => {
    mockSupabase.single.mockResolvedValueOnce({ data: null, error: new Error('update fail') })
    await expect(updateLabel('l-1', { name: 'x' })).rejects.toThrow('update fail')
  })
})

describe('deleteLabel', () => {
  beforeEach(() => vi.clearAllMocks())

  it('deletes the label by id', async () => {
    mockSupabase.eq.mockResolvedValueOnce({ error: null })
    await deleteLabel('l-1')
    expect(mockSupabase.delete).toHaveBeenCalled()
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'l-1')
  })

  it('throws when supabase returns an error', async () => {
    mockSupabase.eq.mockResolvedValueOnce({ error: new Error('delete fail') })
    await expect(deleteLabel('l-1')).rejects.toThrow('delete fail')
  })
})

describe('getTaskLabels', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns labels attached to the task', async () => {
    const label = { id: 'l-1', workspace_id: 'ws-1', name: 'Bug', color: '#EF4444' }
    mockSupabase.eq.mockResolvedValueOnce({
      data: [{ label_id: 'l-1', labels: label }],
      error: null,
    })

    const result = await getTaskLabels('task-1')
    expect(result).toEqual([label])
    expect(mockSupabase.eq).toHaveBeenCalledWith('task_id', 'task-1')
  })

  it('throws when supabase returns an error', async () => {
    mockSupabase.eq.mockResolvedValueOnce({ data: null, error: new Error('fetch fail') })
    await expect(getTaskLabels('task-1')).rejects.toThrow('fetch fail')
  })
})

describe('addLabelToTask', () => {
  beforeEach(() => vi.clearAllMocks())

  it('inserts a task_labels row', async () => {
    mockSupabase.insert.mockResolvedValueOnce({ error: null })
    await addLabelToTask('task-1', 'l-1')
    expect(mockSupabase.insert).toHaveBeenCalledWith({ task_id: 'task-1', label_id: 'l-1' })
  })

  it('throws when supabase returns an error', async () => {
    mockSupabase.insert.mockResolvedValueOnce({ error: new Error('insert fail') })
    await expect(addLabelToTask('task-1', 'l-1')).rejects.toThrow('insert fail')
  })
})

describe('removeLabelFromTask', () => {
  beforeEach(() => vi.clearAllMocks())

  it('deletes the task_labels row matching both ids', async () => {
    mockSupabase.eq
      .mockReturnValueOnce(mockSupabase)
      .mockResolvedValueOnce({ error: null })

    await removeLabelFromTask('task-1', 'l-1')
    expect(mockSupabase.delete).toHaveBeenCalled()
    expect(mockSupabase.eq).toHaveBeenCalledWith('task_id', 'task-1')
    expect(mockSupabase.eq).toHaveBeenCalledWith('label_id', 'l-1')
  })

  it('throws when supabase returns an error', async () => {
    mockSupabase.eq
      .mockReturnValueOnce(mockSupabase)
      .mockResolvedValueOnce({ error: new Error('delete fail') })

    await expect(removeLabelFromTask('task-1', 'l-1')).rejects.toThrow('delete fail')
  })
})
