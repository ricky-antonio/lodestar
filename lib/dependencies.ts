import { createClient } from '@/lib/supabase/client'
import type { Task } from '@/lib/types'

const TASK_COLUMNS = [
  'id', 'workspace_id', 'project_id', 'parent_id', 'title', 'description',
  'status', 'priority', 'assignee_id', 'due_date', 'estimated_mins',
  'position', 'is_archived', 'is_recurring', 'recurrence_rule',
  'snoozed_until', 'created_at', 'updated_at',
].join(', ')

export async function getDependencies(
  taskId: string
): Promise<{ blockedBy: Task[]; blocking: Task[] }> {
  const supabase = createClient()

  // Tasks that this task depends on (it is blocked by these)
  const { data: d1, error: e1 } = await supabase
    .from('task_dependencies')
    .select(`depends_on_id, task:tasks!depends_on_id(${TASK_COLUMNS})`)
    .eq('task_id', taskId)
  if (e1) throw e1

  type BlockedByRow = { depends_on_id: string; task: Task | null }
  const blockedBy = ((d1 ?? []) as unknown as BlockedByRow[])
    .map(r => r.task)
    .filter((t): t is Task => t !== null)

  // Tasks that depend on this task (this task blocks them)
  const { data: d2, error: e2 } = await supabase
    .from('task_dependencies')
    .select(`task_id, blocked:tasks!task_id(${TASK_COLUMNS})`)
    .eq('depends_on_id', taskId)
  if (e2) throw e2

  type BlockingRow = { task_id: string; blocked: Task | null }
  const blocking = ((d2 ?? []) as unknown as BlockingRow[])
    .map(r => r.blocked)
    .filter((t): t is Task => t !== null)

  return { blockedBy, blocking }
}

export async function addDependency(
  _workspaceId: string,
  taskId: string,
  dependsOnId: string
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('task_dependencies')
    .insert({ task_id: taskId, depends_on_id: dependsOnId })
  if (error) throw error
}

export async function removeDependency(
  taskId: string,
  dependsOnId: string
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('task_dependencies')
    .delete()
    .eq('task_id', taskId)
    .eq('depends_on_id', dependsOnId)
  if (error) throw error
}
