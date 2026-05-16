import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { FilterBar } from '@/components/filters/FilterBar'
import type { FilterState, SavedFilter } from '@/lib/types'

const mockGetLabels = vi.fn().mockResolvedValue([
  { id: 'label-1', workspace_id: 'ws-1', name: 'Bug', color: '#EF4444' },
  { id: 'label-2', workspace_id: 'ws-1', name: 'Feature', color: '#00B6EC' },
])

const mockGetSavedFilters = vi.fn().mockResolvedValue([])
const mockCreateSavedFilter = vi.fn()
const mockDeleteSavedFilter = vi.fn()

vi.mock('@/lib/labels', () => ({ getLabels: (...args: unknown[]) => mockGetLabels(...args) }))
vi.mock('@/lib/saved-filters', () => ({
  getSavedFilters: (...args: unknown[]) => mockGetSavedFilters(...args),
  createSavedFilter: (...args: unknown[]) => mockCreateSavedFilter(...args),
  deleteSavedFilter: (...args: unknown[]) => mockDeleteSavedFilter(...args),
}))

vi.mock('@/lib/supabase/client', () => ({ createClient: () => ({}) }))

const defaultFilters: FilterState = {}

function renderBar(filters: FilterState = defaultFilters, onChange = vi.fn(), userId?: string) {
  return {
    onChange,
    ...render(
      <FilterBar
        filters={filters}
        onChange={onChange}
        workspaceId="ws-1"
        userId={userId}
      />,
    ),
  }
}

