'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react'
import { useTheme } from 'next-themes'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Profile, Workspace, WorkspaceMember } from '@/lib/types'

const PROFILE_COLUMNS = 'id, display_name, avatar_url, theme, updated_at'
const MEMBER_COLUMNS = 'id, workspace_id, user_id, role, joined_at'
const WORKSPACE_COLUMNS =
  'id, name, slug, color, owner_id, timezone, end_of_day_time, created_at, updated_at'

interface AuthContextValue {
  user: User | null
  profile: Profile | null
  workspace: Workspace | null
  member: WorkspaceMember | null
  loading: boolean
  signOut: () => Promise<void>
  toggleTheme: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [member, setMember] = useState<WorkspaceMember | null>(null)
  const [loading, setLoading] = useState(true)
  const { setTheme } = useTheme()

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const supabase = createClient()
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser()

        if (cancelled) return
        if (!currentUser) return

        setUser(currentUser)

        const [profileResult, memberResult] = await Promise.all([
          supabase.from('profiles').select(PROFILE_COLUMNS).eq('id', currentUser.id).single(),
          supabase
            .from('workspace_members')
            .select(MEMBER_COLUMNS)
            .eq('user_id', currentUser.id)
            .single(),
        ])

        if (cancelled) return

        const profileData = profileResult?.data
        const memberData = memberResult?.data

        if (profileData) {
          setProfile(profileData)
          if (profileData.theme) setTheme(profileData.theme)
        }

        if (memberData) {
          setMember(memberData)
          const { data: workspaceData } = await supabase
            .from('workspaces')
            .select(WORKSPACE_COLUMNS)
            .eq('id', memberData.workspace_id)
            .single()
          if (!cancelled && workspaceData) setWorkspace(workspaceData)
        }
      } catch {
        // Failed to load user data — treated as logged-out state
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  // setTheme is stable per next-themes contract; empty deps = load once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const signOut = useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setWorkspace(null)
    setMember(null)
  }, [])

  const toggleTheme = useCallback(async () => {
    const next = profile?.theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    if (!profile) return
    setProfile({ ...profile, theme: next })
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
        .update({ theme: next })
        .eq('id', profile.id)
      if (error) {
        setProfile(profile)
        setTheme(profile.theme)
      }
    } catch {
      setProfile(profile)
      setTheme(profile.theme)
    }
  }, [profile, setTheme])

  return (
    <AuthContext.Provider
      value={{ user, profile, workspace, member, loading, signOut, toggleTheme }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
