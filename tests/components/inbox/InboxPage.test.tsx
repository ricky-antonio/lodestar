import { describe, it, expect, vi } from 'vitest'
import '@/tests/mocks/supabase'

const mockRedirect = vi.fn()

vi.mock('next/navigation', () => ({
  redirect: (url: string) => mockRedirect(url),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

describe('InboxPage', () => {
  it('redirects to /tasks', async () => {
    const { default: InboxPage } = await import('@/app/(app)/inbox/page')
    InboxPage()
    expect(mockRedirect).toHaveBeenCalledWith('/tasks')
  })
})
