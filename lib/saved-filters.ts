import { createClient } from '@/lib/supabase/client'
import type { SavedFilter, FilterState } from '@/lib/types'

const COLS = 'id, workspace_id, user_id, name, filters, created_at'

export async function getSavedFilters(workspaceId: string, userId: string): Promise<SavedFilter[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('saved_filters')
    .select(COLS)
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as SavedFilter[]
}

export async function createSavedFilter(
  workspaceId: string,
  userId: string,
  name: string,
  filters: FilterState,
): Promise<SavedFilter> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('saved_filters')
    .insert({ workspace_id: workspaceId, user_id: userId, name, filters })
    .select(COLS)
    .single()
  if (error) throw error
  return data as SavedFilter
}

export async function deleteSavedFilter(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('saved_filters')
    .delete()
    .eq('id', id)
  if (error) throw error
}
