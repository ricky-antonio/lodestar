'use client'

import { useState, useEffect } from 'react'
import { IconSearch, IconX, IconChevronDown } from '@tabler/icons-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { getLabels } from '@/lib/labels'
import type { FilterState, TaskPriority, TaskStatus, Label } from '@/lib/types'

interface Props {
  filters: FilterState
  onChange: (filters: FilterState) => void
  workspaceId: string
}

const PRIORITIES: TaskPriority[] = ['urgent', 'high', 'medium', 'low']
const STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done']

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  urgent: 'Urgent', high: 'High', medium: 'Medium', low: 'Low',
}
const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: 'To do', in_progress: 'In progress', in_review: 'In review', done: 'Done',
}

function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getDatePresets() {
  const today = toYMD(new Date())
  const endDate = new Date()
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()))
  const endOfWeek = toYMD(endDate)
  const yestDate = new Date()
  yestDate.setDate(yestDate.getDate() - 1)
  const yesterday = toYMD(yestDate)
  return { today, endOfWeek, yesterday }
}

function toggleArr<T extends string>(current: T[] | undefined, val: T): T[] | undefined {
  const arr = current ?? []
  const next = arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]
  return next.length ? next : undefined
}

const btnCls =
  'inline-flex items-center gap-1.5 h-8 px-3 text-sm rounded-lg border border-[var(--border-2)] bg-[var(--surface)] hover:bg-[var(--surface-2)] transition-colors'

