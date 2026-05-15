'use client'

import { useEffect, useRef, useState } from 'react'
import { IconCheck } from '@tabler/icons-react'
import { getSubtasks, createSubtask, toggleSubtask } from '@/lib/subtasks'
import type { Task } from '@/lib/types'

interface Props {
  parentId: string
  workspaceId: string
}

export function SubtaskList({ parentId, workspaceId }: Props) {
  const [subtasks, setSubtasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getSubtasks(parentId).then(data => {
      if (!cancelled) {
        setSubtasks(data)
        setLoading(false)
      }
    }).catch(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [parentId])

  useEffect(() => {
    if (adding) inputRef.current?.focus()
  }, [adding])

  const total = subtasks.length
  const done = subtasks.filter(s => s.status === 'done').length

  async function handleToggle(subtask: Task) {
    const nowDone = subtask.status !== 'done'
    const prev = subtasks
    setSubtasks(curr =>
      curr.map(s => s.id === subtask.id ? { ...s, status: nowDone ? 'done' : 'todo' } : s)
    )
    try {
      await toggleSubtask(subtask.id, nowDone)
    } catch {
      setSubtasks(prev)
    }
  }

  async function handleAdd() {
    const title = draft.trim()
    if (!title) {
      setAdding(false)
      setDraft('')
      return
    }
    setDraft('')
    setAdding(false)
    try {
      const created = await createSubtask(workspaceId, parentId, title)
      setSubtasks(curr => [...curr, created])
    } catch {
      // silently fail — no optimistic row added so nothing to revert
    }
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleAdd()
    if (e.key === 'Escape') {
      setAdding(false)
      setDraft('')
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-[var(--tx-3)]">Loading…</p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Progress bar */}
      {total > 0 && (
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center">
            <span className="text-xs text-[var(--tx-3)]">{done} / {total} subtasks done</span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--border-2)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-all"
              style={{ width: total > 0 ? `${(done / total) * 100}%` : '0%' }}
              role="progressbar"
              aria-valuenow={done}
              aria-valuemin={0}
              aria-valuemax={total}
            />
          </div>
        </div>
      )}

      {/* Subtask rows */}
      <ul className="flex flex-col gap-1">
        {subtasks.map(subtask => (
          <li key={subtask.id} className="flex items-center gap-2">
            <button
              onClick={() => handleToggle(subtask)}
              aria-label={subtask.status === 'done' ? 'Mark incomplete' : 'Mark complete'}
              className={[
                'w-4 h-4 rounded shrink-0 border transition-colors flex items-center justify-center',
                subtask.status === 'done'
                  ? 'bg-[var(--accent)] border-[var(--accent)]'
                  : 'border-[var(--border-2)] bg-transparent hover:border-[var(--accent)]',
              ].join(' ')}
            >
              {subtask.status === 'done' && <IconCheck size={10} color="white" />}
            </button>
            <span
              className={[
                'text-sm',
                subtask.status === 'done'
                  ? 'line-through text-[var(--tx-3)]'
                  : 'text-[var(--tx-1)]',
              ].join(' ')}
            >
              {subtask.title}
            </span>
          </li>
        ))}
      </ul>

      {/* Add subtask */}
      {adding ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={handleAdd}
          onKeyDown={handleInputKeyDown}
          placeholder="Subtask title…"
          className={[
            'h-8 px-2 rounded-[var(--radius)] text-sm',
            'border border-[var(--accent)] bg-[var(--surface)]',
            'text-[var(--tx-1)] placeholder:text-[var(--tx-3)]',
            'outline-none',
          ].join(' ')}
          aria-label="New subtask title"
        />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="text-xs text-[var(--tx-3)] hover:text-[var(--accent)] text-left transition-colors"
        >
          + Add subtask
        </button>
      )}
    </div>
  )
}
