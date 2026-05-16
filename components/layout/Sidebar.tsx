'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  IconLayoutDashboard,
  IconChecklist,
  IconSun,
  IconLayoutGrid,
  IconChevronLeft,
  IconChevronRight,
  IconSettings,
} from '@tabler/icons-react'
import { useAuth } from '@/lib/context/AuthContext'
import { useUI } from '@/lib/context/UIContext'
import { useProjects } from '@/lib/context/ProjectsContext'
import { ProjectSwitcher } from './ProjectSwitcher'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: IconLayoutDashboard },
  { href: '/tasks',     label: 'Tasks',     icon: IconChecklist },
  { href: '/my-day',   label: 'My Day',    icon: IconSun },
  { href: '/matrix',   label: 'Matrix',    icon: IconLayoutGrid },
]

export function Sidebar() {
  const pathname = usePathname()
  const { workspace } = useAuth()
  const { sidebarCollapsed, setSidebarCollapsed } = useUI()
  const { projects } = useProjects()
  const hasProjects = projects.length > 0
  const visibleNav = hasProjects ? NAV_ITEMS : NAV_ITEMS.filter(i => i.href === '/dashboard')

  return (
    <aside
      aria-label="Sidebar"
      data-testid="sidebar"
      style={{ background: '#061419', width: sidebarCollapsed ? 56 : 240 }}
      className="hidden md:flex flex-col h-full shrink-0 transition-all duration-150"
    >
      {/* Workspace name + collapse toggle */}
      <div className="flex items-center justify-between px-3 h-12 shrink-0">
        {!sidebarCollapsed && (
          <span className="text-sm font-semibold text-cerulean-400 truncate">
            {workspace?.name ?? 'lodestar'}
          </span>
        )}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="p-1 rounded text-steel-400 hover:text-steel-100 hover:bg-white/5 transition-colors ml-auto"
        >
          {sidebarCollapsed
            ? <IconChevronRight size={16} />
            : <IconChevronLeft size={16} />
          }
        </button>
      </div>

      {/* Project switcher — highlighted when viewing a project board */}
      <div
        className="px-2 pb-2"
        style={{
          borderBottom: '0.5px solid #1F3D4A',
          ...(pathname.startsWith('/projects/') ? {
            borderLeft: '2px solid #00B6EC',
            paddingLeft: 6,
            background: 'rgba(0,182,236,0.06)',
            borderRadius: 6,
          } : {}),
        }}
      >
        <ProjectSwitcher collapsed={sidebarCollapsed} />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 pt-2 space-y-0.5">
        {visibleNav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              aria-label={sidebarCollapsed ? label : undefined}
              className={[
                'flex items-center gap-2.5 px-2 py-2 rounded text-sm transition-colors',
                active
                  ? 'bg-[rgba(0,182,236,0.12)] text-cerulean-400'
                  : 'text-steel-400 hover:bg-white/[0.04] hover:text-steel-100',
              ].join(' ')}
            >
              <Icon size={18} className="shrink-0" />
              {!sidebarCollapsed && <span className="truncate">{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Settings — pinned to bottom */}
      <div className="px-2 pb-3 shrink-0" style={{ borderTop: '0.5px solid #1F3D4A' }}>
        <Link
          href="/settings/profile"
          aria-label={sidebarCollapsed ? 'Settings' : undefined}
          className={[
            'flex items-center gap-2.5 px-2 py-2 rounded text-sm transition-colors mt-1',
            pathname.startsWith('/settings')
              ? 'bg-[rgba(0,182,236,0.12)] text-cerulean-400'
              : 'text-steel-400 hover:bg-white/[0.04] hover:text-steel-100',
          ].join(' ')}
        >
          <IconSettings size={18} className="shrink-0" />
          {!sidebarCollapsed && <span className="truncate">Settings</span>}
        </Link>
      </div>
    </aside>
  )
}
