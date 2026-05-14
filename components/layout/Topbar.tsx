'use client'

import { usePathname } from 'next/navigation'
import { IconSearch } from '@tabler/icons-react'
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
  const { profile, workspace } = useAuth()
  const { setCommandPaletteOpen } = useUI()

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

        {/* Avatar */}
        <div
          aria-label={profile?.display_name ?? 'User avatar'}
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
          style={{ background: '#003D52' }}
        >
          {initial}
        </div>
      </div>
    </header>
  )
}
