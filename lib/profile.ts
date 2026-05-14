import { createClient } from '@/lib/supabase/client'
import imageCompression from 'browser-image-compression'

export async function updateDisplayName(userId: string, displayName: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ display_name: displayName })
    .eq('id', userId)
  if (error) throw new Error(error.message)
}

export async function updateAvatar(userId: string, avatarUrl: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', userId)
  if (error) throw new Error(error.message)
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const compressed = await imageCompression(file, {
    maxWidthOrHeight: 256,
    useWebWorker: true,
  })
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${userId}/avatar.${ext}`
  const supabase = createClient()
  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, compressed, { upsert: true })
  if (error) throw new Error(error.message)
  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
  return publicUrl
}
