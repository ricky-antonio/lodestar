'use client'

import { useState } from 'react'
import { IconAlarmSnooze } from '@tabler/icons-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface SnoozeMenuProps {
  taskId: string
  onSnooze: (until: string) => void
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function localISOString(date: Date): string {
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  )
}

export function SnoozeMenu({ taskId: _taskId, onSnooze }: SnoozeMenuProps) {
  const [open, setOpen] = useState(false)

  function snooze(until: string) {
    onSnooze(until)
    setOpen(false)
  }

  function snoozeHoursFromNow(hours: number) {
    const until = new Date(Date.now() + hours * 3600 * 1000)
    snooze(until.toISOString().slice(0, 19) + 'Z')
  }

  function snoozeLocalAt(daysAhead: number, hour: number) {
    const d = new Date()
    d.setDate(d.getDate() + daysAhead)
    d.setHours(hour, 0, 0, 0)
    snooze(localISOString(d))
  }

  function daysUntilWeekday(targetDay: number): number {
    const day = new Date().getDay()
    return ((targetDay - day + 7) % 7) || 7
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          aria-label="Snooze task"
          className="p-1.5 rounded hover:bg-[var(--surface-2)] text-[var(--tx-3)] hover:text-[var(--tx-2)] transition-colors"
        >
          <IconAlarmSnooze size={16} />
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-52 p-2" align="end">
        <div className="flex flex-col gap-0.5">
          <SnoozeOption label="+3 hours" onClick={() => snoozeHoursFromNow(3)} />
          <SnoozeOption label="Tomorrow morning" onClick={() => snoozeLocalAt(1, 8)} />
          <SnoozeOption
            label="This weekend"
            onClick={() => {
              const d = new Date()
              d.setDate(d.getDate() + daysUntilWeekday(6))
              d.setHours(9, 0, 0, 0)
              snooze(localISOString(d))
            }}
          />
          <SnoozeOption
            label="Next week"
            onClick={() => {
              const d = new Date()
              d.setDate(d.getDate() + daysUntilWeekday(1))
              d.setHours(8, 0, 0, 0)
              snooze(localISOString(d))
            }}
          />

          <div className="pt-2 mt-1 border-t border-[var(--border)]">
            <input
              type="datetime-local"
              className="h-8 w-full px-2 text-sm rounded border border-[var(--border-2)] bg-[var(--surface)] text-[var(--tx-1)] outline-none focus:border-[var(--accent)]"
              onChange={e => {
                if (e.target.value) snooze(e.target.value)
              }}
              aria-label="Pick a date and time"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function SnoozeOption({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center px-2 py-1.5 text-sm text-[var(--tx-1)] rounded hover:bg-[var(--surface-2)] transition-colors w-full text-left"
    >
      {label}
    </button>
  )
}
