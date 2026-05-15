import { createClient } from '@/lib/supabase/client'
import type { Task } from '@/lib/types'

const TASK_COLUMNS = [
  'id', 'workspace_id', 'project_id', 'parent_id', 'title', 'description',
  'status', 'priority', 'assignee_id', 'due_date', 'estimated_mins',
  'position', 'is_archived', 'is_recurring', 'recurrence_rule',
  'snoozed_until', 'created_at', 'updated_at',
].join(', ')

// task_links is bidirectional — a single row (A, B) links both tasks.
// Query both directions: rows where task is task_id, and rows where task is linked_task_id.
export async function getLinkedTasks(taskId: string): Promise<Task[]> {
  const supabase = createClient()

  // Rows where this task is on the left (task_id) — linked task is linked_task_id
  const { data: d1, error: e1 } = await supabase
    .from('task_links')
    .select(`linked_task_id, task:tasks!task_links_linked_task_id_fkey(${TASK_COLUMNS})`)
    .eq('task_id', taskId)
  if (e1) throw e1

  // Rows where this task is on the right (linked_task_id) — linked task is task_id
  const { data: d2, error: e2 } = await supabase
    .from('task_links')
    .select(`task_id, task:tasks!task_links_task_id_fkey(${TASK_COLUMNS})`)
    .eq('linked_task_id', taskId)
  if (e2) throw e2

  type LinkRow = { task: Task | null }
  const all = [
    ...((d1 ?? []) as unknown as LinkRow[]),
    ...((d2 ?? []) as unknown as LinkRow[]),
  ]
    .map(r => r.task)
    .filter((t): t is Task => t !== null)

  // De-duplicate by id (shouldn't happen, but guard against it)
  const seen = new Set<string>()
  return all.filter(t => {
    if (seen.has(t.id)) return false
    seen.add(t.id)
    return true
  })
}

export async function addLink(
  _workspaceId: string,
  taskId: string,
  linkedTaskId: string
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('task_links')
    .insert({ task_id: taskId, linked_task_id: linkedTaskId })
  if (error) throw error
}

export async function removeLink(
  taskId: string,
  linkedTaskId: string
): Promise<void> {
  const supabase = createClient()
  // Delete whichever direction the row was stored in
  const { error } = await supabase
    .from('task_links')
    .delete()
    .or(`and(task_id.eq.${taskId},linked_task_id.eq.${linkedTaskId}),and(task_id.eq.${linkedTaskId},linked_task_id.eq.${taskId})`)
  if (error) throw error
}
