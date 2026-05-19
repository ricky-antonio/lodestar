'use client'

import { useRef, useState } from 'react'
import { SlashCommandMenu, type SlashCommand } from './SlashCommandMenu'

interface Props {
  value: string
  onChange: (value: string) => void
  onCommand: (command: SlashCommand, triggerIndex: number) => void
  onBlur?: (currentValue: string) => void
  placeholder?: string
  rows?: number
  className?: string
  'aria-label'?: string
}

export function SlashTextarea({
  value,
  onChange,
  onCommand,
  onBlur,
  placeholder,
  rows = 4,
  className,
  'aria-label': ariaLabel,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [triggerIndex, setTriggerIndex] = useState(0)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (menuOpen) {
      if (e.key === 'Escape') {
        // Close menu only; stop propagation so the panel Escape handler doesn't also fire
        setMenuOpen(false)
        e.stopPropagation()
        return
      }
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Enter') {
        // Prevent cursor movement / newline; event still bubbles to the window
        // listener in SlashCommandMenu which handles navigation and selection
        e.preventDefault()
        return
      }
    }

    if (!menuOpen && e.key === '/') {
      const pos = e.currentTarget.selectionStart ?? 0
      setTriggerIndex(pos)
      setQuery('')
      const rect = containerRef.current?.getBoundingClientRect()
      if (rect) {
        setMenuPosition({ top: rect.bottom + 4, left: rect.left })
      }
      setMenuOpen(true)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const newValue = e.target.value
    onChange(newValue)

    if (!menuOpen) return

    const cursor = e.target.selectionStart ?? newValue.length
    // Close if cursor moved before the slash
    if (cursor <= triggerIndex) {
      setMenuOpen(false)
      return
    }
    // Query is the text between '/' and cursor
    const q = newValue.slice(triggerIndex + 1, cursor)
    // Space or newline after slash means user abandoned the command
    if (q.includes(' ') || q.includes('\n')) {
      setMenuOpen(false)
      return
    }
    setQuery(q)
  }

  function handleBlur(e: React.FocusEvent<HTMLTextAreaElement>) {
    const currentValue = e.target.value
    // Delay close so a menu item click registers before the menu disappears
    setTimeout(() => setMenuOpen(false), 150)
    onBlur?.(currentValue)
  }

  function handleSelect(command: SlashCommand) {
    // Strip '/' + query from the value, then notify parent
    const endIndex = triggerIndex + 1 + query.length
    const newValue = value.slice(0, triggerIndex) + value.slice(endIndex)
    onChange(newValue)
    setMenuOpen(false)
    onCommand(command, triggerIndex)
    textareaRef.current?.focus()
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={placeholder}
        rows={rows}
        className={['w-full', className].filter(Boolean).join(' ')}
        aria-label={ariaLabel}
      />
      <SlashCommandMenu
        open={menuOpen}
        query={query}
        position={menuPosition}
        onSelect={handleSelect}
        onClose={() => setMenuOpen(false)}
      />
    </div>
  )
}
