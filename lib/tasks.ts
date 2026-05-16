import { createClient } from '@/lib/supabase/client'
import type { Task, TaskPriority, FilterState, TaskWithRelations } from '@/lib/types'

const TASK_COLUMNS = [
  'id', 'workspace_id', 'project_id', 'parent_id', 'title', 'description',
  'status', 'priority', 'assignee_id', 'due_date', 'estimated_mins',
  'position', 'is_archived', 'is_recurring', 'recurrence_rule',
  'snoozed_until', 'created_at', 'updated_at',
].join(', ')

// ─── Pure helpers ─────────────────────────────────────────────────────────────

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
}

function hasLabels(task: Task): task is TaskWithRelations {
  return 'labels' in task && Array.isArray((task as TaskWithRelations).labels)
}

export function filterTasks(
  tasks: Task[],
  filters: FilterState,
  taskLabelIds?: Record<string, string[]>
): Task[] {
  return tasks.filter(task => {
    if (filters.status?.length && !filters.status.includes(task.status)) return false
    if (filters.priority?.length && !filters.priority.includes(task.priority)) return false
    if (filters.assignee_id?.length) {
      if (!task.assignee_id || !filters.assignee_id.includes(task.assignee_id)) return false
    }
    if (filters.project_id !== undefined) {
      if (filters.project_id === null && task.project_id !== null) return false
      if (filters.project_id !== null && task.project_id !== filters.project_id) return false
    }
    if (filters.due_before && (!task.due_date || task.due_date > filters.due_before)) return false
    if (filters.due_after && (!task.due_date || task.due_date < filters.due_after)) return false
    if (filters.taskIds?.length && !filters.taskIds.includes(task.id)) return false
    if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) return false
    if (filters.label_ids?.length) {
      // Use the workspace-wide label map when available; fall back to task.labels for tests
      const assignedIds: string[] = taskLabelIds
        ? (taskLabelIds[task.id] ?? [])
        : hasLabels(task) ? task.labels.map(l => l.id) : []
      if (!filters.label_ids.every(id => assignedIds.includes(id))) return false
    }
    return true
  })
}

export type SortField = 'due_date' | 'priority' | 'status' | 'title' | 'created_at' | 'position'

export function sortTasks(tasks: Task[], field: SortField, direction: 'asc' | 'desc'): Task[] {
  return [...tasks].sort((a, b) => {
    let cmp = 0
    switch (field) {
      case 'due_date': {
        const aDate = a.due_date ?? '9999-12-31'
        const bDate = b.due_date ?? '9999-12-31'
        cmp = aDate < bDate ? -1 : aDate > bDate ? 1 : 0
        break
      }
      case 'priority':
        cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
        break
      case 'status':
        cmp = a.status.localeCompare(b.status)
        break
      case 'title':
        cmp = a.title.localeCompare(b.title)
        break
      case 'created_at':
        cmp = a.created_at.localeCompare(b.created_at)
        break
      case 'position':
        cmp = a.position - b.position
        break
    }
    return direction === 'asc' ? cmp : -cmp
  })
}

// Returns a fractional position between `before` and `after`.
// Callers pass the position of the item above (before) and below (after),
// using null when inserting at the top or bottom of the list.
export function getFractionalPosition(
  before: number | null,
  after: number | null
): number {
  if (before === null && after === null) return 1.0
  if (before === null) return after! / 2
  if (after === null) return before + 1.0
  return (before + after) / 2
}

// ─── Supabase helpers ─────────────────────────────────────────────────────────

export async function getAllTasks(workspaceId: string): Promise<Task[]> {
  const supabase = createClient()
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('tasks')
    .select(TASK_COLUMNS)
    .eq('workspace_id', workspaceId)
    .eq('is_archived', false)
    .or(`snoozed_until.is.null,snoozed_until.lt.${now}`)
    .order('position', { ascending: true })
  if (error) throw error
  return (data ?? []) as unknown as Task[]
}

export async function getTasks(
  workspaceId: string,
  projectId: string | null
): Promise<Task[]> {
  const supabase = createClient()
  const now = new Date().toISOString()

  let query = supabase
    .from('tasks')
    .select(TASK_COLUMNS)
    .eq('workspace_id', workspaceId)
    .eq('is_archived', false)
    .or(`snoozed_until.is.null,snoozed_until.lt.${now}`)

  if (projectId !== null) {
    query = query.eq('project_id', projectId)
  } else {
    query = query.is('project_id', null)
  }

  const { data, error } = await query.order('position', { ascending: true })
  if (error) throw error
  return (data ?? []) as unknown as Task[]
}

export async function createTask(
  workspaceId: string,
  fields: Partial<Omit<Task, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>>
): Promise<Task> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tasks')
    .insert({ workspace_id: workspaceId, ...fields })
    .select(TASK_COLUMNS)
    .single()
  if (error) throw error
  return data as unknown as Task
}

export async function updateTask(
  id: string,
  updates: Partial<Omit<Task, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>>
): Promise<Task> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select(TASK_COLUMNS)
    .single()
  if (error) throw error
  return data as unknown as Task
}

export async function deleteTask(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function archiveTask(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('tasks')
    .update({ is_archived: true })
    .eq('id', id)
  if (error) throw error
}

export async function getTasksBySearch(
  workspaceId: string,
  projectId: string | null,
  term: string,
): Promise<Task[]> {
  const supabase = createClient()
  try {
    let query = supabase
      .from('tasks')
      .select(TASK_COLUMNS)
      .eq('workspace_id', workspaceId)
      .eq('is_archived', false)
      .ilike('title', `%${term}%`)

    if (projectId !== null) {
      query = query.eq('project_id', projectId)
    }

    const { data, error } = await query.order('position', { ascending: true })
    if (error) return []
    return (data ?? []) as unknown as Task[]
  } catch {
    return []
  }
}
