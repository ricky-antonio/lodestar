import { createClient } from '@/lib/supabase/client'
import type { Label } from '@/lib/types'

const LABEL_COLUMNS = 'id, workspace_id, name, color'

export async function getLabels(workspaceId: string): Promise<Label[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('labels')
    .select(LABEL_COLUMNS)
    .eq('workspace_id', workspaceId)
    .order('name', { ascending: true })
  if (error) throw error
  return (data ?? []) as Label[]
}

export async function createLabel(workspaceId: string, name: string, color: string): Promise<Label> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('labels')
    .insert({ workspace_id: workspaceId, name, color })
    .select(LABEL_COLUMNS)
    .single()
  if (error) throw error
  return data as Label
}

export async function updateLabel(
  id: string,
  updates: Partial<Pick<Label, 'name' | 'color'>>
): Promise<Label> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('labels')
    .update(updates)
    .eq('id', id)
    .select(LABEL_COLUMNS)
    .single()
  if (error) throw error
  return data as Label
}

export async function deleteLabel(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('labels')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function getTaskLabels(taskId: string): Promise<Label[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('task_labels')
    .select(`label_id, labels (${LABEL_COLUMNS})`)
    .eq('task_id', taskId)
  if (error) throw error
  type Row = { label_id: string; labels: Label | null }
  return ((data ?? []) as unknown as Row[])
    .map(row => row.labels)
    .filter((l): l is Label => l !== null)
}

export async function addLabelToTask(taskId: string, labelId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('task_labels')
    .insert({ task_id: taskId, label_id: labelId })
  if (error) throw error
}

export async function removeLabelFromTask(taskId: string, labelId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('task_labels')
    .delete()
    .eq('task_id', taskId)
    .eq('label_id', labelId)
  if (error) throw error
}
