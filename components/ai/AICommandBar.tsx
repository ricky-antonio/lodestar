'use client'

import { useRef, useState, useCallback } from 'react'
import { IconSparkles, IconX, IconLoader2 } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTasks } from '@/lib/context/TasksContext'
import type { AITaskPreview } from '@/lib/ai/tasks'
import type { TaskPriority } from '@/lib/types'

interface Props {
  open: boolean
  projectId: string | null
  onClose: () => void
}

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  urgent: 'var(--priority-urgent)',
  high: 'var(--priority-high)',
  medium: 'var(--priority-medium)',
  low: 'var(--priority-low)',
}

export function AICommandBar({ open, projectId, onClose }: Props) {
  const { addTask } = useTasks()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<AITaskPreview | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = useCallback(async () => {
    if (!prompt.trim() || loading) return
    setLoading(true)
    setError(null)
    setPreview(null)
    try {
      const res = await fetch('/api/ai/create-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? 'AI request failed')
      setPreview(data as AITaskPreview)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [prompt, loading])

  const handleCreate = useCallback(async () => {
    if (!preview) return
    await addTask({
      title: preview.title,
      description: preview.description ?? null,
      priority: preview.priority,
      due_date: preview.due_date ?? null,
      estimated_mins: preview.estimated_mins ?? null,
      project_id: projectId,
      status: 'todo',
    })
    setPrompt('')
    setPreview(null)
    setError(null)
    onClose()
  }, [preview, projectId, addTask, onClose])

  const handleCancel = useCallback(() => {
    setPreview(null)
    setError(null)
  }, [])

  if (!open) return null

  return (
    <div
      className="rounded-lg border p-4 flex flex-col gap-3"
      style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}
      data-testid="ai-command-bar"
    >
      {/* Input row */}
      <div className="flex gap-2 items-start">
        <IconSparkles size={16} style={{ color: 'var(--accent)', marginTop: 10, flexShrink: 0 }} aria-hidden />
        <textarea
          ref={textareaRef}
          autoFocus
          rows={2}
          placeholder="Describe a task in plain English…"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          disabled={loading}
          onKeyDown={e => {
            if (e.key === 'Enter' && e.ctrlKey) {
              e.preventDefault()
              handleSubmit()
            }
          }}
          className="flex-1 resize-none rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-50"
          style={{
            background: 'var(--surface-2)',
            border: '0.5px solid var(--border)',
            color: 'var(--tx-1)',
          }}
        />
        <Button
          onClick={handleSubmit}
          disabled={loading || !prompt.trim()}
          className="shrink-0"
          aria-label="Generate task"
        >
          {loading ? (
            <IconLoader2 size={15} className="animate-spin" aria-hidden />
          ) : (
            'Generate'
          )}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm" style={{ color: 'var(--error, #ef4444)' }} role="alert">
          {error}
        </p>
      )}

      {/* Preview card */}
      {preview && (
        <div
          className="rounded-md border p-3 flex flex-col gap-2"
          style={{ background: 'var(--surface-2)', border: '0.5px solid var(--border)' }}
          data-testid="ai-preview-card"
        >
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium capitalize"
              style={{
                background: `${PRIORITY_COLORS[preview.priority]}22`,
                color: PRIORITY_COLORS[preview.priority],
                border: `0.5px solid ${PRIORITY_COLORS[preview.priority]}55`,
              }}
            >
              {preview.priority}
            </span>
            <span className="text-sm font-medium" style={{ color: 'var(--tx-1)' }}>
              {preview.title}
            </span>
          </div>

          {preview.description && (
            <p className="text-sm" style={{ color: 'var(--tx-2)' }}>
              {preview.description}
            </p>
          )}

          <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--tx-3)' }}>
            {preview.due_date && <span>Due {preview.due_date}</span>}
            {preview.estimated_mins != null && <span>{preview.estimated_mins} min</span>}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button size="sm" onClick={handleCreate}>
              Create task
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancel}>
              <IconX size={14} aria-hidden />
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
