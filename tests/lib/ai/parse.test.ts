import { describe, it, expect } from 'vitest'
import { extractJSON } from '@/lib/ai/parse'

describe('extractJSON', () => {
  it('parses bare JSON string into correct object', () => {
    const result = extractJSON<{ name: string }>('{"name":"test"}')
    expect(result).toEqual({ name: 'test' })
  })

  it('strips ```json fences before parsing', () => {
    const fenced = '```json\n{"title":"Buy milk","priority":"low"}\n```'
    const result = extractJSON<{ title: string; priority: string }>(fenced)
    expect(result).toEqual({ title: 'Buy milk', priority: 'low' })
  })

  it('strips ``` fences with no language tag before parsing', () => {
    const fenced = '```\n{"count":3}\n```'
    const result = extractJSON<{ count: number }>(fenced)
    expect(result).toEqual({ count: 3 })
  })

  it('throws with "AI returned invalid JSON" on malformed JSON', () => {
    expect(() => extractJSON('{not valid json')).toThrow('AI returned invalid JSON')
  })
})
