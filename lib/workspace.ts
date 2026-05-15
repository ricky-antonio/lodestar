import { createClient } from '@/lib/supabase/client'
import type { Workspace } from '@/lib/types'

const WORKSPACE_COLUMNS =
  'id, name, slug, color, owner_id, timezone, end_of_day_time, created_at, updated_at'

export async function updateWorkspace(
  id: string,
  updates: Partial<Pick<Workspace, 'name' | 'color' | 'timezone' | 'end_of_day_time'>>
): Promise<Workspace> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('workspaces')
    .update(updates)
    .eq('id', id)
    .select(WORKSPACE_COLUMNS)
    .single()
  if (error) throw error
  return data
}
