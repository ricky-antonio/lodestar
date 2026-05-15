export type ShortcutHandler = (e: KeyboardEvent) => void

export interface Shortcut {
  key: string
  meta?: boolean
  shift?: boolean
  description: string
  handler: ShortcutHandler
}

export class KeyboardManager {
  private shortcuts: Map<string, Shortcut> = new Map()

  register(shortcut: Shortcut): () => void {
    const mapKey = `${shortcut.meta ? 'meta+' : ''}${shortcut.shift ? 'shift+' : ''}${shortcut.key}`
    this.shortcuts.set(mapKey, shortcut)
    return () => this.shortcuts.delete(mapKey)
  }

  private listener = (e: KeyboardEvent) => {
    const target = e.target as Element
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      (target as HTMLElement).isContentEditable
    ) return

    const mapKey = `${(e.metaKey || e.ctrlKey) ? 'meta+' : ''}${e.shiftKey ? 'shift+' : ''}${e.key}`
    const shortcut = this.shortcuts.get(mapKey)
    if (shortcut) shortcut.handler(e)
  }

  mount(): void {
    window.addEventListener('keydown', this.listener)
  }

  unmount(): void {
    window.removeEventListener('keydown', this.listener)
  }

  getAll(): Shortcut[] {
    return Array.from(this.shortcuts.values())
  }
}

export const keyboard = new KeyboardManager()
