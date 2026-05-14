import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import SettingsLayout from '@/app/(app)/settings/layout'

let mockPathname = '/settings/profile'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => mockPathname,
  useSearchParams: () => new URLSearchParams(),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockPathname = '/settings/profile'
})

function renderLayout(children = <div>page content</div>) {
  return render(<SettingsLayout>{children}</SettingsLayout>)
}

describe('SettingsLayout', () => {
  it('renders Profile, Account, and Workspace nav links', () => {
    renderLayout()
    const desktopNav = screen.getByTestId('settings-nav-desktop')
    expect(within(desktopNav).getByRole('link', { name: 'Profile' })).toBeInTheDocument()
    expect(within(desktopNav).getByRole('link', { name: 'Account' })).toBeInTheDocument()
    expect(within(desktopNav).getByRole('link', { name: 'Workspace' })).toBeInTheDocument()
  })

  it('Profile link is active when pathname is /settings/profile', () => {
    mockPathname = '/settings/profile'
    renderLayout()
    const desktopNav = screen.getByTestId('settings-nav-desktop')
    const profileLink = within(desktopNav).getByRole('link', { name: 'Profile' })
    expect(profileLink).toHaveClass('text-cerulean-400')
    expect(within(desktopNav).getByRole('link', { name: 'Account' })).toHaveClass('text-steel-400')
    expect(within(desktopNav).getByRole('link', { name: 'Workspace' })).toHaveClass('text-steel-400')
  })

  it('Account link is active when pathname is /settings/account', () => {
    mockPathname = '/settings/account'
    renderLayout()
    const desktopNav = screen.getByTestId('settings-nav-desktop')
    expect(within(desktopNav).getByRole('link', { name: 'Account' })).toHaveClass('text-cerulean-400')
    expect(within(desktopNav).getByRole('link', { name: 'Profile' })).toHaveClass('text-steel-400')
  })

  it('Workspace link is active when pathname is /settings/workspace', () => {
    mockPathname = '/settings/workspace'
    renderLayout()
    const desktopNav = screen.getByTestId('settings-nav-desktop')
    expect(within(desktopNav).getByRole('link', { name: 'Workspace' })).toHaveClass('text-cerulean-400')
    expect(within(desktopNav).getByRole('link', { name: 'Profile' })).toHaveClass('text-steel-400')
  })

  it('renders children in the content area', () => {
    renderLayout(<p>child content</p>)
    const content = screen.getByTestId('settings-content')
    expect(within(content).getByText('child content')).toBeInTheDocument()
  })

  it('mobile nav renders the same three links', () => {
    renderLayout()
    const mobileNav = screen.getByTestId('settings-nav-mobile')
    expect(within(mobileNav).getByRole('link', { name: 'Profile' })).toBeInTheDocument()
    expect(within(mobileNav).getByRole('link', { name: 'Account' })).toBeInTheDocument()
    expect(within(mobileNav).getByRole('link', { name: 'Workspace' })).toBeInTheDocument()
  })
})
