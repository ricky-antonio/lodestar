'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  IconLayoutDashboard,
  IconInbox,
  IconSun,
  IconLayoutGrid,
  IconFolder,
  IconChevronLeft,
  IconChevronRight,
  IconCircleFilled,
} from '@tabler/icons-react'
import { useAuth } from '@/lib/context/AuthContext'
import { useProjects } from '@/lib/context/ProjectsContext'
import { useUI } from '@/lib/context/UIContext'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: IconLayoutDashboard },
  { href: '/inbox',     label: 'Inbox',     icon: IconInbox },
  { href: '/my-day',   label: 'My Day',    icon: IconSun },
  { href: '/projects',  label: 'Projects',  icon: IconFolder },
  { href: '/matrix',   label: 'Matrix',    icon: IconLayoutGrid },
]

export function Sidebar() {
  const pathname = usePathname()
  const { workspace } = useAuth()
  const { projects } = useProjects()
  const { sidebarCollapsed, setSidebarCollapsed } = useUI()

  return (
    <aside
      aria-label="Sidebar"
      data-testid="sidebar"
      style={{ background: '#061419', width: sidebarCollapsed ? 56 : 240 }}
      className="hidden md:flex flex-col h-full shrink-0 transition-all duration-150"
    >
      {/* Workspace name */}
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

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 pt-1 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
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

        {/* Project list */}
        {!sidebarCollapsed && projects.length > 0 && (
          <div className="pt-4">
            <p className="px-2 mb-1 text-[11px] font-medium uppercase tracking-widest text-steel-400">
              Projects
            </p>
            {projects.map(project => {
              const active = pathname.startsWith(`/projects/${project.id}`)
              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className={[
                    'flex items-center gap-2.5 px-2 py-1.5 rounded text-sm transition-colors',
                    active
                      ? 'bg-[rgba(0,182,236,0.12)] text-cerulean-400'
                      : 'text-steel-400 hover:bg-white/[0.04] hover:text-steel-100',
                  ].join(' ')}
                >
                  <IconCircleFilled
                    size={7}
                    className="shrink-0"
                    style={{ color: project.color }}
                    aria-hidden
                  />
                  <span className="truncate">{project.name}</span>
                </Link>
              )
            })}
          </div>
        )}
      </nav>
    </aside>
  )
}
