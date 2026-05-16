import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { AppShortcuts } from '@/components/ui/AppShortcuts'
import { keyboard } from '@/lib/keyboard'

const mockPush = vi.fn()
const mockSetActiveView = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('@/lib/context/UIContext', () => ({
  useUI: () => ({ setActiveView: mockSetActiveView }),
}))

describe('AppShortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    keyboard.mount()
  })

  afterEach(() => {
    keyboard.unmount()
    vi.restoreAllMocks()
  })

  it('renders nothing', () => {
    const { container } = render(<AppShortcuts />)
    expect(container.firstChild).toBeNull()
  })

  it('G→D navigates to /dashboard', () => {
    render(<AppShortcuts />)
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'g', bubbles: true }))
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', bubbles: true }))
    })
    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })

  it('G→M navigates to /my-day', () => {
    render(<AppShortcuts />)
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'g', bubbles: true }))
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'm', bubbles: true }))
    })
    expect(mockPush).toHaveBeenCalledWith('/my-day')
  })

  it('G→T navigates to /tasks', () => {
    render(<AppShortcuts />)
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'g', bubbles: true }))
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 't', bubbles: true }))
    })
    expect(mockPush).toHaveBeenCalledWith('/tasks')
  })

  it('B sets active view to board', () => {
    render(<AppShortcuts />)
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', bubbles: true }))
    })
    expect(mockSetActiveView).toHaveBeenCalledWith('board')
  })

  it('L sets active view to list', () => {
    render(<AppShortcuts />)
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'l', bubbles: true }))
    })
    expect(mockSetActiveView).toHaveBeenCalledWith('list')
  })

  it('/ focuses the search input', () => {
    const input = document.createElement('input')
    input.setAttribute('data-search-input', '')
    document.body.appendChild(input)
    const focusSpy = vi.spyOn(input, 'focus')

    render(<AppShortcuts />)
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '/', bubbles: true }))
    })

    expect(focusSpy).toHaveBeenCalled()
    document.body.removeChild(input)
  })
})
