import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockLimit = vi.fn()

vi.mock('@upstash/ratelimit', () => {
  function MockRatelimit() {
    return { limit: mockLimit }
  }
  MockRatelimit.slidingWindow = vi.fn().mockReturnValue('sliding-window-config')
  return { Ratelimit: MockRatelimit }
})

vi.mock('@upstash/redis', () => ({
  Redis: { fromEnv: vi.fn().mockReturnValue({}) },
}))

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns limited=false when under the rate limit', async () => {
    mockLimit.mockResolvedValueOnce({ success: true })
    const { checkRateLimit } = await import('@/lib/rate-limit')
    const result = await checkRateLimit('user-123')
    expect(result.limited).toBe(false)
    expect(result.response).toBeNull()
  })

  it('returns limited=true with 429 response when over the rate limit', async () => {
    mockLimit.mockResolvedValueOnce({ success: false })
    const { checkRateLimit } = await import('@/lib/rate-limit')
    const result = await checkRateLimit('user-123')
    expect(result.limited).toBe(true)
    expect(result.response).not.toBeNull()
    expect(result.response!.status).toBe(429)
    const body = await result.response!.json()
    expect(body).toEqual({ message: 'Too many requests' })
  })
})
