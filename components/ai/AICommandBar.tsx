'use client'

import { useRef, useState, useCallback } from 'react'
import { IconSparkles, IconX, IconLoader2 } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { useTasks } from '@/lib/context/TasksContext'
import { useAuth } from '@/lib/context/AuthContext'
import { createSubtask } from '@/lib/subtasks'
import { addLink } from '@/lib/links'
import type { AITaskResult } from '@/lib/ai/tasks'
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

function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span
      className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium capitalize"
      style={{
        background: `${PRIORITY_COLORS[priority]}22`,
        color: PRIORITY_COLORS[priority],
        border: `0.5px solid ${PRIORITY_COLORS[priority]}55`,
      }}
    >
      {priority}
    </span>
  )
}

export function AICommandBar({ open, projectId, onClose }: Props) {
  const { addTask } = useTasks()
  const { workspace } = useAuth()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [result, setResult] = useState<AITaskResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = useCallback(async () => {
    if (!prompt.trim() || loading) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/ai/create-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? 'AI request failed')
      setResult(data as AITaskResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [prompt, loading])

  const handleCreate = useCallback(async () => {
    if (!result || confirming) return
    setConfirming(true)
    try {
      const ids: string[] = []
      for (const item of result.tasks) {
        const id = await addTask({
          title: item.title,
          description: item.description ?? null,
          priority: item.priority,
          due_date: item.due_date ?? null,
          estimated_mins: item.estimated_mins ?? null,
          project_id: projectId,
          status: 'todo',
        })
        if (id) {
          ids.push(id)
          for (const subtaskTitle of item.subtasks ?? []) {
            try {
              await createSubtask(workspace?.id ?? '', id, subtaskTitle)
            } catch { /* continue on individual failure */ }
          }
        }
      }
      // Link all created tasks to each other as related
      if (ids.length > 1) {
        for (let i = 0; i < ids.length - 1; i++) {
          for (let j = i + 1; j < ids.length; j++) {
            try {
              await addLink(workspace?.id ?? '', ids[i], ids[j])
            } catch { /* continue on individual failure */ }
          }
        }
      }
      setPrompt('')
      setResult(null)
      setError(null)
      onClose()
    } finally {
      setConfirming(false)
    }
  }, [result, confirming, projectId, workspace, addTask, onClose])

  const handleCancel = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  if (!open) return null

  const isGrouped = result && result.tasks.length === 1 && (result.tasks[0].subtasks?.length ?? 0) > 0
  const isSplit = result && result.tasks.length > 1

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
      {result && (
        <div
          className="rounded-md border p-3 flex flex-col gap-2"
          style={{ background: 'var(--surface-2)', border: '0.5px solid var(--border)' }}
          data-testid="ai-preview-card"
        >
          {/* Grouped: one task with subtasks */}
          {isGrouped && (() => {
            const task = result.tasks[0]
            return (
              <>
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={task.priority} />
                  <span className="text-sm font-medium" style={{ color: 'var(--tx-1)' }}>
                    {task.title}
                  </span>
                </div>
                {task.description && (
                  <p className="text-xs" style={{ color: 'var(--tx-3)' }}>{task.description}</p>
                )}
                <ul className="flex flex-col gap-1 pl-1">
                  {task.subtasks.map((s, i) => (
                    <li key={i} className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--tx-2)' }}>
                      <span className="text-[var(--tx-3)]">—</span> {s}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--tx-3)' }}>
                  {task.due_date && <span>Due {task.due_date}</span>}
                  {task.estimated_mins != null && <span>{task.estimated_mins} min</span>}
                </div>
              </>
            )
          })()}

          {/* Split: multiple independent tasks */}
          {isSplit && (
            <>
              <p className="text-xs font-medium" style={{ color: 'var(--tx-3)' }}>
                {result.tasks.length} tasks · will be linked as related
              </p>
              <ul className="flex flex-col gap-1.5">
                {result.tasks.map((task, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <PriorityBadge priority={task.priority} />
                    <span className="text-sm" style={{ color: 'var(--tx-1)' }}>{task.title}</span>
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* Single task, no subtasks */}
          {!isGrouped && !isSplit && (() => {
            const task = result.tasks[0]
            return (
              <>
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={task.priority} />
                  <span className="text-sm font-medium" style={{ color: 'var(--tx-1)' }}>
                    {task.title}
                  </span>
                </div>
                {task.description && (
                  <p className="text-sm" style={{ color: 'var(--tx-2)' }}>{task.description}</p>
                )}
                <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--tx-3)' }}>
                  {task.due_date && <span>Due {task.due_date}</span>}
                  {task.estimated_mins != null && <span>{task.estimated_mins} min</span>}
                </div>
              </>
            )
          })()}

          <div className="flex items-center gap-2 pt-1">
            <Button size="sm" onClick={handleCreate} disabled={confirming}>
              {confirming ? 'Creating…' : isSplit ? `Create ${result.tasks.length} tasks` : 'Create task'}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancel} disabled={confirming}>
              <IconX size={14} aria-hidden />
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