export function FilterBar({ filters, onChange, workspaceId }: Props) {
  const [labels, setLabels] = useState<Label[]>([])

  useEffect(() => {
    getLabels(workspaceId).then(setLabels).catch(() => {})
  }, [workspaceId])

  const { today, endOfWeek, yesterday } = getDatePresets()

  const activeDue =
    filters.due_before === today && filters.due_after === today ? 'today'
    : filters.due_before === endOfWeek && filters.due_after === today ? 'this_week'
    : filters.due_before === yesterday && !filters.due_after ? 'overdue'
    : null

  function setDue(opt: 'today' | 'this_week' | 'overdue' | null) {
    if (!opt) { onChange({ ...filters, due_before: undefined, due_after: undefined }); return }
    if (opt === 'today') { onChange({ ...filters, due_after: today, due_before: today }); return }
    if (opt === 'this_week') { onChange({ ...filters, due_after: today, due_before: endOfWeek }); return }
    onChange({ ...filters, due_after: undefined, due_before: yesterday })
  }

  const hasFilters = !!(
    filters.search || filters.priority?.length || filters.status?.length ||
    filters.label_ids?.length || filters.due_before || filters.due_after
  )

  type Chip = { key: string; label: string; onRemove: () => void }
  const chips: Chip[] = [
    ...(filters.priority ?? []).map(p => ({
      key: `p-${p}`, label: `Priority: ${PRIORITY_LABEL[p]}`,
      onRemove: () => onChange({ ...filters, priority: toggleArr(filters.priority, p) }),
    })),
    ...(filters.status ?? []).map(s => ({
      key: `s-${s}`, label: `Status: ${STATUS_LABEL[s]}`,
      onRemove: () => onChange({ ...filters, status: toggleArr(filters.status, s) }),
    })),
    ...(filters.label_ids ?? []).map(id => ({
      key: `l-${id}`, label: `Label: ${labels.find(l => l.id === id)?.name ?? id}`,
      onRemove: () => onChange({ ...filters, label_ids: toggleArr(filters.label_ids, id) }),
    })),
    ...(activeDue ? [{
      key: 'due', label: { today: 'Due: Today', this_week: 'Due: This week', overdue: 'Overdue' }[activeDue],
      onRemove: () => setDue(null),
    }] : []),
  ]

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <div
        className="relative flex items-center h-8 rounded-lg border"
        style={{ background: 'var(--surface)', borderColor: 'var(--border-2)' }}
      >
        <IconSearch size={14} className="absolute left-2.5 pointer-events-none" style={{ color: 'var(--tx-3)' }} aria-hidden />
        <input
          type="text"
          placeholder="Search tasks…"
          value={filters.search ?? ''}
          onChange={e => onChange({ ...filters, search: e.target.value || undefined })}
          aria-label="Search tasks"
          data-search-input=""
          className="h-full pl-8 pr-8 w-44 text-sm bg-transparent focus:outline-none placeholder:text-[var(--tx-3)]"
          style={{ color: 'var(--tx-1)' }}
        />
        {filters.search && (
          <button
            type="button"
            onClick={() => onChange({ ...filters, search: undefined })}
            aria-label="Clear search"
            className="absolute right-2 flex items-center justify-center w-4 h-4 rounded"
          >
            <IconX size={12} style={{ color: 'var(--tx-3)' }} aria-hidden />
          </button>
        )}
      </div>

      {/* Filter: priority + status */}
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className={btnCls} style={{ color: 'var(--tx-1)' }}>
            Filter <IconChevronDown size={12} aria-hidden />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-52 p-3 space-y-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-widest mb-1.5" style={{ color: 'var(--tx-3)' }}>Priority</p>
            {PRIORITIES.map(p => (
              <label key={p} className="flex items-center gap-2 py-1 text-sm cursor-pointer" style={{ color: 'var(--tx-1)' }}>
                <input
                  type="checkbox"
                  checked={(filters.priority ?? []).includes(p)}
                  onChange={() => onChange({ ...filters, priority: toggleArr(filters.priority, p) })}
                />
                {PRIORITY_LABEL[p]}
              </label>
            ))}
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-widest mb-1.5" style={{ color: 'var(--tx-3)' }}>Status</p>
            {STATUSES.map(s => (
              <label key={s} className="flex items-center gap-2 py-1 text-sm cursor-pointer" style={{ color: 'var(--tx-1)' }}>
                <input
                  type="checkbox"
                  checked={(filters.status ?? []).includes(s)}
                  onChange={() => onChange({ ...filters, status: toggleArr(filters.status, s) })}
                />
                {STATUS_LABEL[s]}
              </label>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Due date */}
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className={btnCls} style={{ color: 'var(--tx-1)' }}>
            Due date <IconChevronDown size={12} aria-hidden />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-44 p-1.5">
          {(['today', 'this_week', 'overdue'] as const).map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => setDue(activeDue === opt ? null : opt)}
              className="w-full text-left px-3 py-1.5 text-sm rounded-md hover:bg-[var(--surface-2)]"
              style={{ color: activeDue === opt ? 'var(--accent)' : 'var(--tx-1)' }}
            >
              {{ today: 'Today', this_week: 'This week', overdue: 'Overdue' }[opt]}
            </button>
          ))}
        </PopoverContent>
      </Popover>

      {/* Label */}
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className={btnCls} style={{ color: 'var(--tx-1)' }}>
            Label <IconChevronDown size={12} aria-hidden />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-48 p-3">
          {labels.length === 0 ? (
            <p className="text-sm py-1" style={{ color: 'var(--tx-3)' }}>No labels yet</p>
          ) : labels.map(label => (
            <label key={label.id} className="flex items-center gap-2 py-1 text-sm cursor-pointer" style={{ color: 'var(--tx-1)' }}>
              <input
                type="checkbox"
                checked={(filters.label_ids ?? []).includes(label.id)}
                onChange={() => onChange({ ...filters, label_ids: toggleArr(filters.label_ids, label.id) })}
              />
              <span className="w-2 h-2 rounded-full flex-none" style={{ background: label.color }} aria-hidden />
              {label.name}
            </label>
          ))}
        </PopoverContent>
      </Popover>

      {/* Active chips */}
      {chips.map(chip => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 text-xs rounded-full"
          style={{ background: 'var(--accent-bg)', color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }}
        >
          {chip.label}
          <button
            type="button"
            onClick={chip.onRemove}
            aria-label={`Remove ${chip.label} filter`}
            className="flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-[var(--accent-border)]"
          >
            <IconX size={8} aria-hidden />
          </button>
        </span>
      ))}

      {/* Clear all */}
      {hasFilters && (
        <button
          type="button"
          onClick={() => onChange({})}
          className="text-xs hover:underline"
          style={{ color: 'var(--tx-3)' }}
        >
          Clear all
        </button>
      )}
    </div>
  )
}
