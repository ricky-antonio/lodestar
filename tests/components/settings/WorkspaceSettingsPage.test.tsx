import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import WorkspaceSettingsPage from '@/app/(app)/settings/workspace/page'
import type { Workspace, WorkspaceMember } from '@/lib/types'

const mockSetWorkspace = vi.fn()
const mockPushUndo = vi.fn()

vi.mock('@/lib/context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@/lib/context/UIContext', () => ({
  useUI: vi.fn(),
}))

vi.mock('@/lib/workspace', () => ({
  updateWorkspace: vi.fn(),
}))

import { useAuth } from '@/lib/context/AuthContext'
import { useUI } from '@/lib/context/UIContext'
import { updateWorkspace } from '@/lib/workspace'

const mockUseAuth = vi.mocked(useAuth)
const mockUseUI = vi.mocked(useUI)
const mockUpdateWorkspace = vi.mocked(updateWorkspace)

const mockWorkspace: Workspace = {
  id: 'ws-1',
  name: 'Acme Corp',
  slug: 'acme-corp',
  color: '#00B6EC',
  owner_id: 'user-1',
  timezone: 'America/New_York',
  end_of_day_time: '17:00',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const ownerMember: WorkspaceMember = {
  id: 'member-1',
  workspace_id: 'ws-1',
  user_id: 'user-1',
  role: 'owner',
  joined_at: '2024-01-01T00:00:00Z',
}

const viewerMember: WorkspaceMember = {
  ...ownerMember,
  role: 'viewer',
}

function setupAuth(member: WorkspaceMember = ownerMember, ws: Workspace = mockWorkspace) {
  mockUseAuth.mockReturnValue({
    user: { id: 'user-1' } as never,
    profile: null,
    workspace: ws,
    member,
    loading: false,
    signOut: vi.fn(),
    toggleTheme: vi.fn(),
    updateProfile: vi.fn(),
    setWorkspace: mockSetWorkspace,
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
    projectCreateOpen: false,
    openProjectCreate: vi.fn(),
    closeProjectCreate: vi.fn(),
  })
})

describe('WorkspaceSettingsPage', () => {
  it('renders the current workspace name in the input', () => {
    render(<WorkspaceSettingsPage />)
    const input = screen.getByRole('textbox', { name: /workspace name/i })
    expect(input).toHaveValue('Acme Corp')
  })

  it('non-owner sees a read-only view with owner-only message', () => {
    setupAuth(viewerMember)
    render(<WorkspaceSettingsPage />)
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    expect(screen.getByText(/only workspace owners can edit/i)).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: /workspace name/i })).not.toBeInTheDocument()
  })

  it('calls updateWorkspace with name when Save is clicked', async () => {
    mockUpdateWorkspace.mockResolvedValueOnce({ ...mockWorkspace, name: 'New Name' })
    const user = userEvent.setup()
    render(<WorkspaceSettingsPage />)

    const input = screen.getByRole('textbox', { name: /workspace name/i })
    await user.clear(input)
    await user.type(input, 'New Name')
    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(mockUpdateWorkspace).toHaveBeenCalledWith('ws-1', { name: 'New Name' })
    })
    expect(mockSetWorkspace).toHaveBeenCalled()
  })

  it('calls updateWorkspace with color when a preset swatch is clicked', async () => {
    mockUpdateWorkspace.mockResolvedValueOnce({ ...mockWorkspace, color: '#009AC8' })
    const user = userEvent.setup()
    render(<WorkspaceSettingsPage />)

    await user.click(screen.getByRole('button', { name: /color #009AC8/i }))

    await waitFor(() => {
      expect(mockUpdateWorkspace).toHaveBeenCalledWith('ws-1', { color: '#009AC8' })
    })
    expect(mockSetWorkspace).toHaveBeenCalled()
  })

  it('calls updateWorkspace with timezone when the select changes', async () => {
    mockUpdateWorkspace.mockResolvedValueOnce({ ...mockWorkspace, timezone: 'Europe/London' })
    const user = userEvent.setup()
    render(<WorkspaceSettingsPage />)

    await user.selectOptions(screen.getByRole('combobox', { name: /timezone/i }), 'Europe/London')

    await waitFor(() => {
      expect(mockUpdateWorkspace).toHaveBeenCalledWith('ws-1', { timezone: 'Europe/London' })
    })
    expect(mockSetWorkspace).toHaveBeenCalled()
  })

  it('reverts workspace and shows toast when name save fails', async () => {
    mockUpdateWorkspace.mockRejectedValueOnce(new Error('DB error'))
    const user = userEvent.setup()
    render(<WorkspaceSettingsPage />)

    const input = screen.getByRole('textbox', { name: /workspace name/i })
    await user.clear(input)
    await user.type(input, 'Bad Name')
    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(mockSetWorkspace).toHaveBeenCalledWith(
        expect.objectContaining({ name: mockWorkspace.name })
      )
      expect(mockPushUndo).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Failed to save workspace name' })
      )
    })
  })
})
