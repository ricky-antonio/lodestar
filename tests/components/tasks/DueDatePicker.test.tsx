import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DueDatePicker } from '@/components/tasks/DueDatePicker'

vi.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  PopoverTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  PopoverContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// All date tests use 2024-01-15 (Monday)
describe('DueDatePicker', () => {
  describe('with fake time 2024-01-15 (Monday)', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      // Use noon UTC so the local date is 2024-01-15 in any US timezone
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))
    })
    afterEach(() => vi.useRealTimers())

    it('"Today" calls onChange with 2024-01-15', () => {
      const onChange = vi.fn()
      render(<DueDatePicker value={null} onChange={onChange} />)
      fireEvent.click(screen.getByRole('button', { name: 'Today' }))
      expect(onChange).toHaveBeenCalledWith('2024-01-15')
    })

    it('"Tomorrow" calls onChange with 2024-01-16', () => {
      const onChange = vi.fn()
      render(<DueDatePicker value={null} onChange={onChange} />)
      fireEvent.click(screen.getByRole('button', { name: 'Tomorrow' }))
      expect(onChange).toHaveBeenCalledWith('2024-01-16')
    })

    it('"This Friday" calls onChange with 2024-01-19', () => {
      const onChange = vi.fn()
      render(<DueDatePicker value={null} onChange={onChange} />)
      fireEvent.click(screen.getByRole('button', { name: 'This Friday' }))
      expect(onChange).toHaveBeenCalledWith('2024-01-19')
    })

    it('"Next Monday" calls onChange with 2024-01-22', () => {
      const onChange = vi.fn()
      render(<DueDatePicker value={null} onChange={onChange} />)
      fireEvent.click(screen.getByRole('button', { name: 'Next Monday' }))
      expect(onChange).toHaveBeenCalledWith('2024-01-22')
    })

    it('"In 2 weeks" calls onChange with 2024-01-29', () => {
      const onChange = vi.fn()
      render(<DueDatePicker value={null} onChange={onChange} />)
      fireEvent.click(screen.getByRole('button', { name: 'In 2 weeks' }))
      expect(onChange).toHaveBeenCalledWith('2024-01-29')
    })

    it('"Clear" calls onChange with null', () => {
      const onChange = vi.fn()
      render(<DueDatePicker value="2024-01-15" onChange={onChange} />)
      fireEvent.click(screen.getByRole('button', { name: /clear/i }))
      expect(onChange).toHaveBeenCalledWith(null)
    })

    it('"Clear" is not shown when value is null', () => {
      const onChange = vi.fn()
      render(<DueDatePicker value={null} onChange={onChange} />)
      expect(screen.queryByRole('button', { name: /clear/i })).toBeNull()
    })
  })
})
