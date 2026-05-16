'use client'

import { useEffect, useState } from 'react'
import { keyboard } from '@/lib/keyboard'
import type { Shortcut } from '@/lib/keyboard'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

function formatKeys(shortcut: Shortcut): string[] {
  const main: string[] = []
  if (shortcut.meta) main.push('⌘')
  if (shortcut.shift) main.push('⇧')
  main.push(shortcut.key.length === 1 ? shortcut.key.toUpperCase() : shortcut.key)
  const mainStr = main.join('')
  return shortcut.chord ? [shortcut.chord.toUpperCase(), mainStr] : [mainStr]
}

const kbdClass =
  'font-mono text-xs px-1.5 py-0.5 rounded border bg-zinc-800 text-zinc-100 border-zinc-600 shrink-0'

export function KeyboardReferenceSheet() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const unregister = keyboard.register({
      key: '?',
      shift: true,
      description: 'Keyboard shortcuts',
      handler: () => setOpen(true),
    })
    return unregister
  }, [])

  const shortcuts = keyboard.getAll()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
        </DialogHeader>
        <div className="mt-2 space-y-1">
          {shortcuts.map((s) => {
            const mapKey = `${s.chord ? s.chord + '>' : ''}${s.meta ? 'meta+' : ''}${s.shift ? 'shift+' : ''}${s.key}`
            const keys = formatKeys(s)
            return (
              <div key={mapKey} className="flex items-center gap-3 py-1">
                <div className="flex items-center gap-1 shrink-0">
                  {keys.map((k, i) => (
                    <kbd key={i} className={kbdClass}>{k}</kbd>
                  ))}
                </div>
                <span className="text-sm">{s.description}</span>
              </div>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
