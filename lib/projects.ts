import { createClient } from '@/lib/supabase/client'
import type { Project } from '@/lib/types'

const PROJECT_COLUMNS =
  'id, workspace_id, name, description, color, status, default_view, created_at, updated_at'

export async function getProjects(workspaceId: string): Promise<Project[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('projects')
    .select(PROJECT_COLUMNS)
    .eq('workspace_id', workspaceId)
    .eq('status', 'active')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function getProjectById(id: string): Promise<Project | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('projects')
    .select(PROJECT_COLUMNS)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function createProject(
  workspaceId: string,
  name: string,
  color: string
): Promise<Project> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('projects')
    .insert({ workspace_id: workspaceId, name, color })
    .select(PROJECT_COLUMNS)
    .single()
  if (error) throw error
  return data
}

export async function updateProject(
  id: string,
  updates: Partial<Pick<Project, 'name' | 'color' | 'description' | 'default_view'>>
): Promise<Project> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select(PROJECT_COLUMNS)
    .single()
  if (error) throw error
  return data
}

export async function archiveProject(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('projects')
    .update({ status: 'archived' })
    .eq('id', id)
  if (error) throw error
}
