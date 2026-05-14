'use client'

import { useState, useRef } from 'react'
import { IconLoader2 } from '@tabler/icons-react'
import { useAuth } from '@/lib/context/AuthContext'
import { useUI } from '@/lib/context/UIContext'
import { updateDisplayName, updateAvatar, uploadAvatar } from '@/lib/profile'

function getInitials(displayName: string | null, email: string | undefined): string {
  const source = displayName ?? email ?? '?'
  const words = source.trim().split(/\s+/).filter(Boolean)
  if (words.length >= 2) {
    return ((words[0][0] ?? '') + (words[1][0] ?? '')).toUpperCase()
  }
  return source.slice(0, 2).toUpperCase()
}

export default function ProfileSettingsPage() {
  const { user, profile, updateProfile } = useAuth()
  const { pushUndo } = useUI()

  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [nameError, setNameError] = useState('')
  const [nameSaved, setNameSaved] = useState(false)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const initials = getInitials(profile?.display_name ?? null, user?.email)

  const handleNameSave = async () => {
    if (!user) return
    const trimmed = displayName.trim()
    if (trimmed.length < 1) {
      setNameError('Display name cannot be empty')
      return
    }
    if (trimmed.length > 50) {
      setNameError('Display name must be 50 characters or less')
      return
    }
    setNameError('')
    const prev = profile?.display_name ?? null
    updateProfile({ display_name: trimmed })
    try {
      await updateDisplayName(user.id, trimmed)
      setNameSaved(true)
      setTimeout(() => setNameSaved(false), 2000)
    } catch {
      updateProfile({ display_name: prev })
      pushUndo({ label: 'profile-name-error', message: 'Failed to save display name' })
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !profile) return
    const file = e.target.files?.[0]
    if (!file) return
    const prevAvatarUrl = profile.avatar_url
    setAvatarLoading(true)
    try {
      const url = await uploadAvatar(user.id, file)
      updateProfile({ avatar_url: url })
      await updateAvatar(user.id, url)
    } catch {
      updateProfile({ avatar_url: prevAvatarUrl })
      pushUndo({ label: 'profile-avatar-error', message: 'Failed to upload photo' })
    } finally {
      setAvatarLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="p-6 max-w-lg">
      <h1 className="text-xl font-semibold mb-6" style={{ color: 'var(--tx-1)' }}>
        Profile
      </h1>

      {/* Avatar */}
      <section className="mb-8">
        <p className="text-sm font-medium mb-3" style={{ color: 'var(--tx-2)' }}>
          Photo
        </p>
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Avatar"
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-semibold"
                style={{ background: '#003D52', color: '#00B6EC' }}
              >
                {initials}
              </div>
            )}
            {avatarLoading && (
              <div
                className="absolute inset-0 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(6,20,25,0.6)' }}
                aria-label="Uploading"
              >
                <IconLoader2 size={24} className="animate-spin" style={{ color: '#00B6EC' }} />
              </div>
            )}
          </div>
          <div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarLoading}
              className="text-sm px-3 py-2 rounded transition-colors"
              style={{
                background: 'var(--surface)',
                border: '0.5px solid var(--border-2)',
                color: 'var(--tx-1)',
                borderRadius: 'var(--radius)',
              }}
            >
              Change photo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              aria-label="Upload avatar"
              data-testid="avatar-input"
            />
          </div>
        </div>
      </section>

      {/* Display name */}
      <section>
        <label
          htmlFor="display-name"
          className="block text-sm font-medium mb-2"
          style={{ color: 'var(--tx-2)' }}
        >
          Display name
        </label>
        <div className="flex items-center gap-3">
          <input
            id="display-name"
            type="text"
            value={displayName}
            onChange={e => {
              setDisplayName(e.target.value)
              setNameError('')
              setNameSaved(false)
            }}
            maxLength={50}
            className="flex-1 h-9 px-3 text-sm"
            style={{
              border: '0.5px solid var(--border-2)',
              borderRadius: 'var(--radius)',
              background: 'var(--surface)',
              color: 'var(--tx-1)',
            }}
          />
          <button
            onClick={handleNameSave}
            className="shrink-0 px-4 h-9 rounded text-sm font-medium text-white"
            style={{ background: '#00B6EC', borderRadius: 'var(--radius)' }}
          >
            Save
          </button>
        </div>
        {nameError && (
          <p className="mt-1.5 text-sm" style={{ color: '#EF4444' }} role="alert">
            {nameError}
          </p>
        )}
        {nameSaved && !nameError && (
          <p className="mt-1.5 text-sm" style={{ color: '#22C55E' }}>
            Saved
          </p>
        )}
      </section>
    </div>
  )
}
