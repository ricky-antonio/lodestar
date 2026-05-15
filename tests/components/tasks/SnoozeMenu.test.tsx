import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SnoozeMenu } from '@/components/tasks/SnoozeMenu'

vi.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  PopoverTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  PopoverContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// All snooze tests use 2024-01-15T10:00:00Z (Monday, 10am UTC)
describe('SnoozeMenu', () => {
  describe('with fake time 2024-01-15T10:00:00Z', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-15T10:00:00Z'))
    })
    afterEach(() => vi.useRealTimers())

    it('"+3 hours" calls onSnooze with 2024-01-15T13:00:00Z', () => {
      const onSnooze = vi.fn()
      render(<SnoozeMenu taskId="task-1" onSnooze={onSnooze} />)
      fireEvent.click(screen.getByRole('button', { name: '+3 hours' }))
      expect(onSnooze).toHaveBeenCalledWith('2024-01-15T13:00:00Z')
    })

    it('"Tomorrow morning" calls onSnooze with 2024-01-16T08:00:00', () => {
      const onSnooze = vi.fn()
      render(<SnoozeMenu taskId="task-1" onSnooze={onSnooze} />)
      fireEvent.click(screen.getByRole('button', { name: 'Tomorrow morning' }))
      expect(onSnooze).toHaveBeenCalledWith('2024-01-16T08:00:00')
    })

    it('"Next week" calls onSnooze with 2024-01-22T08:00:00', () => {
      const onSnooze = vi.fn()
      render(<SnoozeMenu taskId="task-1" onSnooze={onSnooze} />)
      fireEvent.click(screen.getByRole('button', { name: 'Next week' }))
      expect(onSnooze).toHaveBeenCalledWith('2024-01-22T08:00:00')
    })
  })
})
