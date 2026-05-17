export type ShortcutHandler = (e: KeyboardEvent) => void

export interface Shortcut {
  key: string
  meta?: boolean
  shift?: boolean
  alt?: boolean
  chord?: string  // key that must be pressed immediately before this one
  description: string
  handler: ShortcutHandler
}

const CHORD_TIMEOUT_MS = 1500

export class KeyboardManager {
  private shortcuts: Map<string, Shortcut> = new Map()
  private pendingChord: string | null = null
  private chordTimer: ReturnType<typeof setTimeout> | null = null

  register(shortcut: Shortcut): () => void {
    const mapKey = this.buildMapKey(shortcut)
    this.shortcuts.set(mapKey, shortcut)
    return () => this.shortcuts.delete(mapKey)
  }

  private buildMapKey(shortcut: Shortcut): string {
    const suffix = `${shortcut.alt ? 'alt+' : ''}${shortcut.meta ? 'meta+' : ''}${shortcut.shift ? 'shift+' : ''}${shortcut.key}`
    return shortcut.chord ? `${shortcut.chord}>${suffix}` : suffix
  }

  private listener = (e: KeyboardEvent) => {
    const target = e.target as Element
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      (target as HTMLElement).isContentEditable
    ) return

    const rawKey = `${e.altKey ? 'alt+' : ''}${(e.metaKey || e.ctrlKey) ? 'meta+' : ''}${e.shiftKey ? 'shift+' : ''}${e.key}`

    // Try chord completion first
    if (this.pendingChord) {
      const chordKey = `${this.pendingChord}>${rawKey}`
      const shortcut = this.shortcuts.get(chordKey)
      this.clearChord()
      if (shortcut) {
        e.preventDefault()
        shortcut.handler(e)
        return
      }
    }

    // Try direct shortcut
    const direct = this.shortcuts.get(rawKey)
    if (direct) {
      e.preventDefault()
      direct.handler(e)
      return
    }

    // Check if this key starts a chord sequence
    const startsChord = Array.from(this.shortcuts.values()).some(s => s.chord === e.key)
    if (startsChord) {
      this.pendingChord = e.key
      this.chordTimer = setTimeout(() => this.clearChord(), CHORD_TIMEOUT_MS)
    }
  }

  private clearChord(): void {
    if (this.chordTimer !== null) {
      clearTimeout(this.chordTimer)
      this.chordTimer = null
    }
    this.pendingChord = null
  }

  mount(): void {
    window.addEventListener('keydown', this.listener)
  }

  unmount(): void {
    window.removeEventListener('keydown', this.listener)
    this.clearChord()
  }

  getAll(): Shortcut[] {
    return Array.from(this.shortcuts.values())
  }
}

export const keyboard = new KeyboardManager()
