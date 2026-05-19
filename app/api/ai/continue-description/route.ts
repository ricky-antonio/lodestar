import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { continueDescription } from '@/lib/ai/tasks'

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

  const { title, currentText } = body as { title?: unknown; currentText?: unknown }
  if (typeof title !== 'string' || !title.trim()) {
    return Response.json({ message: 'title is required' }, { status: 400 })
  }

  try {
    const continuation = await continueDescription(
      title,
      typeof currentText === 'string' ? currentText : ''
    )
    return Response.json({ continuation })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI request failed'
    return Response.json({ message }, { status: 500 })
  }
}
