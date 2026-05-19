'use client'

import { useEffect, useRef, useState } from 'react'

export type SlashCommand = {
  id: 'ai' | 'date' | 'task'
  label: string
  description: string
}

const ALL_COMMANDS: SlashCommand[] = [
  { id: 'ai',   label: '/ai',   description: 'Continue writing with AI' },
  { id: 'date', label: '/date', description: 'Insert a due date' },
  { id: 'task', label: '/task', description: 'Link a related task' },
]

interface Props {
  open: boolean
  query: string
  position: { top: number; left: number }
  onSelect: (command: SlashCommand) => void
  onClose: () => void
}

export function SlashCommandMenu({ open, query, position, onSelect, onClose }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const filtered = ALL_COMMANDS.filter(cmd => {
    const q = query.toLowerCase()
    return cmd.label.toLowerCase().includes(q) || cmd.description.toLowerCase().includes(q)
  })

  // Reset selection to top when query changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // Stable refs so the window listener closure doesn't go stale
  const filteredRef = useRef(filtered)
  filteredRef.current = filtered
  const selectedIndexRef = useRef(selectedIndex)
  selectedIndexRef.current = selectedIndex

  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'ArrowDown') {
        setSelectedIndex(i => Math.min(i + 1, filteredRef.current.length - 1))
      } else if (e.key === 'ArrowUp') {
        setSelectedIndex(i => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        const cmd = filteredRef.current[selectedIndexRef.current]
        if (cmd) onSelect(cmd)
      } else if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onSelect, onClose])

  if (!open) return null

  return (
    <div
      role="listbox"
      style={{ position: 'fixed', top: position.top, left: position.left, zIndex: 60, minWidth: 220 }}
      className={[
        'rounded-[var(--radius-lg)] py-1',
        'bg-[var(--surface)] border border-[var(--border)]',
        'shadow-[0_4px_16px_rgba(0,0,0,0.12)]',
      ].join(' ')}
    >
      {filtered.length === 0 ? (
        <p className="px-3 py-2 text-sm text-[var(--tx-3)]">No commands</p>
      ) : (
        filtered.map((cmd, i) => (
          <button
            key={cmd.id}
            role="option"
            aria-selected={i === selectedIndex}
            onClick={() => onSelect(cmd)}
            className={[
              'flex flex-col items-start w-full px-3 py-2 text-left transition-colors',
              i === selectedIndex
                ? 'bg-[var(--accent-bg)]'
                : 'hover:bg-[var(--surface-2)]',
            ].join(' ')}
          >
            <span className="text-sm font-medium text-[var(--accent)]">{cmd.label}</span>
            <span className="text-xs text-[var(--tx-3)]">{cmd.description}</span>
          </button>
        ))
      )}
    </div>
  )
}
