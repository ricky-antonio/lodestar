'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { IconSearch } from '@tabler/icons-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/lib/context/AuthContext'
import { useUI } from '@/lib/context/UIContext'

const VIEW_LABELS: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/inbox':     'Inbox',
  '/my-day':   'My Day',
  '/matrix':   'Matrix',
}

export function Topbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { profile, workspace, signOut } = useAuth()
  const { setCommandPaletteOpen } = useUI()

  async function handleSignOut() {
    await signOut()
    router.push('/login')
  }

  const viewTitle =
    VIEW_LABELS[pathname] ??
    Object.entries(VIEW_LABELS).find(([k]) => pathname.startsWith(k + '/'))?.at(1) ??
    'lodestar'

  const initial = profile?.display_name?.[0]?.toUpperCase() ?? '?'

  return (
    <header
      data-testid="topbar"
      className="flex items-center justify-between px-4 shrink-0"
      style={{
        height: 46,
        background: 'var(--surface)',
        borderBottom: '0.5px solid var(--border)',
      }}
    >
      {/* Breadcrumb / title */}
      <div className="flex items-center gap-2 text-sm">
        {workspace && (
          <>
            <span className="text-[var(--tx-3)]">{workspace.name}</span>
            <span className="text-[var(--tx-3)]">/</span>
          </>
        )}
        <span className="font-medium text-[var(--tx-1)]">{viewTitle}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setCommandPaletteOpen(true)}
          aria-label="Search"
          className="p-1.5 rounded text-[var(--tx-3)] hover:text-[var(--tx-1)] hover:bg-[var(--surface-2)] transition-colors"
        >
          <IconSearch size={18} />
        </button>

        {/* Avatar dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label="User menu"
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0 hover:opacity-80 transition-opacity"
              style={{ background: '#003D52' }}
            >
              {initial}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem asChild>
              <Link href="/settings/profile">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleSignOut} className="text-red-500 focus:text-red-500">
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
