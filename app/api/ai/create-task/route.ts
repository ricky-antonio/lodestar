import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { createTaskFromPrompt } from '@/lib/ai/tasks'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { limited, response } = await checkRateLimit(user.id)
  if (limited) return response!

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ message: 'Invalid request body' }, { status: 400 })
  }

  const { prompt } = body as { prompt?: unknown }
  if (typeof prompt !== 'string' || prompt.trim() === '') {
    return Response.json({ message: 'prompt must be a non-empty string' }, { status: 400 })
  }

  try {
    const result = await createTaskFromPrompt(prompt.trim())
    return Response.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI request failed'
    return Response.json({ message }, { status: 500 })
  }
}
