'use client'

import { useState } from 'react'
import { IconCalendar, IconX } from '@tabler/icons-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface DueDatePickerProps {
  value: string | null
  onChange: (date: string | null) => void
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function toDateString(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function addDays(base: Date, n: number): Date {
  const d = new Date(base)
  d.setDate(d.getDate() + n)
  return d
}

function getQuickDates() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const day = today.getDay() // 0=Sun … 6=Sat

  const daysUntilFriday = ((5 - day + 7) % 7) || 7
  const daysUntilMonday = ((1 - day + 7) % 7) || 7

  return {
    today,
    tomorrow: addDays(today, 1),
    thisFriday: addDays(today, daysUntilFriday),
    nextMonday: addDays(today, daysUntilMonday),
    inTwoWeeks: addDays(today, 14),
  }
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatDisplayDate(value: string): string {
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffDays = Math.round((date.getTime() - today.getTime()) / 86400000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays > 1 && diffDays <= 6) return DAY_NAMES[date.getDay()]
  return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}`
}

export function DueDatePicker({ value, onChange }: DueDatePickerProps) {
  const [open, setOpen] = useState(false)

  function pick(date: Date) {
    onChange(toDateString(date))
    setOpen(false)
  }

  const { today, tomorrow, thisFriday, nextMonday, inTwoWeeks } = getQuickDates()

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          aria-label="Due date"
          className={[
            'flex items-center gap-1.5 h-9 px-3 rounded-[var(--radius)] w-full text-left',
            'border border-[var(--border-2)] bg-[var(--surface)] hover:bg-[var(--surface-2)]',
            'text-sm transition-colors',
            value ? 'text-[var(--tx-1)]' : 'text-[var(--tx-3)]',
          ].join(' ')}
        >
          <IconCalendar size={14} aria-hidden="true" className="shrink-0" />
          {value ? formatDisplayDate(value) : 'Set due date'}
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-52 p-2" align="start">
        <div className="flex flex-col gap-0.5">
          <QuickOption label="Today" onClick={() => pick(today)} />
          <QuickOption label="Tomorrow" onClick={() => pick(tomorrow)} />
          <QuickOption label="This Friday" onClick={() => pick(thisFriday)} />
          <QuickOption label="Next Monday" onClick={() => pick(nextMonday)} />
          <QuickOption label="In 2 weeks" onClick={() => pick(inTwoWeeks)} />

          <div className="pt-2 mt-1 border-t border-[var(--border)]">
            <input
              type="date"
              className="h-8 w-full px-2 text-sm rounded border border-[var(--border-2)] bg-[var(--surface)] text-[var(--tx-1)] outline-none focus:border-[var(--accent)]"
              onChange={e => {
                if (e.target.value) {
                  onChange(e.target.value)
                  setOpen(false)
                }
              }}
              aria-label="Pick a custom date"
            />
          </div>

          {value && (
            <button
              onClick={() => { onChange(null); setOpen(false) }}
              className={[
                'flex items-center gap-1.5 px-2 py-1.5 text-sm rounded transition-colors w-full text-left mt-1 pt-2',
                'border-t border-[var(--border)] text-[var(--tx-3)] hover:text-[var(--action)] hover:bg-[var(--action-bg)]',
              ].join(' ')}
            >
              <IconX size={13} aria-hidden="true" />
              Clear
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function QuickOption({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center px-2 py-1.5 text-sm text-[var(--tx-1)] rounded hover:bg-[var(--surface-2)] transition-colors w-full text-left"
    >
      {label}
    </button>
  )
}
