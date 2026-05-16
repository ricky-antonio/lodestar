'use client'

import { useEffect, useState } from 'react'
import { IconTag, IconPlus, IconCheck } from '@tabler/icons-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  getLabels,
  createLabel,
  getTaskLabels,
  addLabelToTask,
  removeLabelFromTask,
} from '@/lib/labels'
import type { Label } from '@/lib/types'

const PRESET_COLORS = ['#00B6EC', '#EF4444', '#EA6400', '#22C55E', '#A855F7', '#F59E0B']

interface LabelPickerProps {
  taskId: string
  workspaceId: string
  onAssign?: (labelId: string, assigned: boolean) => void
}

export function LabelPicker({ taskId, workspaceId, onAssign }: LabelPickerProps) {
  const [allLabels, setAllLabels] = useState<Label[]>([])
  const [taskLabelIds, setTaskLabelIds] = useState<Set<string>>(new Set())
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(PRESET_COLORS[0])
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    let active = true
    Promise.all([getLabels(workspaceId), getTaskLabels(taskId)]).then(([all, task]) => {
      if (!active) return
      setAllLabels(all)
      setTaskLabelIds(new Set(task.map(l => l.id)))
    })
    return () => { active = false }
  }, [workspaceId, taskId])

  const currentLabels = allLabels.filter(l => taskLabelIds.has(l.id))

  async function handleToggle(label: Label) {
    const wasChecked = taskLabelIds.has(label.id)
    setTaskLabelIds(prev => {
      const next = new Set(prev)
      if (wasChecked) next.delete(label.id)
      else next.add(label.id)
      return next
    })
    try {
      if (wasChecked) {
        await removeLabelFromTask(taskId, label.id)
      } else {
        await addLabelToTask(taskId, label.id)
      }
      onAssign?.(label.id, !wasChecked)
    } catch {
      setTaskLabelIds(prev => {
        const next = new Set(prev)
        if (wasChecked) next.add(label.id)
        else next.delete(label.id)
        return next
      })
    }
  }

  async function handleCreateLabel() {
    if (!newName.trim()) return
    try {
      const label = await createLabel(workspaceId, newName.trim(), newColor)
      setAllLabels(prev => [...prev, label])
      setNewName('')
      setCreating(false)
    } catch {
      // user can retry
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="flex flex-wrap items-center gap-1 min-h-[36px] px-2 py-1 rounded-[var(--radius)] border border-[var(--border-2)] bg-[var(--surface)] hover:bg-[var(--surface-2)] transition-colors text-left w-full"
          aria-label="Edit labels"
        >
          {currentLabels.length === 0 ? (
            <span className="flex items-center gap-1 text-sm text-[var(--tx-3)]">
              <IconTag size={14} aria-hidden="true" />
              Add labels
            </span>
          ) : (
            currentLabels.map(l => (
              <span
                key={l.id}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: l.color }}
              >
                {l.name}
              </span>
            ))
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-56 p-2" align="start">
        <div className="flex flex-col gap-0.5">
          {allLabels.map(label => (
            <button
              key={label.id}
              onClick={() => handleToggle(label)}
              aria-pressed={taskLabelIds.has(label.id)}
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[var(--surface-2)] text-sm text-[var(--tx-1)] transition-colors w-full text-left"
            >
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: label.color }}
                aria-hidden="true"
              />
              <span className="flex-1 truncate">{label.name}</span>
              {taskLabelIds.has(label.id) && (
                <IconCheck size={14} className="text-[var(--accent)] shrink-0" aria-hidden="true" />
              )}
            </button>
          ))}

          {creating ? (
            <div className="flex flex-col gap-2 pt-2 mt-1 border-t border-[var(--border)]">
              <input
                autoFocus
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleCreateLabel()
                  if (e.key === 'Escape') { setCreating(false); setNewName('') }
                }}
                placeholder="Label name"
                className="h-7 px-2 text-sm rounded border border-[var(--border-2)] bg-[var(--surface)] text-[var(--tx-1)] outline-none focus:border-[var(--accent)]"
                aria-label="New label name"
              />
              <div className="flex gap-1">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setNewColor(c)}
                    className="w-5 h-5 rounded-full border-2 transition-colors shrink-0"
                    style={{
                      backgroundColor: c,
                      borderColor: newColor === c ? 'white' : 'transparent',
                    }}
                    aria-label={`Select color ${c}`}
                    aria-pressed={newColor === c}
                  />
                ))}
              </div>
              <button
                onClick={handleCreateLabel}
                className="h-7 text-xs font-medium rounded bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
              >
                Create
              </button>
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="flex items-center gap-1.5 px-2 py-1.5 text-sm text-[var(--tx-3)] hover:text-[var(--tx-1)] rounded hover:bg-[var(--surface-2)] transition-colors mt-1 pt-2 border-t border-[var(--border)] w-full"
            >
              <IconPlus size={14} aria-hidden="true" />
              New label
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
