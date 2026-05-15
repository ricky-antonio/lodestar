'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  IconLayoutDashboard,
  IconInbox,
  IconSun,
  IconSettings,
} from '@tabler/icons-react'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: IconLayoutDashboard },
  { href: '/inbox',     label: 'Inbox',     icon: IconInbox },
  { href: '/my-day',   label: 'My Day',    icon: IconSun },
  { href: '/settings',  label: 'Settings',  icon: IconSettings },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Bottom navigation"
      data-testid="bottom-nav"
      style={{ background: '#061419' }}
      className="md:hidden fixed bottom-0 inset-x-0 flex items-center justify-around h-14 border-t border-white/10 z-40"
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            className={[
              'flex flex-col items-center gap-0.5 min-w-[44px] min-h-[44px] justify-center px-2 text-[11px] transition-colors',
              active ? 'text-cerulean-400' : 'text-steel-400',
            ].join(' ')}
          >
            <Icon size={22} />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
