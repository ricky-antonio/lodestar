import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export const aiRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1m'),
  analytics: false,
})

export async function checkRateLimit(
  userId: string
): Promise<{ limited: boolean; response: Response | null }> {
  const { success } = await aiRatelimit.limit(userId)
  if (!success) {
    return {
      limited: true,
      response: Response.json({ message: 'Too many requests' }, { status: 429 }),
    }
  }
  return { limited: false, response: null }
}
