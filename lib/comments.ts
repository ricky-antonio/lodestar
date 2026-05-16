import { createClient } from '@/lib/supabase/client'

export interface Comment {
  id: string
  task_id: string
  user_id: string | null
  body: string
  created_at: string
  profile: { display_name: string | null; avatar_url: string | null }
}

type CommentRow = {
  id: string
  task_id: string
  user_id: string | null
  body: string
  created_at: string
}

type ProfileRow = {
  id: string
  display_name: string | null
  avatar_url: string | null
}

const COMMENT_COLUMNS = 'id, task_id, user_id, body, created_at'
const PROFILE_COLUMNS = 'id, display_name, avatar_url'

async function fetchProfileMap(
  supabase: ReturnType<typeof createClient>,
  userIds: string[]
): Promise<Record<string, { display_name: string | null; avatar_url: string | null }>> {
  if (userIds.length === 0) return {}
  const { data } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .in('id', userIds)
  const map: Record<string, { display_name: string | null; avatar_url: string | null }> = {}
  for (const p of (data ?? []) as ProfileRow[]) {
    map[p.id] = { display_name: p.display_name, avatar_url: p.avatar_url }
  }
  return map
}

const EMPTY_PROFILE = { display_name: null, avatar_url: null }

export async function getComments(taskId: string): Promise<Comment[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('task_comments')
    .select(COMMENT_COLUMNS)
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })
  if (error) throw error

  const rows = (data ?? []) as CommentRow[]
  if (rows.length === 0) return []

  const userIds = [...new Set(rows.map(r => r.user_id).filter((id): id is string => id !== null))]
  const profileMap = await fetchProfileMap(supabase, userIds)

  return rows.map(r => ({
    id: r.id,
    task_id: r.task_id,
    user_id: r.user_id,
    body: r.body,
    created_at: r.created_at,
    profile: r.user_id ? (profileMap[r.user_id] ?? EMPTY_PROFILE) : EMPTY_PROFILE,
  }))
}

export async function addComment(
  workspaceId: string,
  taskId: string,
  userId: string,
  body: string
): Promise<Comment> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('task_comments')
    .insert({ workspace_id: workspaceId, task_id: taskId, user_id: userId, body })
    .select(COMMENT_COLUMNS)
    .single()
  if (error) throw error

  const row = data as CommentRow

  // Fetch profile for the commenter
  const profileMap = await fetchProfileMap(supabase, [userId])

  return {
    id: row.id,
    task_id: row.task_id,
    user_id: row.user_id,
    body: row.body,
    created_at: row.created_at,
    profile: profileMap[userId] ?? EMPTY_PROFILE,
  }
}

export async function deleteComment(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('task_comments')
    .delete()
    .eq('id', id)
  if (error) throw error
}
