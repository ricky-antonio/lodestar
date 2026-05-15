import { createClient } from '@/lib/supabase/client'
import type { Task } from '@/lib/types'

const TASK_COLUMNS = [
  'id', 'workspace_id', 'project_id', 'parent_id', 'title', 'description',
  'status', 'priority', 'assignee_id', 'due_date', 'estimated_mins',
  'position', 'is_archived', 'is_recurring', 'recurrence_rule',
  'snoozed_until', 'created_at', 'updated_at',
].join(', ')

export async function getSubtasks(parentId: string): Promise<Task[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tasks')
    .select(TASK_COLUMNS)
    .eq('parent_id', parentId)
    .eq('is_archived', false)
    .order('position', { ascending: true })
  if (error) throw error
  return (data ?? []) as unknown as Task[]
}

export async function createSubtask(
  workspaceId: string,
  parentId: string,
  title: string
): Promise<Task> {
  const supabase = createClient()
  const { data: existing, error: fetchError } = await supabase
    .from('tasks')
    .select('position')
    .eq('parent_id', parentId)
    .order('position', { ascending: false })
    .limit(1)
  if (fetchError) throw fetchError

  const maxPosition = existing && existing.length > 0 ? (existing[0].position as number) : 0
  const position = maxPosition + 1.0

  const { data, error } = await supabase
    .from('tasks')
    .insert({ workspace_id: workspaceId, parent_id: parentId, title, position })
    .select(TASK_COLUMNS)
    .single()
  if (error) throw error
  return data as unknown as Task
}

export async function toggleSubtask(id: string, done: boolean): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('tasks')
    .update({ status: done ? 'done' : 'todo' })
    .eq('id', id)
  if (error) throw error
}
