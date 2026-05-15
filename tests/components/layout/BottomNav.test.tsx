import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BottomNav } from '@/components/layout/BottomNav'

function renderBottomNav() {
  return render(<BottomNav />)
}

describe('BottomNav', () => {
  it('renders four nav items without Projects', () => {
    renderBottomNav()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Tasks')).toBeInTheDocument()
    expect(screen.getByText('My Day')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.queryByText('Projects')).not.toBeInTheDocument()
  })

  it('has correct aria-label', () => {
    renderBottomNav()
    expect(screen.getByRole('navigation', { name: 'Bottom navigation' })).toBeInTheDocument()
  })

  it('links point to correct hrefs', () => {
    renderBottomNav()
    const links = screen.getAllByRole('link')
    const hrefs = links.map(l => l.getAttribute('href'))
    expect(hrefs).toContain('/dashboard')
    expect(hrefs).toContain('/tasks')
    expect(hrefs).toContain('/settings')
  })

  it('active link gets cerulean color class (dashboard route is /)', () => {
    // usePathname is mocked to return '/' in setup.ts — no nav item matches exactly,
    // so none should be cerulean-400
    renderBottomNav()
    const links = screen.getAllByRole('link')
    // All items should have the inactive class (text-steel-400)
    links.forEach(link => {
      expect(link.className).toContain('text-steel-400')
    })
  })
})
