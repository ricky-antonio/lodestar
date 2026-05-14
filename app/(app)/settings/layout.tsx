'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { href: '/settings/profile',   label: 'Profile' },
  { href: '/settings/account',   label: 'Account' },
  { href: '/settings/workspace', label: 'Workspace' },
]

function navLinkClass(active: boolean) {
  return [
    'flex items-center px-2 py-2 rounded text-sm transition-colors',
    active
      ? 'bg-[rgba(0,182,236,0.12)] text-cerulean-400'
      : 'text-steel-400 hover:bg-white/[0.04] hover:text-steel-100',
  ].join(' ')
}

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex h-full">
      {/* Desktop left sidebar nav */}
      <nav
        aria-label="Settings navigation"
        data-testid="settings-nav-desktop"
        style={{ background: '#061419', width: 200 }}
        className="hidden md:flex flex-col shrink-0 py-4 px-2 gap-0.5"
      >
        <p className="px-2 mb-2 text-[11px] font-medium uppercase tracking-widest text-steel-400">
          Settings
        </p>
        {NAV_LINKS.map(({ href, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href} className={navLinkClass(active)}>
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile horizontal tab strip */}
        <nav
          aria-label="Settings navigation"
          data-testid="settings-nav-mobile"
          className="md:hidden flex"
          style={{ background: '#061419', borderBottom: '0.5px solid var(--border)' }}
        >
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={[
                  'flex-1 text-center py-3 text-sm font-medium transition-colors border-b-2',
                  active
                    ? 'text-cerulean-400 border-cerulean-400'
                    : 'text-steel-400 border-transparent hover:text-steel-100',
                ].join(' ')}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Page content */}
        <div data-testid="settings-content" className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  )
}
