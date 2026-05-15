import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { useEffect } from 'react'
import { Toast } from '@/components/ui/Toast'
import { UIProvider, useUI, type UndoItem } from '@/lib/context/UIContext'

function Pusher({ item }: { item: UndoItem }) {
  const { pushUndo } = useUI()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { pushUndo(item) }, [])
  return null
}

function TestApp({ item }: { item: UndoItem }) {
  return (
    <UIProvider>
      <Pusher item={item} />
      <Toast />
    </UIProvider>
  )
}

function EmptyApp() {
  return (
    <UIProvider>
      <Toast />
    </UIProvider>
  )
}

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders nothing when undoStack is empty', () => {
    render(<EmptyApp />)
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('renders a toast when undoStack has an item', () => {
    const item: UndoItem = { label: 'Task archived', undo: vi.fn() }
    render(<TestApp item={item} />)
    expect(screen.getByText('Task archived')).toBeInTheDocument()
  })

  it('displays message instead of label when message is provided', () => {
    const item: UndoItem = { label: 'label', message: 'Task deleted', undo: vi.fn() }
    render(<TestApp item={item} />)
    expect(screen.getByText('Task deleted')).toBeInTheDocument()
    expect(screen.queryByText('label')).not.toBeInTheDocument()
  })

  it('clicking × dismisses the toast', () => {
    const item: UndoItem = { label: 'Task archived', undo: vi.fn() }
    render(<TestApp item={item} />)
    act(() => { fireEvent.click(screen.getByRole('button', { name: 'Dismiss' })) })
    expect(screen.queryByText('Task archived')).not.toBeInTheDocument()
  })

  it('clicking Undo calls item.undo then dismisses', () => {
    const undoFn = vi.fn()
    const item: UndoItem = { label: 'Task archived', undo: undoFn }
    render(<TestApp item={item} />)
    act(() => { fireEvent.click(screen.getByRole('button', { name: 'Undo' })) })
    expect(undoFn).toHaveBeenCalledOnce()
    expect(screen.queryByText('Task archived')).not.toBeInTheDocument()
  })

  it('auto-dismisses after 5000ms', async () => {
    const item: UndoItem = { label: 'Auto dismiss toast', undo: vi.fn() }
    render(<TestApp item={item} />)
    expect(screen.getByText('Auto dismiss toast')).toBeInTheDocument()
    await act(async () => {
      vi.advanceTimersByTime(5000)
    })
    expect(screen.queryByText('Auto dismiss toast')).not.toBeInTheDocument()
  })

  it('does not render Undo button when canUndo is false', () => {
    const item: UndoItem = { label: 'Task deleted', undo: vi.fn(), canUndo: false }
    render(<TestApp item={item} />)
    expect(screen.getByText('Task deleted')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument()
  })
})
