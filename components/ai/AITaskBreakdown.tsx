'use client'

import { useEffect, useState } from 'react'
import { IconLoader2 } from '@tabler/icons-react'
import { createSubtask } from '@/lib/subtasks'
import { useUI } from '@/lib/context/UIContext'
import type { AISubtaskSuggestion } from '@/lib/ai/tasks'

interface Props {
  taskId: string
  workspaceId: string
  onDone: () => void
  onCancel: () => void
}

export function AITaskBreakdown({ taskId, workspaceId, onDone, onCancel }: Props) {
  const { pushUndo } = useUI()
  const [loading, setLoading] = useState(true)
  const [suggestions, setSuggestions] = useState<AISubtaskSuggestion[]>([])
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    fetch('/api/ai/breakdown', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId }),
    })
      .then(async res => {
        const json = await res.json()
        if (!res.ok) throw new Error(json.message ?? 'Failed to get suggestions')
        const items = json.subtasks as AISubtaskSuggestion[]
        setSuggestions(items)
        setChecked(new Set(items.map((_, i) => i)))
        setLoading(false)
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Failed to get suggestions')
        setLoading(false)
      })
  }, [taskId])

  async function handleConfirm() {
    setConfirming(true)
    const toCreate = suggestions.filter((_, i) => checked.has(i))
    let count = 0
    for (const s of toCreate) {
      try {
        await createSubtask(workspaceId, taskId, s.title)
        count++
      } catch {
        // continue — partial success is acceptable
      }
    }
    if (count > 0) {
      pushUndo({ label: `${count} subtask${count === 1 ? '' : 's'} added`, canUndo: false })
    }
    onDone()
  }

  function toggleCheck(i: number) {
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  if (loading) {
    return (
      <div
        className="px-4 py-3 flex items-center gap-2 text-sm text-[var(--tx-3)] border-b border-[var(--border)]"
        aria-label="Loading subtask suggestions"
      >
        <IconLoader2 size={14} className="animate-spin" aria-hidden="true" />
        <span>Generating subtasks…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 py-3 border-b border-[var(--border)] flex flex-col gap-1">
        <p className="text-sm text-red-600" role="alert">{error}</p>
        <button
          onClick={onCancel}
          className="text-xs text-[var(--tx-3)] hover:text-[var(--tx-1)] text-left transition-colors"
        >
          Dismiss
        </button>
      </div>
    )
  }

  return (
    <div className="px-4 py-3 border-b border-[var(--border)] flex flex-col gap-3">
      <p className="text-xs font-medium uppercase tracking-[0.06em] text-[var(--tx-3)]">
        Suggested subtasks
      </p>
      <ul className="flex flex-col gap-2">
        {suggestions.map((s, i) => (
          <li key={i} className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`breakdown-${i}`}
              checked={checked.has(i)}
              onChange={() => toggleCheck(i)}
              className="h-4 w-4 rounded border-[var(--border-2)] accent-[var(--accent)]"
            />
            <label
              htmlFor={`breakdown-${i}`}
              className="flex-1 text-sm text-[var(--tx-1)] cursor-pointer"
            >
              {s.title}
            </label>
            {s.estimated_mins != null && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--tx-3)]">
                {s.estimated_mins}m
              </span>
            )}
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-2">
        <button
          onClick={handleConfirm}
          disabled={confirming || checked.size === 0}
          className="h-7 px-3 rounded-[var(--radius)] text-xs font-medium text-white transition-colors disabled:opacity-40"
          style={{ background: 'var(--accent)' }}
        >
          {confirming ? 'Adding…' : 'Add subtasks'}
        </button>
        <button
          onClick={onCancel}
          className="h-7 px-3 rounded-[var(--radius)] text-xs font-medium text-[var(--tx-2)] hover:bg-[var(--surface-2)] transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
