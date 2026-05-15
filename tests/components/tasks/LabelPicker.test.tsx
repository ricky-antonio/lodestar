import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { LabelPicker } from '@/components/tasks/LabelPicker'
import type { Label } from '@/lib/types'
import '@/tests/mocks/supabase'

const mockGetLabels = vi.fn()
const mockGetTaskLabels = vi.fn()
const mockAddLabelToTask = vi.fn()
const mockRemoveLabelFromTask = vi.fn()
const mockCreateLabel = vi.fn()

vi.mock('@/lib/labels', () => ({
  getLabels: (...args: unknown[]) => mockGetLabels(...args),
  getTaskLabels: (...args: unknown[]) => mockGetTaskLabels(...args),
  addLabelToTask: (...args: unknown[]) => mockAddLabelToTask(...args),
  removeLabelFromTask: (...args: unknown[]) => mockRemoveLabelFromTask(...args),
  createLabel: (...args: unknown[]) => mockCreateLabel(...args),
}))

function makeLabel(overrides: Partial<Label> = {}): Label {
  return {
    id: 'l-1',
    workspace_id: 'ws-1',
    name: 'Bug',
    color: '#EF4444',
    ...overrides,
  }
}

const DEFAULT_PROPS = { taskId: 'task-1', workspaceId: 'ws-1' }

describe('LabelPicker', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders current task labels as colored badges on the trigger', async () => {
    const label = makeLabel({ id: 'l-1', name: 'Bug' })
    mockGetLabels.mockResolvedValueOnce([label])
    mockGetTaskLabels.mockResolvedValueOnce([label])

    render(<LabelPicker {...DEFAULT_PROPS} />)

    await waitFor(() => expect(screen.getByText('Bug')).toBeInTheDocument())
    // The trigger button itself should show the badge
    const trigger = screen.getByRole('button', { name: 'Edit labels' })
    expect(trigger).toHaveTextContent('Bug')
  })

  it('checking an unchecked label calls addLabelToTask and reverts on failure', async () => {
    const label = makeLabel({ id: 'l-1', name: 'Bug' })
    mockGetLabels.mockResolvedValueOnce([label])
    mockGetTaskLabels.mockResolvedValueOnce([]) // not applied
    mockAddLabelToTask.mockRejectedValueOnce(new Error('db error'))

    render(<LabelPicker {...DEFAULT_PROPS} />)

    // Open the popover
    const trigger = await screen.findByRole('button', { name: 'Edit labels' })
    fireEvent.click(trigger)

    // Find the label row (unchecked, aria-pressed=false)
    const labelBtn = await screen.findByRole('button', { name: 'Bug' })
    expect(labelBtn).toHaveAttribute('aria-pressed', 'false')

    await act(async () => { fireEvent.click(labelBtn) })

    expect(mockAddLabelToTask).toHaveBeenCalledWith('task-1', 'l-1')

    // After DB failure, optimistic update reverts — aria-pressed goes back to false
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Bug' })).toHaveAttribute('aria-pressed', 'false')
    )
  })

  it('unchecking a checked label calls removeLabelFromTask and reverts on failure', async () => {
    const label = makeLabel({ id: 'l-1', name: 'Bug' })
    mockGetLabels.mockResolvedValueOnce([label])
    mockGetTaskLabels.mockResolvedValueOnce([label]) // applied
    mockRemoveLabelFromTask.mockRejectedValueOnce(new Error('db error'))

    render(<LabelPicker {...DEFAULT_PROPS} />)

    // Open the popover
    const trigger = await screen.findByRole('button', { name: 'Edit labels' })
    await waitFor(() => expect(trigger).toHaveTextContent('Bug'))
    fireEvent.click(trigger)

    // Find the label row (checked, aria-pressed=true)
    const labelBtn = await screen.findByRole('button', { name: 'Bug' })
    expect(labelBtn).toHaveAttribute('aria-pressed', 'true')

    await act(async () => { fireEvent.click(labelBtn) })

    expect(mockRemoveLabelFromTask).toHaveBeenCalledWith('task-1', 'l-1')

    // After DB failure, reverts — aria-pressed goes back to true
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Bug' })).toHaveAttribute('aria-pressed', 'true')
    )
  })

  it('creating a new label calls createLabel and adds it to the list', async () => {
    mockGetLabels.mockResolvedValueOnce([])
    mockGetTaskLabels.mockResolvedValueOnce([])
    const newLabel = makeLabel({ id: 'l-new', name: 'Feature', color: '#00B6EC' })
    mockCreateLabel.mockResolvedValueOnce(newLabel)

    render(<LabelPicker {...DEFAULT_PROPS} />)

    const trigger = await screen.findByRole('button', { name: 'Edit labels' })
    fireEvent.click(trigger)

    const newLabelBtn = await screen.findByText('New label')
    fireEvent.click(newLabelBtn)

    const input = await screen.findByRole('textbox', { name: 'New label name' })
    fireEvent.change(input, { target: { value: 'Feature' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    await waitFor(() =>
      expect(mockCreateLabel).toHaveBeenCalledWith('ws-1', 'Feature', expect.any(String))
    )
    // New label appears in the list
    await waitFor(() => expect(screen.getByText('Feature')).toBeInTheDocument())
  })
})
