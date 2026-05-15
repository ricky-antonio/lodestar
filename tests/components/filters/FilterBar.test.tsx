import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FilterBar } from '@/components/filters/FilterBar'
import type { FilterState } from '@/lib/types'

vi.mock('@/lib/labels', () => ({
  getLabels: vi.fn().mockResolvedValue([
    { id: 'label-1', workspace_id: 'ws-1', name: 'Bug', color: '#EF4444' },
    { id: 'label-2', workspace_id: 'ws-1', name: 'Feature', color: '#00B6EC' },
  ]),
}))

vi.mock('@/lib/supabase/client', () => ({ createClient: () => ({}) }))

const defaultFilters: FilterState = {}

function renderBar(filters: FilterState = defaultFilters, onChange = vi.fn()) {
  return { onChange, ...render(<FilterBar filters={filters} onChange={onChange} workspaceId="ws-1" />) }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('FilterBar', () => {
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
    // Open the Filter dropdown
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
})
