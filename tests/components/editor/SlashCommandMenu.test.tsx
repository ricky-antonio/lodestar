import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { SlashCommandMenu } from '@/components/editor/SlashCommandMenu'
import type { SlashCommand } from '@/components/editor/SlashCommandMenu'

const DEFAULT_POSITION = { top: 100, left: 100 }

describe('SlashCommandMenu', () => {
  const onSelect = vi.fn()
  const onClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all three commands when query is empty', () => {
    render(
      <SlashCommandMenu
        open
        query=""
        position={DEFAULT_POSITION}
        onSelect={onSelect}
        onClose={onClose}
      />
    )
    expect(screen.getByText('/ai')).toBeInTheDocument()
    expect(screen.getByText('/date')).toBeInTheDocument()
    expect(screen.getByText('/task')).toBeInTheDocument()
  })

  it('filters to matching commands as query changes', () => {
    const { rerender } = render(
      <SlashCommandMenu
        open
        query="ai"
        position={DEFAULT_POSITION}
        onSelect={onSelect}
        onClose={onClose}
      />
    )
    expect(screen.getByText('/ai')).toBeInTheDocument()
    expect(screen.queryByText('/date')).not.toBeInTheDocument()
    expect(screen.queryByText('/task')).not.toBeInTheDocument()

    rerender(
      <SlashCommandMenu
        open
        query="da"
        position={DEFAULT_POSITION}
        onSelect={onSelect}
        onClose={onClose}
      />
    )
    expect(screen.queryByText('/ai')).not.toBeInTheDocument()
    expect(screen.getByText('/date')).toBeInTheDocument()
  })

  it('shows "No commands" when nothing matches the query', () => {
    render(
      <SlashCommandMenu
        open
        query="xyz"
        position={DEFAULT_POSITION}
        onSelect={onSelect}
        onClose={onClose}
      />
    )
    expect(screen.getByText('No commands')).toBeInTheDocument()
  })

  it('ArrowDown moves selection; Enter calls onSelect with the newly selected command', () => {
    render(
      <SlashCommandMenu
        open
        query=""
        position={DEFAULT_POSITION}
        onSelect={onSelect}
        onClose={onClose}
      />
    )
    // Default selection is index 0 (/ai); ArrowDown moves to index 1 (/date)
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    })
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    })
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining<Partial<SlashCommand>>({ id: 'date' })
    )
  })

  it('ArrowUp does not go below index 0', () => {
    render(
      <SlashCommandMenu
        open
        query=""
        position={DEFAULT_POSITION}
        onSelect={onSelect}
        onClose={onClose}
      />
    )
    // Already at index 0; ArrowUp should stay there; Enter should select /ai
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
    })
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    })
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining<Partial<SlashCommand>>({ id: 'ai' })
    )
  })

  it('Escape calls onClose without selecting', () => {
    render(
      <SlashCommandMenu
        open
        query=""
        position={DEFAULT_POSITION}
        onSelect={onSelect}
        onClose={onClose}
      />
    )
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    })
    expect(onClose).toHaveBeenCalledOnce()
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('clicking a command calls onSelect', () => {
    render(
      <SlashCommandMenu
        open
        query=""
        position={DEFAULT_POSITION}
        onSelect={onSelect}
        onClose={onClose}
      />
    )
    fireEvent.click(screen.getByRole('option', { name: /\/task/i }))
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining<Partial<SlashCommand>>({ id: 'task' })
    )
  })

  it('does not render when open is false', () => {
    render(
      <SlashCommandMenu
        open={false}
        query=""
        position={DEFAULT_POSITION}
        onSelect={onSelect}
        onClose={onClose}
      />
    )
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('does not add window listener when closed', () => {
    render(
      <SlashCommandMenu
        open={false}
        query=""
        position={DEFAULT_POSITION}
        onSelect={onSelect}
        onClose={onClose}
      />
    )
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    })
    expect(onClose).not.toHaveBeenCalled()
  })
})
