import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { UIProvider, useUI } from '@/lib/context/UIContext'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <UIProvider>{children}</UIProvider>
)

describe('UIContext', () => {
  it('has sensible initial state', () => {
    const { result } = renderHook(() => useUI(), { wrapper })
    expect(result.current.activeView).toBe('board')
    expect(result.current.detailTaskId).toBeNull()
    expect(result.current.commandPaletteOpen).toBe(false)
    expect(result.current.undoStack).toHaveLength(0)
    expect(result.current.sidebarCollapsed).toBe(false)
  })

  it('setActiveView changes the active view', () => {
    const { result } = renderHook(() => useUI(), { wrapper })
    act(() => result.current.setActiveView('board'))
    expect(result.current.activeView).toBe('board')
  })

  it('openDetail and closeDetail manage detailTaskId', () => {
    const { result } = renderHook(() => useUI(), { wrapper })
    act(() => result.current.openDetail('t-123'))
    expect(result.current.detailTaskId).toBe('t-123')
    act(() => result.current.closeDetail())
    expect(result.current.detailTaskId).toBeNull()
  })

  it('setCommandPaletteOpen toggles the palette', () => {
    const { result } = renderHook(() => useUI(), { wrapper })
    act(() => result.current.setCommandPaletteOpen(true))
    expect(result.current.commandPaletteOpen).toBe(true)
    act(() => result.current.setCommandPaletteOpen(false))
    expect(result.current.commandPaletteOpen).toBe(false)
  })

  it('pushUndo adds items and dismissUndo removes by label', () => {
    const { result } = renderHook(() => useUI(), { wrapper })
    const undoFn = vi.fn()
    act(() => result.current.pushUndo({ label: 'Archived "Fix bug"', undo: undoFn }))
    expect(result.current.undoStack).toHaveLength(1)
    act(() => result.current.dismissUndo('Archived "Fix bug"'))
    expect(result.current.undoStack).toHaveLength(0)
  })

  it('sidebarCollapsed can be toggled', () => {
    const { result } = renderHook(() => useUI(), { wrapper })
    act(() => result.current.setSidebarCollapsed(true))
    expect(result.current.sidebarCollapsed).toBe(true)
  })

  it('throws when useUI is used outside UIProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const plainWrapper = ({ children }: { children: React.ReactNode }) => <>{children}</>
    expect(() => renderHook(() => useUI(), { wrapper: plainWrapper })).toThrow(
      'useUI must be used within UIProvider'
    )
    spy.mockRestore()
  })
})
