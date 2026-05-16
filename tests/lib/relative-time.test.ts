import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { relativeTime } from '@/lib/relative-time'

const BASE = new Date('2026-01-15T12:00:00Z')

describe('relativeTime', () => {
  describe('with injected now param', () => {
    it('30 seconds ago → "just now"', () => {
      const date = new Date(BASE.getTime() - 30 * 1000)
      expect(relativeTime(date, BASE)).toBe('just now')
    })

    it('59 seconds ago → "just now"', () => {
      const date = new Date(BASE.getTime() - 59 * 1000)
      expect(relativeTime(date, BASE)).toBe('just now')
    })

    it('5 minutes ago → "5 minutes ago"', () => {
      const date = new Date(BASE.getTime() - 5 * 60 * 1000)
      expect(relativeTime(date, BASE)).toBe('5 minutes ago')
    })

    it('1 minute ago → "1 minute ago"', () => {
      const date = new Date(BASE.getTime() - 1 * 60 * 1000)
      expect(relativeTime(date, BASE)).toBe('1 minute ago')
    })

    it('2 hours ago → "2 hours ago"', () => {
      const date = new Date(BASE.getTime() - 2 * 60 * 60 * 1000)
      expect(relativeTime(date, BASE)).toBe('2 hours ago')
    })

    it('1 hour ago → "1 hour ago"', () => {
      const date = new Date(BASE.getTime() - 1 * 60 * 60 * 1000)
      expect(relativeTime(date, BASE)).toBe('1 hour ago')
    })

    it('yesterday (25 hours ago) → "yesterday"', () => {
      const date = new Date(BASE.getTime() - 25 * 60 * 60 * 1000)
      expect(relativeTime(date, BASE)).toBe('yesterday')
    })

    it('3 days ago → "3 days ago"', () => {
      const date = new Date(BASE.getTime() - 3 * 24 * 60 * 60 * 1000)
      expect(relativeTime(date, BASE)).toBe('3 days ago')
    })

    it('7 days ago → "7 days ago"', () => {
      const date = new Date(BASE.getTime() - 7 * 24 * 60 * 60 * 1000)
      expect(relativeTime(date, BASE)).toBe('7 days ago')
    })

    it('10 days ago → formatted date string (not relative)', () => {
      const date = new Date(BASE.getTime() - 10 * 24 * 60 * 60 * 1000)
      const result = relativeTime(date, BASE)
      // Should be a formatted date like "Jan 5" — not a relative phrase
      expect(result).not.toContain('ago')
      expect(result).not.toBe('just now')
      expect(result.length).toBeGreaterThan(0)
    })

    it('accepts a date string', () => {
      const dateStr = new Date(BASE.getTime() - 5 * 60 * 1000).toISOString()
      expect(relativeTime(dateStr, BASE)).toBe('5 minutes ago')
    })
  })

  describe('with fake timers (default now = new Date())', () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => vi.useRealTimers())

    it('30 seconds ago → "just now" using fake timer', () => {
      vi.setSystemTime(BASE)
      const date = new Date(BASE.getTime() - 30 * 1000)
      expect(relativeTime(date)).toBe('just now')
    })

    it('5 minutes ago → "5 minutes ago" using fake timer', () => {
      vi.setSystemTime(BASE)
      const date = new Date(BASE.getTime() - 5 * 60 * 1000)
      expect(relativeTime(date)).toBe('5 minutes ago')
    })

    it('2 hours ago → "2 hours ago" using fake timer', () => {
      vi.setSystemTime(BASE)
      const date = new Date(BASE.getTime() - 2 * 60 * 60 * 1000)
      expect(relativeTime(date)).toBe('2 hours ago')
    })

    it('yesterday → "yesterday" using fake timer', () => {
      vi.setSystemTime(BASE)
      const date = new Date(BASE.getTime() - 25 * 60 * 60 * 1000)
      expect(relativeTime(date)).toBe('yesterday')
    })

    it('3 days ago → "3 days ago" using fake timer', () => {
      vi.setSystemTime(BASE)
      const date = new Date(BASE.getTime() - 3 * 24 * 60 * 60 * 1000)
      expect(relativeTime(date)).toBe('3 days ago')
    })

    it('10 days ago → formatted date string using fake timer', () => {
      vi.setSystemTime(BASE)
      const date = new Date(BASE.getTime() - 10 * 24 * 60 * 60 * 1000)
      const result = relativeTime(date)
      expect(result).not.toContain('ago')
      expect(result).not.toBe('just now')
    })
  })
})
