import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProfileSettingsPage from '@/app/(app)/settings/profile/page'
import type { Profile } from '@/lib/types'

const mockUpdateProfile = vi.fn()
const mockPushUndo = vi.fn()

vi.mock('@/lib/context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@/lib/context/UIContext', () => ({
  useUI: vi.fn(),
}))

vi.mock('@/lib/profile', () => ({
  updateDisplayName: vi.fn(),
  updateAvatar: vi.fn(),
  uploadAvatar: vi.fn(),
}))

import { useAuth } from '@/lib/context/AuthContext'
import { useUI } from '@/lib/context/UIContext'
import { updateDisplayName, updateAvatar, uploadAvatar } from '@/lib/profile'

const mockUseAuth = vi.mocked(useAuth)
const mockUseUI = vi.mocked(useUI)
const mockUpdateDisplayName = vi.mocked(updateDisplayName)
const mockUpdateAvatar = vi.mocked(updateAvatar)
const mockUploadAvatar = vi.mocked(uploadAvatar)

function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: 'user-1',
    display_name: 'Alice',
    avatar_url: null,
    theme: 'light',
    updated_at: '',
    ...overrides,
  }
}

function setupAuth(profileOverrides: Partial<Profile> = {}) {
  mockUseAuth.mockReturnValue({
    user: { id: 'user-1', email: 'alice@example.com' } as never,
    profile: makeProfile(profileOverrides),
    workspace: null,
    member: null,
    loading: false,
    signOut: vi.fn(),
    toggleTheme: vi.fn(),
    updateProfile: mockUpdateProfile,
    setWorkspace: vi.fn(),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  setupAuth()
  mockUseUI.mockReturnValue({
    pushUndo: mockPushUndo,
    undoStack: [],
    dismissUndo: vi.fn(),
    activeView: 'list',
    setActiveView: vi.fn(),
    detailTaskId: null,
    openDetail: vi.fn(),
    closeDetail: vi.fn(),
    commandPaletteOpen: false,
    setCommandPaletteOpen: vi.fn(),
    sidebarCollapsed: false,
    setSidebarCollapsed: vi.fn(),
    isCreating: false,
    createDefaults: null,
    openCreate: vi.fn(),
  })
})

describe('ProfileSettingsPage', () => {
  it('renders the display name input pre-filled with the profile value', () => {
    render(<ProfileSettingsPage />)
    const input = screen.getByRole('textbox', { name: /display name/i })
    expect(input).toHaveValue('Alice')
  })

  it('shows a validation error when saving an empty display name', async () => {
    const user = userEvent.setup()
    render(<ProfileSettingsPage />)
    const input = screen.getByRole('textbox', { name: /display name/i })
    await user.clear(input)
    await user.click(screen.getByRole('button', { name: /save/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/cannot be empty/i)
    expect(mockUpdateDisplayName).not.toHaveBeenCalled()
  })

  it('calls updateDisplayName with the new name when saving a valid display name', async () => {
    mockUpdateDisplayName.mockResolvedValueOnce(undefined)
    const user = userEvent.setup()
    render(<ProfileSettingsPage />)
    const input = screen.getByRole('textbox', { name: /display name/i })
    await user.clear(input)
    await user.type(input, 'Bob')
    await user.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => {
      expect(mockUpdateDisplayName).toHaveBeenCalledWith('user-1', 'Bob')
    })
    expect(mockUpdateProfile).toHaveBeenCalledWith({ display_name: 'Bob' })
  })

  it('shows "Saved" feedback after a successful display name save', async () => {
    mockUpdateDisplayName.mockResolvedValueOnce(undefined)
    const user = userEvent.setup()
    render(<ProfileSettingsPage />)
    await user.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => {
      expect(screen.getByText('Saved')).toBeInTheDocument()
    })
  })

  it('reverts the profile and shows an error toast when updateDisplayName fails', async () => {
    mockUpdateDisplayName.mockRejectedValueOnce(new Error('DB error'))
    const user = userEvent.setup()
    render(<ProfileSettingsPage />)
    const input = screen.getByRole('textbox', { name: /display name/i })
    await user.clear(input)
    await user.type(input, 'Bob')
    await user.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => {
      expect(mockPushUndo).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Failed to save display name' })
      )
    })
    expect(mockUpdateProfile).toHaveBeenCalledWith({ display_name: 'Alice' })
  })

  it('triggers uploadAvatar and updateAvatar when a file is selected', async () => {
    mockUploadAvatar.mockResolvedValueOnce('https://cdn.example.com/avatar.jpg')
    mockUpdateAvatar.mockResolvedValueOnce(undefined)

    render(<ProfileSettingsPage />)
    const input = screen.getByTestId('avatar-input')
    const file = new File(['img'], 'avatar.jpg', { type: 'image/jpeg' })
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(mockUploadAvatar).toHaveBeenCalledWith('user-1', file)
      expect(mockUpdateAvatar).toHaveBeenCalledWith('user-1', 'https://cdn.example.com/avatar.jpg')
    })
    expect(mockUpdateProfile).toHaveBeenCalledWith({
      avatar_url: 'https://cdn.example.com/avatar.jpg',
    })
  })

  it('reverts avatar and shows a toast when uploadAvatar fails', async () => {
    mockUploadAvatar.mockRejectedValueOnce(new Error('Storage error'))
    setupAuth({ avatar_url: 'https://old.example.com/avatar.jpg' })

    render(<ProfileSettingsPage />)
    const input = screen.getByTestId('avatar-input')
    const file = new File(['img'], 'avatar.jpg', { type: 'image/jpeg' })
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(mockPushUndo).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Failed to upload photo' })
      )
    })
    expect(mockUpdateProfile).toHaveBeenCalledWith({
      avatar_url: 'https://old.example.com/avatar.jpg',
    })
  })

  it('shows an initials circle when no avatar_url is set', () => {
    render(<ProfileSettingsPage />)
    expect(screen.getByText('AL')).toBeInTheDocument()
  })

  it('renders an img element when avatar_url is set', () => {
    setupAuth({ avatar_url: 'https://example.com/photo.jpg' })
    render(<ProfileSettingsPage />)
    const img = screen.getByRole('img', { name: /avatar/i })
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg')
  })
})
