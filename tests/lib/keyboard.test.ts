import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { KeyboardManager } from '@/lib/keyboard'

describe('KeyboardManager', () => {
  let manager: KeyboardManager

  beforeEach(() => {
    vi.clearAllMocks()
    manager = new KeyboardManager()
    manager.mount()
  })

  afterEach(() => {
    manager.unmount()
  })

  it('register returns an unregister function that removes the shortcut', () => {
    const handler = vi.fn()
    const unregister = manager.register({ key: 'a', description: 'test', handler })

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }))
    expect(handler).toHaveBeenCalledTimes(1)

    unregister()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }))
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('listener calls the handler for the matching key', () => {
    const handler = vi.fn()
    manager.register({ key: 'q', description: 'Quick capture', handler })

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'q', bubbles: true }))
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('listener ignores events when target is an input', () => {
    const handler = vi.fn()
    manager.register({ key: 'q', description: 'test', handler })

    const input = document.createElement('input')
    document.body.appendChild(input)
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'q', bubbles: true }))
    expect(handler).not.toHaveBeenCalled()
    document.body.removeChild(input)
  })

  it('listener ignores events when target is a textarea', () => {
    const handler = vi.fn()
    manager.register({ key: 'q', description: 'test', handler })

    const textarea = document.createElement('textarea')
    document.body.appendChild(textarea)
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'q', bubbles: true }))
    expect(handler).not.toHaveBeenCalled()
    document.body.removeChild(textarea)
  })

  it('getAll returns all registered shortcuts', () => {
    manager.register({ key: 'a', description: 'A shortcut', handler: vi.fn() })
    manager.register({ key: 'b', description: 'B shortcut', handler: vi.fn() })

    const all = manager.getAll()
    expect(all).toHaveLength(2)
    expect(all.map(s => s.key)).toContain('a')
    expect(all.map(s => s.key)).toContain('b')
  })
})
