import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockSupabase } from '../mocks/supabase'
import { updateDisplayName, updateAvatar, uploadAvatar } from '@/lib/profile'

vi.mock('browser-image-compression', () => ({
  default: vi.fn(),
}))

import imageCompression from 'browser-image-compression'
const mockImageCompression = vi.mocked(imageCompression)

beforeEach(() => vi.clearAllMocks())

describe('updateDisplayName', () => {
  it('calls supabase update with correct display_name and userId', async () => {
    await updateDisplayName('user-1', 'Alice')
    expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
    expect(mockSupabase.update).toHaveBeenCalledWith({ display_name: 'Alice' })
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'user-1')
  })

  it('throws when supabase returns an error', async () => {
    mockSupabase.eq.mockResolvedValueOnce({ error: { message: 'DB write failed' } })
    await expect(updateDisplayName('user-1', 'Alice')).rejects.toThrow('DB write failed')
  })
})

describe('updateAvatar', () => {
  it('calls supabase update with correct avatar_url and userId', async () => {
    await updateAvatar('user-1', 'https://example.com/avatar.jpg')
    expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
    expect(mockSupabase.update).toHaveBeenCalledWith({ avatar_url: 'https://example.com/avatar.jpg' })
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'user-1')
  })

  it('throws when supabase returns an error', async () => {
    mockSupabase.eq.mockResolvedValueOnce({ error: { message: 'DB write failed' } })
    await expect(updateAvatar('user-1', 'https://example.com/avatar.jpg')).rejects.toThrow(
      'DB write failed'
    )
  })
})

describe('uploadAvatar', () => {
  it('compresses the image, uploads to storage, and returns the public URL', async () => {
    const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' })
    const compressed = new File(['compressed'], 'photo.jpg', { type: 'image/jpeg' })
    mockImageCompression.mockResolvedValueOnce(compressed)
    mockSupabase.storage.upload.mockResolvedValueOnce({ data: { path: 'user-1/avatar.jpg' }, error: null })
    mockSupabase.storage.getPublicUrl.mockReturnValueOnce({
      data: { publicUrl: 'https://cdn.example.com/user-1/avatar.jpg' },
    })

    const url = await uploadAvatar('user-1', file)

    expect(mockImageCompression).toHaveBeenCalledWith(file, { maxWidthOrHeight: 256, useWebWorker: true })
    expect(mockSupabase.storage.upload).toHaveBeenCalledWith(
      'user-1/avatar.jpg',
      compressed,
      { upsert: true }
    )
    expect(url).toBe('https://cdn.example.com/user-1/avatar.jpg')
  })

  it('throws when storage upload returns an error', async () => {
    const file = new File(['data'], 'photo.png', { type: 'image/png' })
    const compressed = new File(['compressed'], 'photo.png', { type: 'image/png' })
    mockImageCompression.mockResolvedValueOnce(compressed)
    mockSupabase.storage.upload.mockResolvedValueOnce({
      data: null,
      error: { message: 'Storage upload failed' },
    })

    await expect(uploadAvatar('user-1', file)).rejects.toThrow('Storage upload failed')
  })
})
