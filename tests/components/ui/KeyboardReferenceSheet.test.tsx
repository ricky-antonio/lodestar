import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { KeyboardReferenceSheet } from '@/components/ui/KeyboardReferenceSheet'
import { keyboard } from '@/lib/keyboard'

describe('KeyboardReferenceSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    keyboard.mount()
    vi.spyOn(keyboard, 'getAll').mockReturnValue([
      { key: 'q', description: 'Quick capture', handler: vi.fn() },
    ])
  })

  afterEach(() => {
    keyboard.unmount()
    vi.restoreAllMocks()
  })

  it('dialog is hidden initially', () => {
    render(<KeyboardReferenceSheet />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('pressing ? opens the dialog', () => {
    render(<KeyboardReferenceSheet />)
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: '?', shiftKey: true, bubbles: true }),
      )
    })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Keyboard shortcuts')).toBeInTheDocument()
  })

  it('renders at least one shortcut from keyboard.getAll()', () => {
    render(<KeyboardReferenceSheet />)
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: '?', shiftKey: true, bubbles: true }),
      )
    })
    expect(screen.getByText('Quick capture')).toBeInTheDocument()
  })

  it('renders chord shortcut with two key badges', () => {
    vi.spyOn(keyboard, 'getAll').mockReturnValue([
      { key: 'd', chord: 'g', description: 'Go to Dashboard', handler: vi.fn() },
    ])
    render(<KeyboardReferenceSheet />)
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: '?', shiftKey: true, bubbles: true }),
      )
    })
    expect(screen.getByText('G')).toBeInTheDocument()
    expect(screen.getByText('D')).toBeInTheDocument()
    expect(screen.getByText('Go to Dashboard')).toBeInTheDocument()
  })

  it('pressing Escape closes the dialog', async () => {
    render(<KeyboardReferenceSheet />)
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: '?', shiftKey: true, bubbles: true }),
      )
    })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
