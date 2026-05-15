'use client'

import { useEffect, useRef, useState } from 'react'
import { keyboard } from '@/lib/keyboard'
import { useTasks } from '@/lib/context/TasksContext'

export function QuickCapture() {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const { addTask } = useTasks()

  useEffect(() => {
    keyboard.mount()
    const unregister = keyboard.register({
      key: 'q',
      description: 'Quick capture',
      handler: () => setOpen(true),
    })
    return () => {
      unregister()
      keyboard.unmount()
    }
  }, [])

  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
    } else {
      setTitle('')
    }
  }, [open])

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && title.trim()) {
      addTask({ title: title.trim(), project_id: null })
      setOpen(false)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center"
      style={{ paddingTop: '20vh', background: 'rgba(6, 20, 25, 0.6)' }}
      onClick={() => setOpen(false)}
      aria-modal="true"
      role="dialog"
      aria-label="Quick capture"
    >
      <div
        className="relative w-full max-w-lg mx-4 rounded-xl overflow-hidden"
        style={{
          background: 'var(--surface)',
          border: '0.5px solid var(--border-2)',
          boxShadow: '0 8px 24px rgba(0,182,236,0.15)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Capture a task…"
          className="w-full px-4 py-3 text-sm bg-transparent outline-none"
          style={{ color: 'var(--tx-1)' }}
          aria-label="Task title"
        />
      </div>
    </div>
  )
}
