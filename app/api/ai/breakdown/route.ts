import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { breakdownTask } from '@/lib/ai/tasks'

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

  const { taskId } = body as { taskId?: unknown }
  if (typeof taskId !== 'string' || !taskId.trim()) {
    return Response.json({ message: 'taskId is required' }, { status: 400 })
  }

  const { data: task } = await supabase
    .from('tasks')
    .select('title, description, workspace_id')
    .eq('id', taskId)
    .single()

  if (!task) {
    return Response.json({ message: 'Task not found' }, { status: 404 })
  }

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('workspace_id', (task as { workspace_id: string }).workspace_id)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return Response.json({ message: 'Task not found' }, { status: 404 })
  }

  try {
    const subtasks = await breakdownTask(task as { title: string; description?: string | null })
    return Response.json({ subtasks })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI request failed'
    return Response.json({ message }, { status: 500 })
  }
}
