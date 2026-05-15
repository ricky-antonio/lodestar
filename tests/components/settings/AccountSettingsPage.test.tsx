import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AccountSettingsPage from '@/app/(app)/settings/account/page'

const mockSignOut = vi.fn()
const mockPush = vi.fn()

vi.mock('@/lib/context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  updateEmail: vi.fn(),
  sendPasswordReset: vi.fn(),
  deleteAccount: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

import { useAuth } from '@/lib/context/AuthContext'
import { updateEmail, sendPasswordReset, deleteAccount } from '@/lib/auth'

const mockUseAuth = vi.mocked(useAuth)
const mockUpdateEmail = vi.mocked(updateEmail)
const mockSendPasswordReset = vi.mocked(sendPasswordReset)
const mockDeleteAccount = vi.mocked(deleteAccount)

function setupAuth(identities: Array<{ provider: string }> = [{ provider: 'email' }]) {
  mockUseAuth.mockReturnValue({
    user: {
      id: 'user-1',
      email: 'alice@example.com',
      identities,
    } as never,
    profile: null,
    workspace: null,
    member: null,
    loading: false,
    signOut: mockSignOut,
    toggleTheme: vi.fn(),
    updateProfile: vi.fn(),
    setWorkspace: vi.fn(),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  setupAuth()
})

describe('AccountSettingsPage', () => {
  it('renders the current email address', () => {
    render(<AccountSettingsPage />)
    expect(screen.getByText('alice@example.com')).toBeInTheDocument()
  })

  it('calls updateEmail when "Send confirmation" is clicked', async () => {
    mockUpdateEmail.mockResolvedValueOnce(undefined)
    const user = userEvent.setup()
    render(<AccountSettingsPage />)

    await user.click(screen.getByRole('button', { name: /change email/i }))
    const input = screen.getByLabelText(/new email address/i)
    await user.type(input, 'new@example.com')
    await user.click(screen.getByRole('button', { name: /send confirmation/i }))

    await waitFor(() => {
      expect(mockUpdateEmail).toHaveBeenCalledWith('new@example.com')
    })
    expect(await screen.findByText(/confirmation sent to new@example.com/i)).toBeInTheDocument()
  })

  it('calls sendPasswordReset when "Change password" is clicked', async () => {
    mockSendPasswordReset.mockResolvedValueOnce(undefined)
    const user = userEvent.setup()
    render(<AccountSettingsPage />)

    await user.click(screen.getByRole('button', { name: /change password/i }))

    await waitFor(() => {
      expect(mockSendPasswordReset).toHaveBeenCalledWith('alice@example.com')
    })
    expect(await screen.findByText(/reset link sent/i)).toBeInTheDocument()
  })

  it('shows "Set a password" label for Google-only accounts', () => {
    setupAuth([{ provider: 'google' }])
    render(<AccountSettingsPage />)
    expect(screen.getByRole('button', { name: /set a password/i })).toBeInTheDocument()
  })

  it('keeps the confirm button disabled until "delete" is typed', async () => {
    const user = userEvent.setup()
    render(<AccountSettingsPage />)

    await user.click(screen.getByRole('button', { name: /delete account/i }))

    const confirmBtn = await screen.findByRole('button', { name: /^delete account$/i })
    expect(confirmBtn).toBeDisabled()

    const confirmInput = screen.getByLabelText(/type delete to confirm/i)
    await user.type(confirmInput, 'delet')
    expect(confirmBtn).toBeDisabled()

    await user.type(confirmInput, 'e')
    expect(confirmBtn).not.toBeDisabled()
  })

  it('calls deleteAccount, signOut, and redirects on confirm', async () => {
    mockDeleteAccount.mockResolvedValueOnce(undefined)
    mockSignOut.mockResolvedValueOnce(undefined)
    const user = userEvent.setup()
    render(<AccountSettingsPage />)

    await user.click(screen.getByRole('button', { name: /delete account/i }))
    const confirmInput = await screen.findByLabelText(/type delete to confirm/i)
    await user.type(confirmInput, 'delete')
    await user.click(screen.getByRole('button', { name: /^delete account$/i }))

    await waitFor(() => {
      expect(mockDeleteAccount).toHaveBeenCalledWith('user-1')
      expect(mockSignOut).toHaveBeenCalled()
      expect(mockPush).toHaveBeenCalledWith('/login?deleted=true')
    })
  })
})