describe('FilterBar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSavedFilters.mockResolvedValue([])
    mockGetLabels.mockResolvedValue([
      { id: 'label-1', workspace_id: 'ws-1', name: 'Bug', color: '#EF4444' },
      { id: 'label-2', workspace_id: 'ws-1', name: 'Feature', color: '#00B6EC' },
    ])
  })

  it('renders search input', () => {
    renderBar()
    expect(screen.getByRole('textbox', { name: /search tasks/i })).toBeInTheDocument()
  })

  it('typing in search calls onChange with updated search', () => {
    const { onChange } = renderBar()
    fireEvent.change(screen.getByRole('textbox', { name: /search tasks/i }), {
      target: { value: 'meeting' },
    })
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ search: 'meeting' }))
  })

  it('clearing search calls onChange with search undefined', () => {
    const { onChange } = renderBar({ search: 'meeting' })
    fireEvent.click(screen.getByRole('button', { name: /clear search/i }))
    expect(onChange).toHaveBeenCalledWith(expect.not.objectContaining({ search: expect.anything() }))
  })

  it('selecting urgent priority calls onChange with priority: [urgent]', () => {
    const { onChange } = renderBar()
    fireEvent.click(screen.getByRole('button', { name: /^filter$/i }))
    const urgentCheckbox = screen.getByRole('checkbox', { name: /urgent/i })
    fireEvent.click(urgentCheckbox)
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ priority: ['urgent'] }))
  })

  it('removing a priority chip removes it from filters', () => {
    const { onChange } = renderBar({ priority: ['urgent'] })
    fireEvent.click(screen.getByRole('button', { name: /remove priority: urgent filter/i }))
    const call = onChange.mock.calls[0][0] as FilterState
    expect(call.priority).toBeUndefined()
  })

  it('Clear all button resets filters to empty object', () => {
    const { onChange } = renderBar({ priority: ['high'], search: 'foo' })
    fireEvent.click(screen.getByRole('button', { name: /clear all/i }))
    expect(onChange).toHaveBeenCalledWith({})
  })

  // ─── Status filter ────────────────────────────────────────────────────────────

  it('selecting "To do" status calls onChange with status: [todo]', () => {
    const { onChange } = renderBar()
    fireEvent.click(screen.getByRole('button', { name: /^filter$/i }))
    const todoCheckbox = screen.getByRole('checkbox', { name: /to do/i })
    fireEvent.click(todoCheckbox)
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ status: ['todo'] }))
  })

  it('selecting multiple statuses accumulates them', () => {
    const { onChange } = renderBar({ status: ['todo'] })
    fireEvent.click(screen.getByRole('button', { name: /^filter$/i }))
    const doneCheckbox = screen.getByRole('checkbox', { name: /^done$/i })
    fireEvent.click(doneCheckbox)
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ status: ['todo', 'done'] }))
  })

  it('removing a status chip removes it from filters', () => {
    const { onChange } = renderBar({ status: ['todo'] })
    fireEvent.click(screen.getByRole('button', { name: /remove status: to do filter/i }))
    const call = onChange.mock.calls[0][0] as FilterState
    expect(call.status).toBeUndefined()
  })

  // ─── Due date filter ──────────────────────────────────────────────────────────

  it('clicking "Today" in Due date popover calls onChange with today\'s date range', () => {
    const { onChange } = renderBar()
    fireEvent.click(screen.getByRole('button', { name: /due date/i }))
    fireEvent.click(screen.getByText('Today'))
    const call = onChange.mock.calls[0][0] as FilterState
    expect(call.due_after).toBeTruthy()
    expect(call.due_before).toEqual(call.due_after)
  })

  it('clicking "This week" in Due date popover calls onChange with due_after and due_before', () => {
    const { onChange } = renderBar()
    fireEvent.click(screen.getByRole('button', { name: /due date/i }))
    fireEvent.click(screen.getByText('This week'))
    const call = onChange.mock.calls[0][0] as FilterState
    // due_after = today, due_before = end of week (may equal today on Saturdays)
    expect(call.due_after).toBeTruthy()
    expect(call.due_before).toBeTruthy()
  })

  it('clicking "Overdue" in Due date popover sets due_before to yesterday', () => {
    const { onChange } = renderBar()
    fireEvent.click(screen.getByRole('button', { name: /due date/i }))
    fireEvent.click(screen.getByText('Overdue'))
    const call = onChange.mock.calls[0][0] as FilterState
    expect(call.due_before).toBeTruthy()
    expect(call.due_after).toBeUndefined()
  })

  it('removing the due date chip clears the due date filter', () => {
    const today = new Date()
    const ymd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const { onChange } = renderBar({ due_after: ymd, due_before: ymd })
    fireEvent.click(screen.getByRole('button', { name: /remove due: today filter/i }))
    const call = onChange.mock.calls[0][0] as FilterState
    expect(call.due_before).toBeUndefined()
    expect(call.due_after).toBeUndefined()
  })

  // ─── Label filter ─────────────────────────────────────────────────────────────

  it('checking a label in the Label popover calls onChange with label_ids', async () => {
    const { onChange } = renderBar()
    fireEvent.click(screen.getByRole('button', { name: /^label$/i }))
    await waitFor(() => expect(screen.getByText('Bug')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('checkbox', { name: /bug/i }))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ label_ids: ['label-1'] }))
  })

  it('unchecking a label removes it from label_ids', async () => {
    const { onChange } = renderBar({ label_ids: ['label-1'] })
    fireEvent.click(screen.getByRole('button', { name: /^label$/i }))
    await waitFor(() => expect(screen.getByText('Bug')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('checkbox', { name: /bug/i }))
    const call = onChange.mock.calls[0][0] as FilterState
    expect(call.label_ids).toBeUndefined()
  })

  it('removing a label chip clears that label from filters', async () => {
    const { onChange } = renderBar({ label_ids: ['label-1'] })
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /remove label: bug filter/i })).toBeInTheDocument()
    )
    fireEvent.click(screen.getByRole('button', { name: /remove label: bug filter/i }))
    const call = onChange.mock.calls[0][0] as FilterState
    expect(call.label_ids).toBeUndefined()
  })

  // ─── Saved filters ────────────────────────────────────────────────────────

  it('Saved button is not rendered without userId', () => {
    renderBar()
    expect(screen.queryByRole('button', { name: /saved filters/i })).not.toBeInTheDocument()
  })

  it('Saved button is rendered when userId is provided', async () => {
    renderBar({}, vi.fn(), 'user-1')
    expect(screen.getByRole('button', { name: /saved filters/i })).toBeInTheDocument()
  })

  it('shows empty state message when no saved filters and no active filters', async () => {
    mockGetSavedFilters.mockResolvedValue([])
    renderBar({}, vi.fn(), 'user-1')
    fireEvent.click(screen.getByRole('button', { name: /saved filters/i }))
    await waitFor(() => {
      expect(screen.getByText(/no saved filters yet/i)).toBeInTheDocument()
    })
  })

  it('shows save input when filters are active', async () => {
    renderBar({ priority: ['high'] }, vi.fn(), 'user-1')
    fireEvent.click(screen.getByRole('button', { name: /saved filters/i }))
    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /filter name/i })).toBeInTheDocument()
    })
  })

  it('saving a filter calls createSavedFilter and adds it to the list', async () => {
    const newFilter: SavedFilter = {
      id: 'sf-1',
      workspace_id: 'ws-1',
      user_id: 'user-1',
      name: 'High priority',
      filters: { priority: ['high'] },
      created_at: '2026-01-01T00:00:00Z',
    }
    mockCreateSavedFilter.mockResolvedValueOnce(newFilter)

    renderBar({ priority: ['high'] }, vi.fn(), 'user-1')
    fireEvent.click(screen.getByRole('button', { name: /saved filters/i }))

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /filter name/i })).toBeInTheDocument()
    })

    fireEvent.change(screen.getByRole('textbox', { name: /filter name/i }), {
      target: { value: 'High priority' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))

    await waitFor(() => {
      expect(mockCreateSavedFilter).toHaveBeenCalledWith('ws-1', 'user-1', 'High priority', { priority: ['high'] })
      expect(screen.getByText('High priority')).toBeInTheDocument()
    })
  })

  it('applying a saved filter calls onChange with its filter state', async () => {
    const savedFilter: SavedFilter = {
      id: 'sf-1',
      workspace_id: 'ws-1',
      user_id: 'user-1',
      name: 'My filter',
      filters: { status: ['todo'] },
      created_at: '2026-01-01T00:00:00Z',
    }
    mockGetSavedFilters.mockResolvedValue([savedFilter])

    const onChange = vi.fn()
    renderBar({}, onChange, 'user-1')
    fireEvent.click(screen.getByRole('button', { name: /saved filters/i }))

    await waitFor(() => {
      expect(screen.getByText('My filter')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('My filter'))
    expect(onChange).toHaveBeenCalledWith({ status: ['todo'] })
  })

  it('deleting a saved filter calls deleteSavedFilter', async () => {
    const savedFilter: SavedFilter = {
      id: 'sf-1',
      workspace_id: 'ws-1',
      user_id: 'user-1',
      name: 'My filter',
      filters: { status: ['todo'] },
      created_at: '2026-01-01T00:00:00Z',
    }
    mockGetSavedFilters.mockResolvedValue([savedFilter])
    mockDeleteSavedFilter.mockResolvedValue(undefined)

    renderBar({}, vi.fn(), 'user-1')
    fireEvent.click(screen.getByRole('button', { name: /saved filters/i }))

    await waitFor(() => {
      expect(screen.getByText('My filter')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /delete saved filter my filter/i }))
    expect(mockDeleteSavedFilter).toHaveBeenCalledWith('sf-1')
    await waitFor(() => {
      expect(screen.queryByText('My filter')).not.toBeInTheDocument()
    })
  })
})
